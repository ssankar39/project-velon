import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Note: Free image recognition APIs are no longer available
    // Hugging Face deprecated their serverless inference API (api-inference.huggingface.co)
    // Alternative approaches:
    // 1. Use a paid service like Google Cloud Vision, AWS Rekognition, or Azure Computer Vision
    // 2. Self-host a model using Hugging Face Transformers
    // 3. Use manual entry (current fallback)
    
    return NextResponse.json(
      { 
        error: 'Image recognition service temporarily unavailable. Please manually search for your food item.',
        info: 'Free image recognition APIs have been deprecated. Consider using the USDA food search instead.'
      },
      { status: 503 }
    );

  } catch (error) {
    logger.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
