// API Clients for GPT Image 2 and Seedance 2.0 (via fal.ai)

import { fal } from '@fal-ai/client';

// ===========================================
// fal.ai Configuration
// ===========================================
export function configureFal() {
  if (process.env.FAL_KEY) {
    fal.config({
      credentials: process.env.FAL_KEY,
    });
  }
}

// ===========================================
// GPT Image 2 (OpenAI) Client
// ===========================================
export interface GPTImageRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface GPTImageResponse {
  url: string;
  revisedPrompt?: string;
}

export async function generateImageWithGPT(
  request: GPTImageRequest
): Promise<GPTImageResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1', // GPT Image 2 model
      prompt: request.prompt,
      n: 1,
      size: request.size || '1792x1024',
      quality: request.quality || 'hd',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    url: data.data[0].url || data.data[0].b64_json,
    revisedPrompt: data.data[0].revised_prompt,
  };
}

// ===========================================
// Seedance 2.0 via fal.ai
// ===========================================
export interface SeedanceRequest {
  prompt: string;
  imageUrl?: string;           // Single reference image
  referenceImages?: string[];  // Multiple reference images (@Image1, @Image2, @Image3)
  duration?: number;           // Duration in seconds (default: 5, options: 5, 10)
  aspectRatio?: '16:9' | '9:16' | '1:1';
  seed?: number;               // For reproducibility
  negativePrompt?: string;
}

export interface SeedanceResponse {
  videoUrl: string;
  seed: number;
}

// Seedance 1.0 via fal.ai
export async function generateVideoWithSeedance(
  request: SeedanceRequest
): Promise<SeedanceResponse> {
  configureFal();

  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY is not configured');
  }

  try {
    const result = await fal.subscribe('fal-ai/seedance', {
      input: {
        prompt: request.prompt,
        image_url: request.imageUrl || request.referenceImages?.[0],
        duration: request.duration === 10 ? '10s' : '5s',
        aspect_ratio: request.aspectRatio || '16:9',
        seed: request.seed,
        negative_prompt: request.negativePrompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Seedance generation in progress...');
        }
      },
    });

    const data = result.data as { video: { url: string }; seed?: number };
    return {
      videoUrl: data.video.url,
      seed: data.seed || 0,
    };
  } catch (error) {
    throw new Error(`Seedance API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Seedance 2.0 (Seedance V2) via fal.ai - if available
export async function generateVideoWithSeedanceV2(
  request: SeedanceRequest
): Promise<SeedanceResponse> {
  configureFal();

  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY is not configured');
  }

  try {
    // Note: Model ID may vary - check fal.ai for the latest Seedance V2 model
    const result = await fal.subscribe('fal-ai/seedance-v2', {
      input: {
        prompt: request.prompt,
        image_url: request.imageUrl || request.referenceImages?.[0],
        // For multi-image support (if available in V2)
        reference_images: request.referenceImages,
        duration: request.duration === 10 ? '10s' : '5s',
        aspect_ratio: request.aspectRatio || '16:9',
        seed: request.seed,
        negative_prompt: request.negativePrompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log('Seedance V2 generation in progress...');
        }
      },
    });

    const data = result.data as { video: { url: string }; seed?: number };
    return {
      videoUrl: data.video.url,
      seed: data.seed || 0,
    };
  } catch (error) {
    // Fallback to V1 if V2 is not available
    console.warn('Seedance V2 not available, falling back to V1');
    return generateVideoWithSeedance(request);
  }
}

// ===========================================
// Kling AI via fal.ai (Alternative)
// ===========================================
export interface KlingRequest {
  prompt: string;
  imageUrl: string;  // Required for image-to-video
  duration?: '5' | '10';
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export async function generateVideoWithKling(
  request: KlingRequest
): Promise<SeedanceResponse> {
  configureFal();

  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY is not configured');
  }

  if (!request.imageUrl) {
    throw new Error('imageUrl is required for Kling image-to-video');
  }

  try {
    const result = await fal.subscribe('fal-ai/kling-video/v1.5/pro/image-to-video', {
      input: {
        prompt: request.prompt,
        image_url: request.imageUrl,
        duration: request.duration || '5',
        aspect_ratio: request.aspectRatio || '16:9',
      },
      logs: true,
    });

    const data = result.data as { video: { url: string } };
    return {
      videoUrl: data.video.url,
      seed: 0,
    };
  } catch (error) {
    throw new Error(`Kling API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===========================================
// API Status Check
// ===========================================
export interface APIStatus {
  openai: boolean;
  fal: boolean;
  falKeyPreview?: string;
}

export function checkAPIKeysConfigured(): APIStatus {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    fal: !!process.env.FAL_KEY,
    falKeyPreview: process.env.FAL_KEY
      ? `...${process.env.FAL_KEY.slice(-4)}`
      : undefined,
  };
}

// ===========================================
// Helper: Generate 3 Keyframes then Video
// ===========================================
export interface FullPipelineRequest {
  keyframePrompts: string[];  // 3 prompts for GPT Image 2
  seedancePrompt: string;     // Final video prompt
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface FullPipelineResponse {
  keyframes: GPTImageResponse[];
  video: SeedanceResponse;
}

export async function generateFullPipeline(
  request: FullPipelineRequest
): Promise<FullPipelineResponse> {
  // Step 1: Generate 3 keyframes with GPT Image 2
  const keyframes = await Promise.all(
    request.keyframePrompts.map((prompt) =>
      generateImageWithGPT({
        prompt,
        size: request.aspectRatio === '9:16' ? '1024x1792' : '1792x1024',
        quality: 'hd',
      })
    )
  );

  // Step 2: Generate video with Seedance using keyframes as references
  const video = await generateVideoWithSeedanceV2({
    prompt: request.seedancePrompt,
    referenceImages: keyframes.map((kf) => kf.url),
    aspectRatio: request.aspectRatio || '16:9',
  });

  return {
    keyframes,
    video,
  };
}
