import { NextResponse } from 'next/server';
import { fetchAdvancedMovies } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const filters = await request.json();
    const liveMovies = await fetchAdvancedMovies(filters);
    return NextResponse.json(liveMovies);
  } catch (error) {
    return NextResponse.json({ error: "Backend failed" }, { status: 500 });
  }
}
