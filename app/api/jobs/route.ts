import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.token;
    
    if (!token) {
      throw new Error('API token not configured');
    }

    const response = await fetch(
      `https://web3.career/api/v1?token=${token}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error('Failed to fetch jobs');
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in jobs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
} 