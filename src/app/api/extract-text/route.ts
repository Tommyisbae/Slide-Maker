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

// Use require for libraries that don't export default for ESM compatibility
// @ts-ignore
const pdf = require('pdf-parse');
// @ts-ignore
const officeParser = require('officeparser');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';

        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        // Determine processing strategy
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            const data = await pdf(buffer);
            text = data.text;
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
