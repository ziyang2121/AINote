import type { AiAction } from '@/types/ai';
import type { Intent, ConversationContext } from '@/types/conversation';
import type { ZhipuMessage } from '@/services/ai';
import { callApi } from '@/services/ai';
import { useTodoStore } from '@/stores/todoStore';
import { useLearningStore } from '@/stores/learningStore';
import { useNoteStore } from '@/stores/noteStore';

const PLANNING_PROMPTS: Record<string, (slots: Record<string, unknown>, ctx: ConversationContext) => string> = {
  plan_weekly: (slots, _ctx) => {
    const todos = useTodoStore.getState().todos;
    const plans = useLearningStore.getState().plans;
    return `用户想要规划本周的学习/工作。

当前数据状态：
- 待办事项：${JSON.stringify(todos.map(t => ({ title: t.title, dueDate: t.dueDate, completed: t.completed })))}
- 学习计划：${JSON.stringify(plans.map(p => ({ title: p.title })))}

用户目标：${slots.goals ?? '未指定'}
重点领域：${slots.focusArea ?? '未指定'}

请生成一个执行计划，以 JSON 数组格式输出。每个元素是一个 action 对象，格式为：
{"type": "add_todo" 或 "add_plan", "payload": {...}, "description": "操作描述"}
规则：
1. 先创建学习计划 (add_plan)，再分解为待办 (add_todo)
2. 待办要有合理的截止日期（YYYY-MM-DD 格式）
3. 只输出 JSON 数组，不要其他内容`;
  },

  plan_study: (slots, _ctx) => {
    return `用户想要制定学习计划。

学习主题：${slots.topic ?? slots.title ?? '未指定'}
预计时间：${slots.duration ?? '未指定'}

请生成学习计划，以 JSON 数组格式输出。每个元素是一个 action 对象，格式为：
{"type": "add_plan", "payload": {"title": "...", "description": "...", "tasks": [...]}, "description": "操作描述"}
或
{"type": "add_todo", "payload": {"title": "...", "dueDate": "..."}, "description": "操作描述"}
规则：
1. 先创建学习计划 (add_plan)，将目标拆解为3-8个递进任务
2. 再创建关键的待办节点 (add_todo)
3. 只输出 JSON 数组`;
  },

  plan_schedule: (slots, _ctx) => {
    const todos = useTodoStore.getState().todos;
    return `用户想要安排日程。

日期：${slots.date ?? '今天'}
当前待办：${JSON.stringify(todos.map(t => ({ title: t.title, dueDate: t.dueDate, completed: t.completed })))}

请安排日程，以 JSON 数组格式输出 action 对象。主要是 add_todo 类型的操作。
只输出 JSON 数组。`;
  },

  suggest_todos: (_slots, _ctx) => {
    const todos = useTodoStore.getState().todos;
    const plans = useLearningStore.getState().plans;
    return `分析用户数据，提出建议。

当前待办：${JSON.stringify(todos.map(t => ({ title: t.title, priority: t.priority, dueDate: t.dueDate, completed: t.completed })))}
当前计划：${JSON.stringify(plans.map(p => ({ title: p.title })))}

请根据用户现有数据提出合理的待办建议。以 JSON 数组格式输出 add_todo 类型的 action。
只输出 JSON 数组。`;
  },

  analyze_progress: (_slots, _ctx) => {
    const todos = useTodoStore.getState().todos;
    const plans = useLearningStore.getState().plans;
    const notes = useNoteStore.getState().notes;
    return `分析用户进度。

数据概览：
- 待办：${todos.length} 条，${todos.filter(t => t.completed).length} 已完成
- 计划：${plans.length} 个
- 笔记：${notes.length} 条

请分析并给出建议。以 JSON 数组格式输出 action（如建议添加的待办）。
如果不需要添加任何操作，输出空数组 []。`;
  },
};

/**
 * 使用 AI 生成复杂意图的执行计划
 */
export async function generateComplexPlan(
  intent: Intent,
  slots: Record<string, unknown>,
  context: ConversationContext,
): Promise<AiAction[]> {
  const promptBuilder = PLANNING_PROMPTS[intent];
  if (!promptBuilder) return [];

  const prompt = promptBuilder(slots, context);

  const messages: ZhipuMessage[] = [
    { role: 'system', content: prompt },
    { role: 'user', content: '请生成计划' },
  ];

  const response = await callApi(messages);
  const text = (response.content ?? '').trim();

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]!) as Array<{
        type: string;
        payload: Record<string, unknown>;
        description?: string;
      }>;

      return parsed.map((item) => ({
        type: item.type as AiAction['type'],
        payload: item.payload,
        description: item.description ?? `${item.type}: ${JSON.stringify(item.payload)}`,
        status: 'pending' as const,
      }));
    }
  } catch {
    // JSON parse failed
  }
  return [];
}
