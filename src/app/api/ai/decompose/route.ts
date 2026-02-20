import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

interface DecomposeRequest {
  taskTitle: string;
  description?: string;
}

interface SubtaskResponse {
  subtasks: string[];
}

const SYSTEM_PROMPT = `你是一位创业教练和任务管理专家。你的职责是将复杂的创业任务拆解为具体、可执行的子任务。

拆解原则：
1. 每个子任务应该是具体、可操作的
2. 子任务之间应该有逻辑顺序
3. 每个子任务应该有明确的完成标准
4. 子任务数量控制在 3-7 个
5. 返回格式必须是纯 JSON 数组，不要包含任何其他文字

返回格式示例：
["子任务1", "子任务2", "子任务3"]

注意：只返回 JSON 数组，不要包含任何解释或额外文字。`;

function buildPrompt(taskTitle: string, description?: string): string {
  let prompt = `请将以下任务拆解为 3-7 个具体的子任务，以 JSON 数组格式返回：\n\n任务：${taskTitle}`;
  
  if (description) {
    prompt += `\n\n任务描述：${description}`;
  }
  
  prompt += `\n\n请直接返回 JSON 数组格式的子任务列表，例如：["子任务1", "子任务2", "子任务3"]`;
  
  return prompt;
}

function parseSubtasks(text: string): string[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string' && item.trim());
      }
    }
    
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        return line
          .replace(/^[-•*]\s*/, '')
          .replace(/^\d+[.、)]\s*/, '')
          .replace(/^["']|["']$/g, '')
          .trim();
      })
      .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'));
    
    if (lines.length > 0) {
      return lines.slice(0, 7);
    }
    
    return [];
  } catch (error) {
    console.error('[Decompose] Failed to parse subtasks:', error);
    return [];
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  console.log('[Decompose] Received request');
  
  try {
    const body: DecomposeRequest = await request.json();
    
    const { taskTitle, description } = body;
    
    if (!taskTitle || typeof taskTitle !== 'string') {
      return NextResponse.json(
        { error: 'taskTitle is required and must be a string' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    if (taskTitle.trim().length < 2) {
      return NextResponse.json(
        { error: 'taskTitle must be at least 2 characters' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    console.log('[Decompose] Task title:', taskTitle);
    
    const prompt = buildPrompt(taskTitle, description);
    
    let aiResponse: string;
    try {
      aiResponse = await generateText(prompt, SYSTEM_PROMPT);
      console.log('[Decompose] AI response:', aiResponse.substring(0, 200));
    } catch (aiError) {
      console.error('[Decompose] AI call failed:', aiError);
      return NextResponse.json(
        { 
          error: 'AI service unavailable', 
          details: aiError instanceof Error ? aiError.message : 'Unknown error' 
        },
        { status: 503, headers: corsHeaders() }
      );
    }
    
    const subtasks = parseSubtasks(aiResponse);
    
    if (subtasks.length === 0) {
      console.error('[Decompose] Failed to parse subtasks from response:', aiResponse);
      return NextResponse.json(
        { error: 'Failed to generate valid subtasks', rawResponse: aiResponse },
        { status: 500, headers: corsHeaders() }
      );
    }
    
    console.log('[Decompose] Generated subtasks:', subtasks);
    
    const response: SubtaskResponse = {
      subtasks
    };
    
    return NextResponse.json(response, { headers: corsHeaders() });
    
  } catch (error) {
    console.error('[Decompose] API error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders() }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('AI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI API is not configured properly' },
          { status: 500, headers: corsHeaders() }
        );
      }
      
      if (error.message.includes('API request failed') || error.message.includes('API Error')) {
        return NextResponse.json(
          { error: 'AI API request failed', details: error.message },
          { status: 502, headers: corsHeaders() }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Task Decomposition API',
      usage: {
        method: 'POST',
        body: {
          taskTitle: 'string (required)',
          description: 'string (optional)'
        },
        response: {
          subtasks: 'string[]'
        }
      }
    },
    { headers: corsHeaders() }
  );
}
