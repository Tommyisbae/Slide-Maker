import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// @ts-ignore
if (!global.DOMMatrix) {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix { };
}
// @ts-ignore
if (!global.ImageData) {
    // @ts-ignore
    global.ImageData = class ImageData { };
}
// @ts-ignore
if (!global.Path2D) {
    // @ts-ignore
    global.Path2D = class Path2D { };
}
// @ts-ignore
if (!global.Promise.withResolvers) {
    // @ts-ignore
    global.Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

// Helper to safely get the module (handles CJS/ESM interop)
// @ts-ignore
const getModule = (mod) => {
    return mod && mod.__esModule && mod.default ? mod.default : mod;
};

// Load modules
// @ts-ignore
const pdfParser = getModule(require('pdf-parse'));
// @ts-ignore
const officeParser = getModule(require('officeparser'));

export async function POST(req: NextRequest) {
    console.log('[Extract API] Request received');
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('[Extract API] No file provided');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`[Extract API] Processing file: ${file.name} (${file.type})`);
        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        // Determine processing strategy
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            console.log('[Extract API] Using pdf-parse');
            try {
                // In some environments, pdf-parse might be the default export or a named export
                // Based on logs: pdfParser is an object with { PDFParse: [class], ... }
                // We need to find the main entry point. Usually it's the module.exports itself, but here it seems nested.

                let parseFunction = pdfParser;

                // If it's the module object with a default property
                if (parseFunction && parseFunction.default) {
                    parseFunction = parseFunction.default;
                }

                // If it's an object but not a function, looking for known entry points
                if (typeof parseFunction !== 'function') {
                    // Start looking for the main class/function
                    // The log showed `PDFParse: [class (anonymous)]`, let's try that or look for a default
                    if (parseFunction.PDFParse) {
                        console.log('[Extract API] Found PDFParse property, using it.');
                        parseFunction = parseFunction.PDFParse;
                    }
                }

                // If we still don't have a function, try to force it or fail gracefully with more info
                if (typeof parseFunction !== 'function') {
                    console.error('[Extract API] pdfParser is still not a function after checks. Keys:', Object.keys(parseFunction || {}));
                    throw new Error('Internal dependency error: pdf-parse is not a function');
                }

                // In some cases `pdf-parse` export needs to be instantiated if it's a class, 
                // but checking the docs it is usually just called. 
                // However, if it's the class, we might need options? 
                // Standard usage: pdf(dataBuffer).then(...)

                const data = await parseFunction(buffer);
                text = data.text;
            } catch (pdfError) {
                console.error('[Extract API] pdf-parse failed:', pdfError);
                throw new Error('Failed to parse PDF file');
            }
        } else if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else if (
            fileName.endsWith('.pptx') ||
            fileName.endsWith('.ppt') ||
            fileName.endsWith('.odp')
        ) {
            console.log('[Extract API] Using officeparser');
            // OfficeParser is callback-based, check if we can promisify or use async version if available.
            // It seems officeparser.parseOfficeAsync is available in v4+
            try {
                // Check if parseOfficeAsync exists, if not wrap callback
                if (typeof officeParser.parseOfficeAsync === 'function') {
                    const result = await officeParser.parseOfficeAsync(buffer);
                    text = result;
                } else {
                    text = await new Promise((resolve, reject) => {
                        officeParser.parseOffice(buffer, (data: any, err: any) => {
                            if (err) reject(err);
                            else resolve(data);
                        });
                    });
                }
            } catch (e) {
                console.error("OfficeParser failed:", e);
                return NextResponse.json({ error: 'Failed to parse presentation file' }, { status: 500 });
            }
        } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            text = buffer.toString('utf-8');
        } else {
            return NextResponse.json(
                { error: 'Unsupported file type. Please upload PDF, DOCX, PPTX, or TXT.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ text: text.trim() });
    } catch (error) {
        console.error('Error extracting text:', error);
        return NextResponse.json(
            { error: 'Failed to extract text from file' },
            { status: 500 }
        );
    }
}
