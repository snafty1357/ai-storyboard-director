import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

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

    // base64の場合はfal.storageにアップロード
    if (imageUrl && imageUrl.startsWith('data:')) {
      try {
        // base64をBlobに変換
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(';')[0].split(':')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const file = new File([blob], 'collage.jpg', { type: mimeType });

        // fal.storageにアップロード
        finalImageUrl = await fal.storage.upload(file);
        console.log('Uploaded image URL:', finalImageUrl);
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        throw new Error('Failed to upload image to storage');
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
