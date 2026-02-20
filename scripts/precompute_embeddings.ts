import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('📝 Loaded environment variables from .env.local\n');
}

interface Resource {
  id: number;
  title: string;
  description: string;
  url: string;
  type: 'article' | 'template' | 'tool' | 'course' | 'investor';
  tags: string[];
  stage: 'idea' | 'mvp' | 'growth';
  clicks: number;
  likes: number;
}

interface ResourceWithEmbedding extends Resource {
  embedding: number[];
}

const API_KEY = process.env.AI_API_KEY;
const EMBEDDING_API_URL = 'https://open.bigmodel.cn/api/paas/v4/embeddings';

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

async function getEmbedding(text: string): Promise<number[]> {
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
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`);
  }

  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding returned from API');
  }

  return data.data[0].embedding;
}

async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
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
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`API Error: ${data.error.message}`);
  }

  if (!data.data || data.data.length === 0) {
    throw new Error('No embeddings returned from API');
  }

  return data.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index).map((item: { embedding: number[] }) => item.embedding);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('🚀 Starting embedding precomputation...\n');

  const resourcesPath = path.join(__dirname, '..', 'data', 'resources.json');
  const outputPath = path.join(__dirname, '..', 'data', 'resources_with_embeddings.json');

  console.log(`📖 Reading resources from: ${resourcesPath}`);
  
  const resourcesData = fs.readFileSync(resourcesPath, 'utf-8');
  const resources: Resource[] = JSON.parse(resourcesData);
  
  console.log(`✅ Found ${resources.length} resources\n`);

  const resourcesWithEmbeddings: ResourceWithEmbedding[] = [];
  const batchSize = 10;
  const delayBetweenBatches = 1000;

  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    const texts = batch.map(r => `${r.title} ${r.description}`);
    
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resources.length / batchSize)} (resources ${i + 1}-${Math.min(i + batchSize, resources.length)})...`);

    try {
      const embeddings = await getEmbeddingsBatch(texts);
      
      for (let j = 0; j < batch.length; j++) {
        resourcesWithEmbeddings.push({
          ...batch[j],
          embedding: embeddings[j],
        });
      }
      
      console.log(`   ✅ Batch completed\n`);
      
      if (i + batchSize < resources.length) {
        console.log(`   ⏳ Waiting ${delayBetweenBatches}ms before next batch...\n`);
        await sleep(delayBetweenBatches);
      }
    } catch (error) {
      console.error(`   ❌ Batch failed: ${error}`);
      console.log(`   🔄 Falling back to individual processing...\n`);
      
      for (const resource of batch) {
        try {
          const text = `${resource.title} ${resource.description}`;
          const embedding = await getEmbedding(text);
          resourcesWithEmbeddings.push({
            ...resource,
            embedding,
          });
          console.log(`   ✅ Resource ${resource.id}: ${resource.title}`);
          await sleep(200);
        } catch (err) {
          console.error(`   ❌ Failed to process resource ${resource.id}: ${err}`);
        }
      }
    }
  }

  console.log(`\n💾 Saving to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(resourcesWithEmbeddings, null, 2), 'utf-8');
  
  console.log(`\n✨ Done! Processed ${resourcesWithEmbeddings.length}/${resources.length} resources.`);
  console.log(`📊 Output saved to: ${outputPath}`);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
