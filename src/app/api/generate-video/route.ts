import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';

// 画像にグリッドを焼き込んで人物検出を回避
async function bakeGridOverlay(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const width = meta.width || 1024;
  const height = meta.height || 1024;
  const gridSize = 28;
  const lines: string[] = [];
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="white" stroke-width="2" opacity="0.6"/>`);
  }
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="white" stroke-width="2" opacity="0.6"/>`);
  }
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${lines.join('')}</svg>`;
  return await image
    .composite([{ input: Buffer.from(svg), blend: 'over' }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageUrl, aspectRatio } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY is not configured' },
        { status: 500 }
      );
    }

    // fal.ai の設定
    fal.config({
      credentials: falKey,
    });

    let finalImageUrl = imageUrl;

    // 画像にグリッドを焼き込んでアップロード
    if (imageUrl) {
      try {
        let imageBuffer: Buffer;
        if (imageUrl.startsWith('data:')) {
          const base64Data = imageUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
          imageBuffer = Buffer.from(await res.arrayBuffer());
        }

        // グリッドを焼き込み
        const processedBuffer = await bakeGridOverlay(imageBuffer);
        const blob = new Blob([new Uint8Array(processedBuffer)], { type: 'image/jpeg' });
        const file = new File([blob], 'collage.jpg', { type: 'image/jpeg' });

        finalImageUrl = await fal.storage.upload(file);
        console.log('Uploaded image URL (with grid):', finalImageUrl);
      } catch (uploadError) {
        console.error('Failed to process/upload image:', uploadError);
        throw new Error('Failed to process image');
      }
    }

    // Seedance 2.0 で動画生成 (Image to Video)
    // ※人物を含む画像はポリシー違反でエラーになる場合があります
    console.log('Starting Seedance 2.0 with image:', finalImageUrl);
    console.log('Prompt:', prompt);

    const result = await fal.subscribe('bytedance/seedance-2.0/image-to-video', {
      input: {
        prompt: prompt,
        image_url: finalImageUrl,
        generate_audio: false,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Seedance 2.0 generating...');
        }
      },
    });

    console.log('Seedance result:', JSON.stringify(result.data, null, 2));

    const data = result.data as { video?: { url: string }; video_url?: string };

    // レスポンス形式に応じてURLを取得
    const videoUrl = data.video?.url || data.video_url || (result.data as Record<string, unknown>).url;

    if (!videoUrl) {
      console.error('No video URL in response:', result.data);
      throw new Error('Video URL not found in response');
    }

    return NextResponse.json({
      videoUrl: videoUrl,
    });
  } catch (error: unknown) {
    console.error('Video generation error:', error);
    // エラーの詳細をログ出力
    if (error && typeof error === 'object' && 'body' in error) {
      console.error('Error body:', JSON.stringify((error as { body: unknown }).body, null, 2));
    }
    const errorMessage = error instanceof Error ? error.message : 'Video generation failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
