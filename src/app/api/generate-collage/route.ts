import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const { images, aspectRatio } = await request.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // アスペクト比に応じたサイズを設定
    const isVertical = aspectRatio === '9:16';
    const canvasWidth = isVertical ? 1080 : 1920;
    const canvasHeight = isVertical ? 1920 : 1080;

    // グリッドレイアウトを計算
    const imageCount = Math.min(images.length, 12);
    const { cols, rows } = calculateGrid(imageCount, isVertical);
    const cellWidth = Math.floor(canvasWidth / cols);
    const cellHeight = Math.floor(canvasHeight / rows);

    // 各画像を処理してリサイズ
    const compositeImages = await Promise.all(
      images.slice(0, 12).map(async (imageData: string, index: number) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        // Base64データを処理
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // 画像をリサイズ
        const resizedImage = await sharp(imageBuffer)
          .resize(cellWidth, cellHeight, {
            fit: 'cover',
            position: 'center',
          })
          .toBuffer();

        return {
          input: resizedImage,
          left: col * cellWidth,
          top: row * cellHeight,
        };
      })
    );

    // コラージュを作成
    const collage = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite(compositeImages)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Base64に変換
    const collageBase64 = `data:image/jpeg;base64,${collage.toString('base64')}`;

    return NextResponse.json({
      collageUrl: collageBase64,
      gridSize: { cols, rows },
      imageCount,
    });
  } catch (error) {
    console.error('Collage generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Collage generation failed' },
      { status: 500 }
    );
  }
}

// グリッドサイズを計算
function calculateGrid(count: number, isVertical: boolean): { cols: number; rows: number } {
  if (isVertical) {
    // 縦長: 列を少なめに
    if (count <= 2) return { cols: 1, rows: 2 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 2, rows: 3 };
    if (count <= 9) return { cols: 3, rows: 3 };
    return { cols: 3, rows: 4 };
  } else {
    // 横長: 列を多めに
    if (count <= 2) return { cols: 2, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    if (count <= 9) return { cols: 3, rows: 3 };
    return { cols: 4, rows: 3 };
  }
}
