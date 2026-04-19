import type { Intent } from '@/types/conversation';
import type { ZhipuMessage } from '@/services/ai';
import { callApi } from '@/services/ai';

const PLANNING_INTENTS: Intent[] = [
  'plan_weekly', 'plan_study', 'plan_schedule',
  'suggest_todos', 'analyze_progress',
];

/**
 * 当规则匹配未命中时，使用 AI 判断是否为规划类意图
 */
export async function recognizeIntentWithAI(input: string, contextTurn: number): Promise<Intent> {
  const messages: ZhipuMessage[] = [
    {
      role: 'system',
      content: `判断用户输入是否属于以下规划类意图之一：
${PLANNING_INTENTS.map((i) => `- ${i}`).join('\n')}

规则：
- 如果匹配规划类意图，只输出意图名称
- 如果不匹配任何规划意图，输出 chat
- 只输出意图名称，不要其他内容`,
    },
    {
      role: 'user',
      content: `用户输入：${input}\n当前是第 ${contextTurn} 轮对话`,
    },
  ];

  const response = await callApi(messages, { noTools: true });
  const text = (response.content ?? '').trim().toLowerCase();

  for (const intent of PLANNING_INTENTS) {
    if (text.includes(intent)) {
      return intent;
    }
  }
  return 'chat';
}
