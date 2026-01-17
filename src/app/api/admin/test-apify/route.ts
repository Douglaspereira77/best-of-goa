import { NextRequest, NextResponse } from 'next/server';
import { apifyClient } from '@/lib/services/apify-client';

/**
 * POST /api/admin/test-apify
 * Test Apify API connection and actor
 */
export async function POST(request: NextRequest) {
  try {
    const { searchQuery } = await request.json();

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'searchQuery is required' },
        { status: 400 }
      );
    }

    console.log('[Test Apify] Testing with search:', searchQuery);

    const result = await apifyClient.extractPlaceDetails('test-place-id', searchQuery);

    return NextResponse.json({
      success: true,
      result,
      message: 'Apify test completed'
    });

  } catch (error) {
    console.error('[Test Apify] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
