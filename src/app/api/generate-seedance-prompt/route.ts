import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { keyframeUrls, concept, mood, additionalNotes, aspectRatio } = await request.json();

    if (!Array.isArray(keyframeUrls) || keyframeUrls.length === 0) {
      return NextResponse.json(
        { error: 'keyframeUrls array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const validUrls: string[] = keyframeUrls.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
    if (validUrls.length === 0) {
      return NextResponse.json({ error: 'No valid keyframe URLs' }, { status: 400 });
    }

    const systemPrompt = `You are a senior AI-video prompt engineer for Seedance 2.0 / Seedance V2 (15-second image-to-video).

Look at the 3 keyframe images provided in order: they are @ Image1 (0-5s opening), @ Image2 (5-10s midpoint), @ Image3 (10-15s ending).

Generate ONE compact Seedance 2.0 prompt with these strict rules:
- Target length: 60–100 words (max 130 only when asset binding is necessary).
- Lead with the subject.
- Use @ Image1 for the opening look, @ Image2 for the midpoint composition, @ Image3 for the ending composition.
- Exactly 3 beats (0-5s, 5-10s, 10-15s).
- Each beat: ONE main action + ONE camera move + ONE dominant lighting/mood cue.
- Include a continuity lock: "Maintain the same [subject], face/body/shape, wardrobe, color palette, environment, and lighting style across the full 15 seconds."
- End with: "Generate the video clean, without grid lines, overlays, or checkerboard patterns from the reference images."
- No excessive prose. No more than 3 major actions. No contradictory camera moves.
- Output ENGLISH text only. No preamble, no explanation, no labels — just the Seedance prompt itself.`;

    const userText = [
      concept ? `Concept: ${concept}` : null,
      mood ? `Mood: ${mood}` : null,
      additionalNotes ? `Notes: ${additionalNotes}` : null,
      aspectRatio ? `Aspect ratio: ${aspectRatio}` : null,
      'Write the Seedance prompt now.',
    ].filter(Boolean).join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              ...validUrls.map((url, idx) => ({
                type: 'image_url' as const,
                image_url: { url, detail: 'low' as const, },
                ...(idx === 0 ? {} : {}),
              })),
            ],
          },
        ],
        max_tokens: 400,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Seedance prompt generation failed');
    }

    const data = await response.json();
    const prompt: string = (data.choices[0]?.message?.content || '').trim();

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Seedance prompt generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
