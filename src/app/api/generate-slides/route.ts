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
1. **NATURAL FLOW**: Let the content dictate the number of slides. **If a concept is simple, use one slide. If it is dense, span it across multiple slides.**
2. **DO NOT CRAM**: Do not try to fit too much text on one slide. Readability is key.
3. **TITLES**: **KEEP IT SHORT.** Max 3-6 words. No full sentences. Just the topic name.
4. **MAINTAIN DEPTH**: Keep technical details, mechanisms, and definitions. Do not over-simplify.
5. **FILTER NOISE**: Remove conversational filler/fluff ("It is interesting to note..."), but keep the *facts*.
6. **BULLETS**: 3-5 bullets per slide. Self-explanatory.
7. **NO SKIPPING**: Cover the entire provided text.

RESPONSE FORMAT:
Return ONLY a valid JSON array of slide objects.
Each slide object must have:
- "title": string (the slide title)
- "bullets": string[] (array of 3-5 bullet points)

Example format:
[
  {
    "title": "Short Topic Name",
    "bullets": ["First point", "Second point"]
  },
  {
    "title": "Topic Name (Cont.)",
    "bullets": ["Third point", "Fourth point"]
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
