import { NextRequest, NextResponse } from 'next/server';
import PptxGenJS from 'pptxgenjs';

interface Slide {
    title: string;
    bullets: string[];
    speakerNotes?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { slides, presentationTitle } = body as { slides: Slide[], presentationTitle?: string };

        if (!slides || !Array.isArray(slides) || slides.length === 0) {
            return NextResponse.json(
                { error: 'Missing or invalid slides data' },
                { status: 400 }
            );
        }

        // Create presentation
        const pptx = new PptxGenJS();
        pptx.author = 'SlideMaker';
        pptx.title = presentationTitle || 'Generated Presentation';
        pptx.subject = 'AI-Generated Educational Slides';

        // Define master slide with consistent styling (Light Mode)
        pptx.defineSlideMaster({
            title: 'MAIN_SLIDE',
            background: { color: 'ffffff' }, // White background
            objects: [
                // Gradient accent bar at top
                { rect: { x: 0, y: 0, w: '100%', h: 0.15, fill: { color: '6366f1' } } },
                // Bottom accent line
                { rect: { x: 0, y: 5.5, w: '100%', h: 0.05, fill: { color: 'e2e8f0' } } }
            ]
        });

        // Title slide
        const titleSlide = pptx.addSlide({ masterName: 'MAIN_SLIDE' });
        titleSlide.addText(presentationTitle || 'Generated Presentation', {
            x: 0.5,
            y: 2,
            w: 9,
            h: 1.5,
            fontSize: 44,
            fontFace: 'Arial',
            color: '1e293b', // Slate 800
            bold: true,
            align: 'center'
        });
        titleSlide.addText('Created with SlideMaker', {
            x: 0.5,
            y: 4,
            w: 9,
            h: 0.5,
            fontSize: 18,
            fontFace: 'Arial',
            color: '64748b', // Slate 500
            align: 'center'
        });

        // Content slides
        slides.forEach((slideData, index) => {
            const slide = pptx.addSlide({ masterName: 'MAIN_SLIDE' });

            // Slide number
            slide.addText(`${index + 1}`, {
                x: 9.2,
                y: 0.3,
                w: 0.5,
                h: 0.4,
                fontSize: 14,
                fontFace: 'Arial',
                color: '94a3b8' // Slate 400
            });

            // Title
            slide.addText(slideData.title, {
                x: 0.5,
                y: 0.5,
                w: 9,
                h: 0.8,
                fontSize: 32,
                fontFace: 'Arial',
                color: '1e293b', // Slate 800
                bold: true
            });

            // Bullet points
            const bulletText = slideData.bullets.map(bullet => ({
                text: bullet,
                options: {
                    fontSize: 18,
                    fontFace: 'Arial',
                    color: '334155', // Slate 700
                    bullet: { type: 'bullet' as const, color: '6366f1' },
                    paraSpaceAfter: 12
                }
            }));

            slide.addText(bulletText, {
                x: 0.5,
                y: 1.5,
                w: 9,
                h: 4,
                valign: 'top'
            });

            // Speaker notes
            if (slideData.speakerNotes) {
                slide.addNotes(slideData.speakerNotes);
            }
        });

        // Generate PowerPoint file
        const pptxBuffer = await pptx.write({ outputType: 'arraybuffer' });

        // Return as downloadable file
        return new NextResponse(pptxBuffer as ArrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${(presentationTitle || 'presentation').replace(/[^a-z0-9]/gi, '_')}.pptx"`,
            },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error generating PowerPoint:', errorMessage);
        return NextResponse.json(
            { error: errorMessage || 'Error generating PowerPoint' },
            { status: 500 }
        );
    }
}
