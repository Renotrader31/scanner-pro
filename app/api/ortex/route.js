import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  
  const highShortTickers = ['AMC', 'GME', 'BBBY', 'ATER', 'MULN'];
  const isHighShort = highShortTickers.includes(ticker?.toUpperCase());
  
  const data = {
    ticker,
    shortInterestPercent: isHighShort ? 25 + Math.random() * 20 : 5 + Math.random() * 10,
    utilizationRate: isHighShort ? 85 + Math.random() * 15 : 50 + Math.random() * 30,
    costToBorrow: isHighShort ? 20 + Math.random() * 50 : 1 + Math.random() * 10,
    daystocover: isHighShort ? 2 + Math.random() * 5 : 0.5 + Math.random() * 3
  };
  
  return NextResponse.json({ success: true, data });
}
