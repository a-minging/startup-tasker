const API_KEY = process.env.AI_API_KEY;
const API_URL = process.env.AI_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

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

function buildMessages(prompt: string, system?: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  
  messages.push({ role: 'user', content: prompt });
  
  return messages;
}

async function makeRequest(
  messages: ChatMessage[],
  stream: boolean = false
): Promise<Response> {
  if (!API_KEY) {
    throw new Error('AI_API_KEY must be configured in environment variables');
  }

  const token = generateJwtToken(API_KEY);
  
  console.log('[AI] Making request to:', API_URL);
  console.log('[AI] Generated JWT token');

  const requestBody = {
    model: 'glm-4-flash',
    messages,
    stream,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log('[AI] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AI] Error response:', errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      const errorMsg = errorJson.error?.message || errorJson.message || errorText;
      throw new Error(`API Error (${response.status}): ${errorMsg}`);
    } catch {
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
  }

  return response;
}

export async function generateText(
  prompt: string,
  system?: string
): Promise<string> {
  const messages = buildMessages(prompt, system);

  const response = await makeRequest(messages, false);
  const data: OpenAIResponse = await response.json();

  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`);
  }

  return data.choices[0]?.message?.content || '';
}

export function generateStream(
  prompt: string,
  system?: string
): ReadableStream<Uint8Array> {
  const messages = buildMessages(prompt, system);
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await makeRequest(messages, true);

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) continue;
            
            if (trimmedLine === 'data: [DONE]') {
              controller.close();
              return;
            }
            
            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonStr = trimmedLine.slice(6);
                const data: OpenAIStreamChunk = JSON.parse(jsonStr);
                
                if (data.error) {
                  controller.error(new Error(data.error.message));
                  return;
                }
                
                const content = data.choices[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error('Failed to parse stream chunk:', trimmedLine, e);
              }
            }
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function* generateStreamAsync(
  prompt: string,
  system?: string
): AsyncGenerator<string, void, unknown> {
  const messages = buildMessages(prompt, system);

  const response = await makeRequest(messages, true);

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
      
      if (trimmedLine === 'data: [DONE]') {
        return;
      }
      
      if (trimmedLine.startsWith('data: ')) {
        try {
          const jsonStr = trimmedLine.slice(6);
          const data: OpenAIStreamChunk = JSON.parse(jsonStr);
          
          if (data.error) {
            throw new Error(data.error.message);
          }
          
          const content = data.choices[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          console.error('Failed to parse stream chunk:', trimmedLine, e);
        }
      }
    }
  }
}

export async function chat(
  messages: ChatMessage[],
  stream: boolean = false
): Promise<string | ReadableStream<Uint8Array>> {
  const prompt = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
  const system = messages.find(m => m.role === 'system')?.content;
  
  if (stream) {
    return generateStream(prompt, system);
  }

  return generateText(prompt, system);
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[AI] Testing connection...');
    console.log('[AI] API_KEY:', API_KEY ? 'SET' : 'NOT SET');
    console.log('[AI] API_URL:', API_URL);
    
    const result = await generateText('你好，请回复"连接成功"');
    return { 
      success: true, 
      message: `连接成功，AI 回复: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}` 
    };
  } catch (error) {
    console.error('[AI] Connection test failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '连接失败' 
    };
  }
}
