import type { Intent } from '@/types/conversation';
import type { ZhipuMessage } from '@/services/ai';
import { callApi } from '@/services/ai';

const ALL_INTENTS: Intent[] = [
  'add_todo', 'update_todo', 'delete_todo', 'list_todo', 'complete_todo',
  'add_plan', 'update_plan', 'delete_plan', 'list_plan',
  'add_note', 'update_note', 'delete_note', 'list_note',
  'plan_weekly', 'plan_study', 'plan_schedule',
  'suggest_todos', 'analyze_progress',
  'chat', 'unknown',
];

/**
 * 当规则匹配未命中时，使用 AI 识别意图
 */
export async function recognizeIntentWithAI(input: string, contextTurn: number): Promise<Intent> {
  const messages: ZhipuMessage[] = [
    {
      role: 'system',
      content: `你是一个意图分类器。根据用户输入，从以下意图中选择最匹配的一个：
${ALL_INTENTS.map((i) => `- ${i}`).join('\n')}

规则：
- 只输出意图名称，不要其他内容
- 如果无法判断，输出 chat
- 如果用户在回答之前的追问，根据上下文判断意图`,
    },
    {
      role: 'user',
      content: `用户输入：${input}\n当前是第 ${contextTurn} 轮对话`,
    },
  ];

  const response = await callApi(messages, { noTools: true });
  const text = (response.content ?? '').trim().toLowerCase();

  for (const intent of ALL_INTENTS) {
    if (text.includes(intent)) {
      return intent;
    }
  }
  return 'chat';
}
