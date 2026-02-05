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

        const prompt = `You are an expert presentation designer and educator. Analyze the following textbook content and create presentation slides.

CONTENT TO ANALYZE:
"""
${content}
"""

CRITICAL RULES:
1. Create AS MANY slides as needed to properly cover ALL the content - there is NO LIMIT.
2. **MAINTAIN DEPTH**: Do not over-simplify complex topics. Keep the technical depth suitable for medical/professional study.
3. **FILTER THE NOISE**: Remove conversational filler, rhetorical questions, and purely introductory transitions (e.g., "It is important to note that..."). Keep the HARD FACTS.
4. **ONE CONCEPT PER SLIDE**: Break down complex topics into multiple slides.
5. **SELF-EXPLANATORY BULLETS**: Each bullet point should be a complete thought, not just a keyword.
6. Use simple, clear language ONLY for connecting words, but keep the technical terminology intact.
7. Define technical terms when they appear if they are obscure.
8. Include speaker notes with additional context.
9. Structure the slides in a logical learning progression.
10. Do NOT skip content - if it's a fact/mechanism/symptom, it belongs on a slide.

RESPONSE FORMAT:
Return ONLY a valid JSON array of slide objects. No markdown, no code blocks, no extra text.
Each slide object must have:
- "title": string (the slide title)
- "bullets": string[] (array of 3-5 bullet points)

Example format:
[
  {
    "title": "Introduction to Topic",
    "bullets": ["First key point explained clearly", "Second important concept", "Third supporting detail"]
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
