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

        const prompt = `You are an expert presentation designer and educator. Your goal is to transform the provided textbook content into high-quality, engaging presentation slides.

CONTENT TO ANALYZE:
"""
${content}
"""

CRITICAL RULES:
1. **NO VERBATIM COPYING**: Do not just copy-paste text. You must synthesize, summarize, and simplify the information.
2. **STRUCTURE IS KEY**: Every slide MUST use bullet points or numbered lists.
3. **ONE CONCEPT PER SLIDE**: Break down complex topics into multiple slides.
4. **SELF-EXPLANATORY BULLETS**: Each bullet point should be a complete thought, not just a keyword.
5. **SIMPLE LANGUAGE**: Explain as if teaching a student. Remove academic jargon where possible or define it simple terms.
6. **VISUALIZABLE CONTENT**: Write bullet points that are easy to visualize or present.

SLIDE STRUCTURE GUIDELINES:
- **Title**: Catchy and descriptive (e.g., "The 3 Stages of X", "Why Y Matters").
- **Bullets**: 3-5 distinct points. Use numbered lists (1., 2., 3.) for processes or sequences.

RESPONSE FORMAT:
Return ONLY a valid JSON array of slide objects.
[
  {
    "title": "Topic Name",
    "bullets": [
      "First key point explained simply",
      "Second point with a detail",
      "Third point"
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
