import { NextRequest, NextResponse } from 'next/server';
import { generateStream } from '@/lib/ai';
import { TaskType } from '@/types';

interface TaskInput {
  title: string;
  completedAt: string;
  type: TaskType;
}

interface WeeklyReportRequest {
  tasks: TaskInput[];
  startDate?: string;
  endDate?: string;
  teamName?: string;
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  product: '产品开发',
  market: '市场调研',
  finance: '融资准备',
  team: '团队管理',
  other: '其他'
};

const SYSTEM_PROMPT = `你是一位专业的创业团队周报撰写助手。你的职责是根据团队本周完成的任务，生成一份结构清晰、内容专业的周报。

周报格式要求（Markdown）：
1. 使用清晰的标题层级（# ## ###）
2. 包含以下部分：
   - 本周工作总结
   - 重点工作成果
   - 下周工作计划
   - 风险与挑战
   - 需要的支持与帮助
3. 使用列表、加粗等格式增强可读性
4. 语言简洁专业，突出重点
5. 适当添加数据统计（如完成任务数量、各类型任务占比等）

注意事项：
- 周报要体现创业团队的特点：快速迭代、资源有限、目标导向
- 对于融资相关任务要重点突出
- 风险分析要客观，提出可行的应对建议
- 下周计划要具体、可执行

请直接输出 Markdown 格式的周报内容，不要包含其他解释文字。`;

function buildPrompt(tasks: TaskInput[], startDate?: string, endDate?: string, teamName?: string): string {
  const start = startDate || '本周';
  const end = endDate || '本周';
  const team = teamName || '创业团队';
  
  const taskList = tasks.map((task, index) => {
    const typeLabel = TASK_TYPE_LABELS[task.type] || '其他';
    const completedDate = task.completedAt 
      ? new Date(task.completedAt).toLocaleDateString('zh-CN')
      : '未知日期';
    
    return `${index + 1}. ${task.title}（${typeLabel}，完成于 ${completedDate}）`;
  }).join('\n');

  const typeStats = tasks.reduce((acc, task) => {
    const type = TASK_TYPE_LABELS[task.type] || '其他';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statsText = Object.entries(typeStats)
    .map(([type, count]) => `${type}: ${count} 项`)
    .join('、');

  return `请为「${team}」生成 ${start} 至 ${end} 的工作周报。

本周完成的任务列表（共 ${tasks.length} 项）：
${taskList}

任务类型分布：${statsText}

请生成一份专业的创业团队周报，包含：
1. 本周工作总结（概述）
2. 重点工作成果（按任务类型分类，突出重要成果）
3. 下周工作计划（基于本周进展，提出合理的下周目标）
4. 风险与挑战（分析潜在风险）
5. 需要的支持与帮助（提出资源需求）

请以 Markdown 格式输出，语言简洁专业。`;
}

function createFallbackReport(tasks: TaskInput[], startDate?: string, endDate?: string, teamName?: string): string {
  const start = startDate || '本周';
  const team = teamName || '创业团队';
  
  const typeGroups = tasks.reduce((acc, task) => {
    const type = TASK_TYPE_LABELS[task.type] || '其他';
    if (!acc[type]) acc[type] = [];
    acc[type].push(task);
    return acc;
  }, {} as Record<string, TaskInput[]>);

  let report = `# ${team}工作周报\n\n`;
  report += `**报告周期**：${start}\n\n`;
  report += `---\n\n`;
  
  report += `## 📊 本周工作总结\n\n`;
  report += `本周共完成 **${tasks.length}** 项任务。\n\n`;
  
  report += `### 任务完成统计\n\n`;
  Object.entries(typeGroups).forEach(([type, typeTasks]) => {
    report += `- **${type}**：${typeTasks.length} 项\n`;
  });
  report += `\n`;
  
  report += `## ✅ 重点工作成果\n\n`;
  Object.entries(typeGroups).forEach(([type, typeTasks]) => {
    report += `### ${type}\n\n`;
    typeTasks.forEach(task => {
      report += `- ${task.title}\n`;
    });
    report += `\n`;
  });
  
  report += `## 📋 下周工作计划\n\n`;
  report += `- 继续推进产品开发进度\n`;
  report += `- 跟进融资相关事宜\n`;
  report += `- 加强市场调研工作\n\n`;
  
  report += `## ⚠️ 风险与挑战\n\n`;
  report += `- 需要关注项目进度，确保按时交付\n`;
  report += `- 资源有限，需合理分配优先级\n\n`;
  
  report += `## 🤝 需要的支持与帮助\n\n`;
  report += `- 欢迎团队成员积极沟通协作\n`;
  report += `- 如有资源需求请及时反馈\n\n`;
  
  report += `---\n\n`;
  report += `*本报告由 AI 自动生成*\n`;
  
  return report;
}

export async function POST(request: NextRequest) {
  try {
    const body: WeeklyReportRequest = await request.json();
    
    const { tasks, startDate, endDate, teamName } = body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'tasks is required and must be an array' },
        { status: 400 }
      );
    }
    
    if (tasks.length === 0) {
      const emptyReport = `# ${teamName || '创业团队'}工作周报\n\n**报告周期**：${startDate || '本周'}\n\n---\n\n## 📊 本周工作总结\n\n本周暂无完成任务记录。\n\n## 📋 下周工作计划\n\n- 制定明确的工作目标\n- 开始执行核心任务\n\n---\n\n*本报告由 AI 自动生成*`;
      
      return new NextResponse(emptyReport, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }
    
    for (const task of tasks) {
      if (!task.title || typeof task.title !== 'string') {
        return NextResponse.json(
          { error: 'Each task must have a valid title' },
          { status: 400 }
        );
      }
    }
    
    const prompt = buildPrompt(tasks, startDate, endDate, teamName);
    
    try {
      const stream = generateStream(prompt, SYSTEM_PROMPT);
      
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    } catch (aiError) {
      console.error('AI stream generation failed, using fallback report:', aiError);
      
      const fallbackReport = createFallbackReport(tasks, startDate, endDate, teamName);
      
      return new NextResponse(fallbackReport, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }
    
  } catch (error) {
    console.error('Weekly report API error:', error);
    
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
      message: 'AI Weekly Report Generation API',
      usage: {
        method: 'POST',
        body: {
          tasks: [
            {
              title: 'string (required)',
              completedAt: 'string (ISO date format)',
              type: 'product | market | finance | team | other (required)'
            }
          ],
          startDate: 'string (optional, e.g., "2024-01-01")',
          endDate: 'string (optional, e.g., "2024-01-07")',
          teamName: 'string (optional, defaults to "创业团队")'
        },
        response: {
          type: 'text/markdown (streaming)',
          content: 'Markdown formatted weekly report'
        }
      },
      reportSections: [
        '📊 本周工作总结',
        '✅ 重点工作成果',
        '📋 下周工作计划',
        '⚠️ 风险与挑战',
        '🤝 需要的支持与帮助'
      ]
    }
  );
}
