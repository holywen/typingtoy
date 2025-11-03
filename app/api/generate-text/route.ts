import { NextResponse } from 'next/server';
import { generateTypingText, getWordCount } from '@/lib/utils/textGenerator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minWords = parseInt(searchParams.get('minWords') || '500');
    const maxWords = parseInt(searchParams.get('maxWords') || '1000');

    // Validate parameters
    if (minWords < 100 || maxWords > 2000 || minWords >= maxWords) {
      return NextResponse.json(
        { error: 'Invalid word count parameters' },
        { status: 400 }
      );
    }

    const text = generateTypingText(minWords, maxWords);
    const wordCount = getWordCount(text);

    return NextResponse.json({
      text,
      wordCount,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating text:', error);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 }
    );
  }
}
