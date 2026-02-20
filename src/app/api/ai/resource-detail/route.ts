import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

interface ResourceDetailRequest {
  title: string;
  description: string;
  type?: string;
}

interface ResourceDetailResponse {
  detail: string;
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    console.log(`[ResourceDetail][${requestId}] Received POST request`);
    
    const body: ResourceDetailRequest = await request.json();
    
    const { title, description, type } = body;
    
    console.log(`[ResourceDetail][${requestId}] Request body:`, {
      title: title?.substring(0, 50),
      description: description?.substring(0, 50),
      type,
    });
    
    if (!title || typeof title !== 'string') {
      console.warn(`[ResourceDetail][${requestId}] Validation failed: title is required`);
      return NextResponse.json(
        { error: 'title is required and must be a string' },
        { status: 400 }
      );
    }
    
    if (!description || typeof description !== 'string') {
      console.warn(`[ResourceDetail][${requestId}] Validation failed: description is required`);
      return NextResponse.json(
        { error: 'description is required and must be a string' },
        { status: 400 }
      );
    }
    
    const resourceType = type || '资源';
    
    const prompt = `你是一位经验丰富的创业导师。请为以下创业资源提供详细的介绍和使用建议：

资源标题：${title}
资源描述：${description}
资源类型：${resourceType}

请用流畅的中文，撰写一篇 300-500 字的详细解读，必须包含以下内容：

1. **资源概述**：简要介绍这个资源的核心价值和主要特点
2. **适用场景**：详细说明这个资源适合哪些类型的创业团队、在什么阶段使用效果最佳
3. **使用建议**：提供具体的使用方法和最佳实践，帮助创业者最大化利用这个资源
4. **注意事项**：列出使用过程中需要注意的关键点、可能的陷阱或限制
5. **延伸思考**：结合当前创业环境，给出一些额外的建议或相关资源推荐

要求：
- 语气专业且友好，像一位耐心的导师在指导学员
- 内容实用，避免空泛的描述
- 结构清晰，逻辑连贯
- 字数控制在 300-500 字之间`;

    const systemPrompt = `你是一位经验丰富的创业导师，拥有超过 10 年的创业指导和投资经验。你专注于帮助初创企业和创业者成长，擅长：
- 商业模式分析和优化
- 融资策略和投资人对接
- 团队管理和组织建设
- 市场营销和用户增长

你的回答风格：
- 专业但易于理解，避免过多术语
- 实用且具有可操作性，提供具体建议
- 考虑不同创业阶段和行业的差异
- 善于举一反三，提供延伸思考
- 语气亲切友好，像一位值得信赖的导师`;

    console.log(`[ResourceDetail][${requestId}] Calling AI model...`);
    
    const detail = await generateText(prompt, systemPrompt);
    
    console.log(`[ResourceDetail][${requestId}] AI response received, length: ${detail.length}`);
    
    const response: ResourceDetailResponse = {
      detail,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error(`[ResourceDetail][${requestId}] API error:`, error);
    
    const errorMessage = error instanceof Error ? error.message : '生成资源详情失败';
    const statusCode = errorMessage.includes('API_KEY') ? 401 : 
                       errorMessage.includes('rate limit') ? 429 : 500;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Resource Detail API',
    version: '2.0',
    usage: {
      method: 'POST',
      body: {
        title: 'string (required) - 资源标题',
        description: 'string (required) - 资源描述',
        type: 'string (optional) - 资源类型，如：模板、工具、课程、文章、投资人'
      },
      response: {
        detail: 'string - AI 生成的资源详细解读，300-500 字'
      },
      errorResponse: {
        error: 'string - 错误信息',
        requestId: 'string - 请求 ID，用于追踪',
        timestamp: 'string - 错误发生时间'
      }
    },
    features: [
      '资源概述',
      '适用场景分析',
      '使用建议和最佳实践',
      '注意事项和限制说明',
      '延伸思考和相关推荐'
    ],
    environment: {
      AI_API_KEY: process.env.AI_API_KEY ? '已配置' : '未配置',
      AI_API_URL: process.env.AI_API_URL || '使用默认值',
    }
  });
}
