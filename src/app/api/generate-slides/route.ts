import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export interface Slide {
    title: string;
    bullets: string[];
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { content, apiKey: clientApiKey } = body;

        // Use client-provided key or fall back to server env
        const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Please enter your Gemini API key in the settings.' },
                { status: 400 }
            );
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Missing required field: content' },
                { status: 400 }
            );
        }

        // Initialize Gemini with the API key
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert academic tutor and study companion. Your goal is to prepare the student for deep reading by providing a **comprehensive structural overview** of the provided text.

CONTENT TO ANALYZE:
"""
${content}
"""

CRITICAL RULES:
1. **ROLE: COMPANION, NOT REPLACEMENT**: Do not try to reproduce the entire text verbatim. Instead, build the **mental framework**. Show the student *how* to think about this topic before they read details.
2. **HIGH-YIELD & MNEMONICS**: Actively suggest **mnemonics**, acronyms, or "memory hooks" to help retain lists or complex mechanisms.
3. **NO DUMBING DOWN**: Use professional, academic language. Do not use childish analogies ("imagine the cell is a factory"). Explain concepts clearly using standard terminology.
4. **STRUCTURE OVER NOISE**: precise definitions, clear classifications, and step-by-step mechanisms.
5. **TITLES**: Keep them short and descriptive (Topic Name).
6. **NATURAL FLOW**: Group related concepts logically. Use as many slides as needed to build the framework.

RESPONSE FORMAT:
Return ONLY a valid JSON array of slide objects.
Each slide object must have:
- "title": string (max 6 words)
- "bullets": string[] (3-6 bullet points)

Example format:
[
  {
    "title": "Core Concept: [Topic]",
    "bullets": [
      "Definition: [Precise definition]",
      "Key Mechanism: [How it works]",
      "Mnemonic: 'ABC' stands for..."
    ]
  }
]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

        // Parse and validate JSON
        let slides: Slide[];
        try {
            slides = JSON.parse(text);
            if (!Array.isArray(slides)) {
                throw new Error('Response is not an array');
            }
            // Validate slide structure
            slides = slides.map((slide, index) => ({
                title: slide.title || `Slide ${index + 1}`,
                bullets: Array.isArray(slide.bullets) ? slide.bullets : []
            }));
        } catch (parseError) {
            console.error('Failed to parse AI response:', text);
            return NextResponse.json(
                { error: 'Failed to parse slide data from AI response' },
                { status: 500 }
            );
        }

        return NextResponse.json({ slides });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error generating slides:', errorMessage);

        // Check for API key errors
        if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key')) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check your Gemini API key.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: errorMessage || 'Error generating slides' },
            { status: 500 }
        );
    }
}
