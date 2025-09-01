import { NextResponse } from 'next/server';

const POLYGON_API_KEY = '75rlu6cWGNnIqqR_x8M384YUjBgGk6kT';
const BASE_URL = 'https://api.polygon.io';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        params.append(key, value);
      }
    });
    params.append('apiKey', POLYGON_API_KEY);

    const url = `${BASE_URL}${endpoint}?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Polygon API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
