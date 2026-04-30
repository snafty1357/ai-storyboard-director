import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
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

    // GPT-4 Vision でコラージュ画像を分析
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional cinematographer and storyboard artist. Analyze the collage image and create a detailed video prompt for Seedance 2.0 AI video generation.

Your response should be in English and include:
1. A cinematic description of the scene transitions
2. Camera movements (pan, zoom, dolly, etc.)
3. Mood and atmosphere
4. Lighting descriptions
5. Motion elements (what should move and how)

Keep the prompt concise but vivid, around 100-150 words. Focus on creating smooth, cinematic motion from the static images.

IMPORTANT: Do not describe any human faces or identifiable people. Focus on environments, objects, colors, lighting, and abstract motion.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this collage and create a cinematic video prompt for AI video generation. The video should smoothly transition through the scenes shown in the collage.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Image analysis failed');
    }

    const data = await response.json();
    const storyboardPrompt = data.choices[0]?.message?.content || '';

    return NextResponse.json({
      prompt: storyboardPrompt,
    });
  } catch (error) {
    console.error('Collage analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
