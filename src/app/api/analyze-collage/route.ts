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

    // GPT-4 Vision でコラージュ画像を分析（プロンプト + パネル数の検出）
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a professional cinematographer and storyboard artist. Analyze the collage image and return a JSON object with two fields:

- "prompt": a cinematic video prompt for Seedance 2.0 AI video generation, in English, around 100-150 words. Include:
  1. Scene transitions
  2. Camera movements (pan, zoom, dolly, etc.)
  3. Mood and atmosphere
  4. Lighting descriptions
  5. Motion elements (what should move and how)
  Focus on smooth, cinematic motion from the static images. Do not describe any human faces or identifiable people. Focus on environments, objects, colors, lighting, and abstract motion.

- "panelCount": an integer (1-12) representing the number of distinct panels/frames/cuts visible in the collage. Count each separate sub-image/frame. If the collage is a single image without sub-panels, return 1.

Return only valid JSON: {"prompt": "...", "panelCount": N}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this collage. Count the panels and create a cinematic video prompt for AI video generation. Return JSON with "prompt" and "panelCount".'
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
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Image analysis failed');
    }

    const data = await response.json();
    const raw = data.choices[0]?.message?.content || '';

    let storyboardPrompt = '';
    let panelCount: number | null = null;
    try {
      const parsed = JSON.parse(raw);
      storyboardPrompt = typeof parsed.prompt === 'string' ? parsed.prompt : '';
      if (typeof parsed.panelCount === 'number' && Number.isFinite(parsed.panelCount)) {
        panelCount = Math.max(1, Math.min(12, Math.round(parsed.panelCount)));
      }
    } catch {
      // JSON 解析失敗時はテキストをそのままプロンプトとして扱う
      storyboardPrompt = raw;
    }

    return NextResponse.json({
      prompt: storyboardPrompt,
      panelCount,
    });
  } catch (error) {
    console.error('Collage analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
