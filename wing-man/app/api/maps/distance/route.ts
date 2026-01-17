import { NextRequest, NextResponse } from 'next/server';
import { getDistanceMatrix } from '@/lib/api/googleMaps';

export async function POST(req: NextRequest) {
  try {
    const { origins, destinations, mode } = await req.json();

    if (!origins || !destinations || !Array.isArray(origins) || !Array.isArray(destinations)) {
      return NextResponse.json(
        { error: 'Origins and destinations arrays are required' },
        { status: 400 }
      );
    }

    const results = await getDistanceMatrix(origins, destinations, mode || 'driving');

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Distance matrix error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distances' },
      { status: 500 }
    );
  }
}
