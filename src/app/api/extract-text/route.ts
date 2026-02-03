import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const apiKey = formData.get('apiKey') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Use client-provided key or fall back to server env
        const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

        if (!finalApiKey) {
            return NextResponse.json(
                { error: 'API key is required for file processing. Please add it in settings.' },
                { status: 401 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString('base64');
        const fileType = file.type;

        console.log(`[Extract API] Processing file with Gemini: ${file.name} (${fileType})`);

        const genAI = new GoogleGenerativeAI(finalApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Extract all the text content from this document.
    
    RULES:
    1. Return ONLY the raw text content.
    2. Do NOT add any conversational filler like "Here is the text" or "Refining the document".
    3. Preserve the structure (headings, lists) where possible using markdown.
    4. If the document is an image or PDF, transcribe it accurately.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: fileType,
                },
            },
        ]);

        const text = result.response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error('Error processing file with Gemini:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process file' },
            { status: 500 }
        );
    }
}
