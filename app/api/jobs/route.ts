import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.token;
    
    if (!token) {
      console.error('API token not configured');
      return NextResponse.json(
        { error: 'API token not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://web3.career/api/v1?token=${token}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch jobs: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Validate that we received some data
    if (!data) {
      console.error('No data received from API');
      return NextResponse.json(
        { error: 'No data received from API' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in jobs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 