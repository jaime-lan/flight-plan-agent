import { handleAIcommunication } from '@/lib/agent/flight-planner';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, conversation } = await req.json();
    const response = await handleAIcommunication(message, conversation);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 