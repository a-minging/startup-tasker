import { NextRequest, NextResponse } from 'next/server';
import { TaskType } from '@/types';
import { getEmbedding, cosineSimilarity } from '@/lib/embedding';
import fs from 'fs';
import path from 'path';

interface RecommendRequest {
  taskTitle: string;
  taskType: TaskType;
  userId?: string;
  likedTags?: string[];
  excludeIds?: number[];
}

interface Resource {
  id: number;
  title: string;
  url: string;
  description: string;
  type: 'article' | 'template' | 'tool' | 'course' | 'investor';
  tags: string[];
  stage: 'idea' | 'mvp' | 'growth';
  clicks: number;
  likes: number;
  embedding?: number[];
}

interface RecommendResponse {
  resources: Array<{
    id: number;
    title: string;
    url: string;
    description: string;
    tags: string[];
  }>;
}

let cachedResources: Resource[] | null = null;

function loadResources(): Resource[] {
  if (cachedResources) {
    return cachedResources;
  }

  try {
    const resourcesPath = path.join(process.cwd(), 'data', 'resources_with_embeddings.json');
    
    if (fs.existsSync(resourcesPath)) {
      const data = fs.readFileSync(resourcesPath, 'utf-8');
      cachedResources = JSON.parse(data);
      console.log(`[Recommend] Loaded ${cachedResources?.length || 0} resources with embeddings`);
      return cachedResources || [];
    }
  } catch (error) {
    console.error('[Recommend] Failed to load resources:', error);
  }

  try {
    const basicPath = path.join(process.cwd(), 'data', 'resources.json');
    if (fs.existsSync(basicPath)) {
      const data = fs.readFileSync(basicPath, 'utf-8');
      cachedResources = JSON.parse(data);
      console.log(`[Recommend] Loaded ${cachedResources?.length || 0} resources without embeddings`);
      return cachedResources || [];
    }
  } catch (error) {
    console.error('[Recommend] Failed to load basic resources:', error);
  }

  return [];
}

const TASK_TYPE_KEYWORDS: Record<TaskType, string[]> = {
  product: ['产品', '设计', '开发', '用户体验', 'UI', 'UX', '需求', '原型', '功能'],
  market: ['市场', '调研', '竞品', '用户', '分析', '问卷', '营销', '推广'],
  finance: ['融资', '投资', '商业计划', '财务', '估值', '股权', 'BP', '路演'],
  team: ['团队', '管理', '协作', '招聘', 'OKR', '沟通', '领导力', '培训'],
  other: ['创业', '管理', '工具', '效率', '学习', '方法', '模板']
};

const TASK_TYPE_TAGS: Record<TaskType, string[]> = {
  product: ['产品', '设计', 'UI/UX', '技术', '架构'],
  market: ['市场研究', '用户调研', '竞品分析', '运营', '数据'],
  finance: ['融资', '投资人', '股权', '财务', '商业计划'],
  team: ['团队管理', '招聘', 'HR', 'OKR', '团队协作'],
  other: ['工具', '方法论', '课程', '模板']
};

function matchByKeywords(
  taskTitle: string,
  taskType: TaskType,
  resources: Resource[],
  likedTags: string[] = []
): Resource[] {
  const typeKeywords = TASK_TYPE_KEYWORDS[taskType] || [];
  const typeTags = TASK_TYPE_TAGS[taskType] || [];
  
  const titleLower = taskTitle.toLowerCase();
  const titleKeywords = titleLower.split(/\s+/).filter(w => w.length > 1);
  
  const scored = resources.map(resource => {
    let score = 0;
    
    const resourceText = `${resource.title} ${resource.description} ${resource.tags.join(' ')}`.toLowerCase();
    
    for (const keyword of titleKeywords) {
      if (resourceText.includes(keyword)) {
        score += 2;
      }
    }
    
    for (const keyword of typeKeywords) {
      if (resourceText.includes(keyword)) {
        score += 1;
      }
    }
    
    for (const tag of typeTags) {
      if (resource.tags.some(t => t.includes(tag) || tag.includes(t))) {
        score += 1.5;
      }
    }
    
    for (const likedTag of likedTags) {
      if (resource.tags.some(t => t.includes(likedTag) || likedTag.includes(t))) {
        score += 2;
      }
    }
    
    if (resource.type === 'template') {
      score += 0.5;
    }
    
    score += Math.log10(resource.clicks + 1) * 0.1;
    score += Math.log10(resource.likes + 1) * 0.15;
    
    return { resource, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.resource);
}

async function matchByEmbedding(
  taskTitle: string,
  taskType: TaskType,
  resources: Resource[],
  likedTags: string[] = []
): Promise<Resource[]> {
  const resourcesWithEmbeddings = resources.filter(r => r.embedding && r.embedding.length > 0);
  
  if (resourcesWithEmbeddings.length === 0) {
    console.log('[Recommend] No embeddings available, falling back to keywords');
    return matchByKeywords(taskTitle, taskType, resources, likedTags);
  }
  
  try {
    const queryText = `${taskTitle} ${TASK_TYPE_TAGS[taskType]?.join(' ') || ''}`;
    const queryEmbedding = await getEmbedding(queryText);
    
    const similarities = resourcesWithEmbeddings.map(resource => ({
      resource,
      similarity: cosineSimilarity(queryEmbedding, resource.embedding!),
    }));
    
    const typeBoost = TASK_TYPE_TAGS[taskType] || [];
    const boosted = similarities.map(item => {
      let adjustedSimilarity = item.similarity;
      
      for (const tag of typeBoost) {
        if (item.resource.tags.some(t => t.includes(tag) || tag.includes(t))) {
          adjustedSimilarity += 0.05;
        }
      }
      
      for (const likedTag of likedTags) {
        if (item.resource.tags.some(t => t.includes(likedTag) || likedTag.includes(t))) {
          adjustedSimilarity += 0.2;
        }
      }
      
      adjustedSimilarity += Math.log10(item.resource.clicks + 1) * 0.01;
      adjustedSimilarity += Math.log10(item.resource.likes + 1) * 0.015;
      
      return { ...item, similarity: adjustedSimilarity };
    });
    
    return boosted
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.resource);
  } catch (error) {
    console.error('[Recommend] Embedding matching failed:', error);
    return matchByKeywords(taskTitle, taskType, resources, likedTags);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendRequest = await request.json();
    
    const { taskTitle, taskType, userId, likedTags, excludeIds } = body;
    
    if (!taskTitle || typeof taskTitle !== 'string') {
      return NextResponse.json(
        { error: 'taskTitle is required and must be a string' },
        { status: 400 }
      );
    }
    
    const validTypes: TaskType[] = ['product', 'market', 'finance', 'team', 'other'];
    if (!taskType || !validTypes.includes(taskType)) {
      return NextResponse.json(
        { error: 'taskType is required and must be a valid type' },
        { status: 400 }
      );
    }
    
    if (taskTitle.trim().length < 2) {
      return NextResponse.json(
        { error: 'taskTitle must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    const resources = loadResources();
    
    if (resources.length === 0) {
      return NextResponse.json(
        { error: 'No resources available' },
        { status: 500 }
      );
    }
    
    const userLikedTags = likedTags || [];
    const excludeIdSet = new Set(excludeIds || []);
    
    if (userId) {
      console.log(`[Recommend] User ${userId} liked tags:`, userLikedTags);
    }
    
    const availableResources = excludeIdSet.size > 0
      ? resources.filter(r => !excludeIdSet.has(r.id))
      : resources;
    
    if (availableResources.length === 0) {
      return NextResponse.json({
        resources: [],
        message: 'All resources have been shown'
      });
    }
    
    let matchedResources: Resource[];
    
    try {
      matchedResources = await matchByEmbedding(taskTitle, taskType, availableResources, userLikedTags);
    } catch (embeddingError) {
      console.error('[Recommend] Embedding service unavailable, using keyword matching:', embeddingError);
      matchedResources = matchByKeywords(taskTitle, taskType, availableResources, userLikedTags);
    }
    
    const response: RecommendResponse = {
      resources: matchedResources.map(r => ({
        id: r.id,
        title: r.title,
        url: r.url,
        description: r.description,
        tags: r.tags,
      })),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[Recommend] API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'AI Resource Recommendation API (Embedding-based with Personalization)',
      usage: {
        method: 'POST',
        body: {
          taskTitle: 'string (required)',
          taskType: 'product | market | finance | team | other (required)',
          userId: 'string (optional)',
          likedTags: 'string[] (optional, user liked tags for personalization)'
        },
        response: {
          resources: [
            {
              id: 'number',
              title: 'string',
              url: 'string',
              description: 'string',
              tags: 'string[]'
            }
          ]
        }
      },
      note: 'Uses semantic similarity with embeddings and personalization based on user liked tags. Falls back to keyword matching if embedding unavailable.'
    }
  );
}
