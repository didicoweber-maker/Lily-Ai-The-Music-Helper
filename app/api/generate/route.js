import { NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const RATE_LIMIT_WINDOW = 60000;
const rateLimitMap = new Map();

export async function POST(request) {
  try {
    const { prompt, system, service } = await request.json();

    if (!XAI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const clientIP = request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const rateKey = `${clientIP}-${service || 'default'}`;
    const record = rateLimitMap.get(rateKey) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + RATE_LIMIT_WINDOW;
    }

    record.count++;
    rateLimitMap.set(rateKey, record);

    if (record.count > 1) {
      return NextResponse.json({ error: 'Please wait 1 minute before using this tool again.' }, { status: 429 });
    }

    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-mini',
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 800,
        temperature: 0.9
      })
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'API error' }, { status: 400 });
    }

    const result = data.choices?.[0]?.message?.content || data.output?.text || 'No response from AI.';
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
