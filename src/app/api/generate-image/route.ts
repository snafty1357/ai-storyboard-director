import { NextRequest, NextResponse } from 'next/server';

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const ext = mimeType.split('/')[1] || 'png';
  return { blob, ext };
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio, referenceImages } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    // アスペクト比に応じたサイズを設定
    const size = aspectRatio === '9:16' ? '1024x1536' : '1536x1024';

    const refs: string[] = Array.isArray(referenceImages)
      ? referenceImages.filter((u) => typeof u === 'string' && u.length > 0)
      : [];

    let response: Response;

    if (refs.length > 0) {
      // 参照画像がある場合は edits エンドポイントを使用
      const formData = new FormData();
      formData.append('model', 'gpt-image-1');
      formData.append('prompt', prompt);
      formData.append('size', size);
      formData.append('quality', 'low');
      formData.append('n', '1');

      for (let i = 0; i < refs.length; i++) {
        const url = refs[i];
        if (url.startsWith('data:')) {
          const converted = dataUrlToBlob(url);
          if (!converted) continue;
          formData.append('image[]', converted.blob, `ref-${i}.${converted.ext}`);
        } else {
          const r = await fetch(url);
          if (!r.ok) continue;
          const buf = Buffer.from(await r.arrayBuffer());
          const ct = r.headers.get('content-type') || 'image/png';
          const blob = new Blob([new Uint8Array(buf)], { type: ct });
          const ext = ct.split('/')[1] || 'png';
          formData.append('image[]', blob, `ref-${i}.${ext}`);
        }
      }

      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });
    } else {
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: prompt,
          n: 1,
          size: size,
          quality: 'low',
        }),
      });
    }

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Image generation failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const imageData = data.data[0];

    // base64の場合はdata URLに変換
    let imageUrl = imageData.url;
    if (imageData.b64_json) {
      imageUrl = `data:image/png;base64,${imageData.b64_json}`;
    }

    return NextResponse.json({
      url: imageUrl,
      revisedPrompt: imageData.revised_prompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
