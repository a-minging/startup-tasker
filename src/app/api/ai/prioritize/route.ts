import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';
import { TaskType } from '@/types';

interface TaskInput {
  id: string;
  title: string;
  dueDate?: string;
  type: TaskType;
}

interface PrioritizeRequest {
  tasks: TaskInput[];
}

interface PrioritizeResponse {
  prioritizedIds: string[];
  reasoning?: string;
}

const TASK_TYPE_PRIORITY: Record<TaskType, { weight: number; description: string }> = {
  finance: { weight: 10, description: '融资准备 - 创业早期最关键，决定公司生存' },
  product: { weight: 9, description: '产品开发 - 核心业务，需要持续迭代' },
  market: { weight: 8, description: '市场调研 - 指导产品和融资方向' },
  team: { weight: 7, description: '团队管理 - 支撑业务发展' },
  other: { weight: 5, description: '其他任务 - 辅助性工作' }
};

const SYSTEM_PROMPT = `你是一位创业顾问和任务管理专家。你的职责是根据创业早期阶段的特点，对任务进行智能优先级排序。

排序原则（创业早期阶段）：
1. **融资优先**：涉及融资、投资人沟通的任务优先级最高，因为资金是创业公司的生命线
2. **产品核心**：产品开发相关任务次之，MVP 和核心功能决定产品竞争力
3. **市场导向**：市场调研帮助验证方向，在产品开发前尤为重要
4. **团队支撑**：团队管理任务支撑业务发展，但可适当延后
5. **截止日期**：相同类型任务，截止日期越近优先级越高
6. **紧急重要**：综合考虑任务的紧急性和重要性

排序逻辑：
- 首先按任务类型权重排序（融资 > 产品 > 市场 > 团队 > 其他）
- 同类型任务按截止日期排序（越近越优先）
- 考虑任务之间的依赖关系
- 考虑创业早期资源有限的特点

返回格式：
{
  "prioritizedIds": ["task_id_1", "task_id_2", ...],
  "reasoning": "简短的排序理由说明"
}

注意：只返回 JSON 对象，不要包含其他文字。`;

function buildPrompt(tasks: TaskInput[]): string {
  const taskList = tasks.map((task, index) => {
    const typeInfo = TASK_TYPE_PRIORITY[task.type] || TASK_TYPE_PRIORITY.other;
    const dueInfo = task.dueDate 
      ? `截止日期: ${task.dueDate}` 
      : '截止日期: 未设置';
    
    return `${index + 1}. ID: ${task.id}
   标题: ${task.title}
   类型: ${typeInfo.description} (权重: ${typeInfo.weight})
   ${dueInfo}`;
  }).join('\n');

  return `请对以下 ${tasks.length} 个创业任务进行优先级排序（从高到低）：

${taskList}

请根据创业早期阶段的特点，综合考虑任务类型、截止日期、紧急性和重要性，返回排序后的任务 ID 数组。

返回 JSON 格式：
{
  "prioritizedIds": ["id1", "id2", ...],
  "reasoning": "排序理由"
}`;
}

function parsePrioritizedIds(text: string): { ids: string[]; reasoning: string } {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.prioritizedIds && Array.isArray(parsed.prioritizedIds)) {
        return {
          ids: parsed.prioritizedIds.filter((id): id is string => typeof id === 'string'),
          reasoning: parsed.reasoning || 'AI 已根据创业早期特点进行智能排序'
        };
      }
    }
    
    return { ids: [], reasoning: '' };
  } catch (error) {
    console.error('Failed to parse prioritized IDs:', error);
    return { ids: [], reasoning: '' };
  }
}

function fallbackPrioritize(tasks: TaskInput[]): string[] {
  const now = new Date();
  
  const sortedTasks = [...tasks].sort((a, b) => {
    const weightA = TASK_TYPE_PRIORITY[a.type]?.weight || 5;
    const weightB = TASK_TYPE_PRIORITY[b.type]?.weight || 5;
    
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    return 0;
  });
  
  return sortedTasks.map(t => t.id);
}

export async function POST(request: NextRequest) {
  try {
    const body: PrioritizeRequest = await request.json();
    
    const { tasks } = body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'tasks is required and must be an array' },
        { status: 400 }
      );
    }
    
    if (tasks.length === 0) {
      return NextResponse.json(
        { prioritizedIds: [], reasoning: '没有需要排序的任务' }
      );
    }
    
    for (const task of tasks) {
      if (!task.id || typeof task.id !== 'string') {
        return NextResponse.json(
          { error: 'Each task must have a valid id' },
          { status: 400 }
        );
      }
      if (!task.title || typeof task.title !== 'string') {
        return NextResponse.json(
          { error: 'Each task must have a valid title' },
          { status: 400 }
        );
      }
    }
    
    if (tasks.length === 1) {
      return NextResponse.json({
        prioritizedIds: [tasks[0].id],
        reasoning: '只有一个任务，无需排序'
      });
    }
    
    const prompt = buildPrompt(tasks);
    
    let prioritizedIds: string[];
    let reasoning: string;
    
    try {
      const aiResponse = await generateText(prompt, SYSTEM_PROMPT);
      const result = parsePrioritizedIds(aiResponse);
      
      if (result.ids.length === tasks.length) {
        prioritizedIds = result.ids;
        reasoning = result.reasoning;
      } else {
        console.log('AI response parsing failed, using fallback prioritization');
        prioritizedIds = fallbackPrioritize(tasks);
        reasoning = '使用本地算法进行优先级排序';
      }
    } catch (aiError) {
      console.error('AI generation failed, using fallback prioritization:', aiError);
      prioritizedIds = fallbackPrioritize(tasks);
      reasoning = 'AI 服务暂时不可用，使用本地算法排序';
    }
    
    const response: PrioritizeResponse = {
      prioritizedIds,
      reasoning
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Prioritize API error:', error);
    
    if (error instanceof Error && error.message.includes('AI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI API is not configured properly' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'AI Task Prioritization API',
      usage: {
        method: 'POST',
        body: {
          tasks: [
            {
              id: 'string (required)',
              title: 'string (required)',
              dueDate: 'string (optional, ISO date format)',
              type: 'product | market | finance | team | other (required)'
            }
          ]
        },
        response: {
          prioritizedIds: ['id1', 'id2', '...'],
          reasoning: 'string - 排序理由说明'
        }
      },
      priorityRules: {
        finance: '最高优先级 - 融资决定公司生存',
        product: '高优先级 - 产品是核心竞争力',
        market: '中高优先级 - 市场验证方向',
        team: '中等优先级 - 团队支撑业务',
        other: '较低优先级 - 辅助性工作'
      }
    }
  );
}
