import { NextResponse } from 'next/server';

export async function GET() {
  const status = {
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      keyPreview: process.env.OPENAI_API_KEY
        ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}`
        : null,
    },
    fal: {
      configured: !!process.env.FAL_KEY,
      keyPreview: process.env.FAL_KEY
        ? `...${process.env.FAL_KEY.slice(-4)}`
        : null,
      description: 'Seedance 2.0 via fal.ai',
    },
  };

  return NextResponse.json(status);
}
