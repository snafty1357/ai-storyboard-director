import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json();

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'images array is required' },
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

    const sample = images.slice(0, 4);

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
            content:
              'You are a creative video director. Look at the provided images and suggest ONE concise video theme/concept in Japanese (40-80 characters). Capture the mood, subject, atmosphere, and a hint of narrative. Output ONLY the theme text — no preamble, no labels, no quotes, no explanation.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'これらの画像から15秒映像のテーマを1つ提案してください。' },
              ...sample.map((url: string) => ({
                type: 'image_url' as const,
                image_url: { url, detail: 'low' as const },
              })),
            ],
          },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Theme suggestion failed');
    }

    const data = await response.json();
    const theme: string = (data.choices[0]?.message?.content || '').trim();

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Theme suggestion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
