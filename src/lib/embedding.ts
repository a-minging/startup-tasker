const API_KEY = process.env.AI_API_KEY;
const EMBEDDING_API_URL = 'https://open.bigmodel.cn/api/paas/v4/embeddings';

interface EmbeddingResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
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

export async function getEmbedding(text: string): Promise<number[]> {
  if (!API_KEY) {
    throw new Error('AI_API_KEY must be configured in environment variables');
  }

  const token = generateJwtToken(API_KEY);

  const response = await fetch(EMBEDDING_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: 'embedding-2',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Embedding] Error response:', errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      const errorMsg = errorJson.error?.message || errorJson.message || errorText;
      throw new Error(`API Error (${response.status}): ${errorMsg}`);
    } catch {
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
  }

  const data: EmbeddingResponse = await response.json();

  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`);
  }

  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding returned from API');
  }

  return data.data[0].embedding;
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (!API_KEY) {
    throw new Error('AI_API_KEY must be configured in environment variables');
  }

  const token = generateJwtToken(API_KEY);

  const response = await fetch(EMBEDDING_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: 'embedding-2',
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Embedding] Error response:', errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      const errorMsg = errorJson.error?.message || errorJson.message || errorText;
      throw new Error(`API Error (${response.status}): ${errorMsg}`);
    } catch {
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }
  }

  const data: EmbeddingResponse = await response.json();

  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`);
  }

  if (!data.data || data.data.length === 0) {
    throw new Error('No embeddings returned from API');
  }

  return data.data.sort((a, b) => a.index - b.index).map(item => item.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export function findMostSimilar(
  queryEmbedding: number[],
  embeddings: { id: number | string; embedding: number[] }[],
  topK: number = 5
): { id: number | string; similarity: number }[] {
  const similarities = embeddings.map(item => ({
    id: item.id,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
