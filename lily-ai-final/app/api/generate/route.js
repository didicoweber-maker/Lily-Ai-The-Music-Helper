import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBKpMQryjmUEFktXKn-HYDdoVKG_QNIzjY';
const RATE_LIMIT_WINDOW = 60000;
const rateLimitMap = new Map();

export async function POST(request) {
  try {
    const { prompt, system } = await request.json();

    const clientIP = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const record = rateLimitMap.get(clientIP) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + RATE_LIMIT_WINDOW;
    }

    record.count++;
    rateLimitMap.set(clientIP, record);

    if (record.count > 1) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait 1 minute.' },
        { status: 429 }
      );
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: (system ? system + '\n\n' : '') + prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.9 }
        })
      }
    );

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
