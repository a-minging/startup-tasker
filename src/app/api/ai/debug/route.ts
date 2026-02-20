import { NextResponse } from 'next/server';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createHmacSha256(data: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function generateJwtToken(apiKey: string, expireSeconds: number = 3600): string {
  const parts = apiKey.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid API Key format. Expected format: {id}.{secret}');
  }
  
  const [id, secret] = parts;
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'HS256',
    sign_type: 'SIGN'
  };
  
  const payload = {
    api_key: id,
    exp: now + expireSeconds,
    timestamp: now * 1000
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function GET() {
  const API_KEY = process.env.AI_API_KEY;
  const API_URL = process.env.AI_API_URL;
  
  const diagnostics = {
    environment: {
      API_KEY_SET: !!API_KEY,
      API_KEY_LENGTH: API_KEY?.length || 0,
      API_KEY_FORMAT: API_KEY?.includes('.') ? 'VALID (id.secret)' : 'INVALID',
      API_URL: API_URL || 'NOT SET',
    },
    jwt: null as any,
    test: null as any,
  };

  if (!API_KEY) {
    diagnostics.test = {
      success: false,
      error: 'AI_API_KEY is not set in environment variables',
    };
    return NextResponse.json(diagnostics);
  }

  try {
    const token = generateJwtToken(API_KEY);
    diagnostics.jwt = {
      generated: true,
      token_prefix: token.substring(0, 50) + '...',
    };
  } catch (error) {
    diagnostics.jwt = {
      generated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(diagnostics);
  }

  try {
    const token = generateJwtToken(API_KEY);
    
    const response = await fetch(API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [{ role: 'user', content: '你好' }],
        temperature: 0.7,
      }),
    });

    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    diagnostics.test = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
    };

  } catch (error) {
    diagnostics.test = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
