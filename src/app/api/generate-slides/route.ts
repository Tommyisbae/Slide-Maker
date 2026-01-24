import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export interface Slide {
    title: string;
    bullets: string[];
    speakerNotes?: string;
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
1. Create AS MANY slides as needed to properly cover ALL the content - there is NO LIMIT. Could be 5 slides, could be 50, could be 100+. Cover everything thoroughly.
2. Each slide should cover ONE clear concept or topic
3. Each slide needs a concise, descriptive title
4. Each slide should have 3-5 bullet points maximum
5. Bullet points must be SELF-EXPLANATORY - someone who has never read the source material should understand them
6. Avoid cryptic abbreviations or shorthand that requires prior knowledge
7. Use simple, clear language while maintaining accuracy
8. Define technical terms when they appear
9. Include speaker notes with additional context or explanation
10. Structure the slides in a logical learning progression
11. Do NOT skip or summarize content - create slides for EVERYTHING

RESPONSE FORMAT:
Return ONLY a valid JSON array of slide objects. No markdown, no code blocks, no extra text.
Each slide object must have:
- "title": string (the slide title)
- "bullets": string[] (array of 3-5 bullet points)
- "speakerNotes": string (additional context for the presenter)

Example format:
[
  {
    "title": "Introduction to Topic",
    "bullets": ["First key point explained clearly", "Second important concept", "Third supporting detail"],
    "speakerNotes": "This slide introduces..."
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
                bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
                speakerNotes: slide.speakerNotes || ''
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
