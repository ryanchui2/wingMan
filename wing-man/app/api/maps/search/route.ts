import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/api/googleMaps';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const location = searchParams.get('location');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const places = await searchPlaces(query, location || undefined);

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Places search error:', error);
    return NextResponse.json(
      { error: 'Failed to search places' },
      { status: 500 }
    );
  }
}
