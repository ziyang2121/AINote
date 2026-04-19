import type { AiAction } from '@/types/ai';
import type { Intent, ConversationContext } from '@/types/conversation';
import { isComplexIntent } from '@/services/intent';
import { generateComplexPlan } from './generator';

/**
 * 规划引擎入口：为规划类意图生成多步执行计划
 * CRUD 意图由 AI + tools 直接处理，不经过此模块
 */
export async function planActions(
  intent: Intent,
  slots: Record<string, unknown>,
  context: ConversationContext,
): Promise<AiAction[]> {
  if (!isComplexIntent(intent)) {
    return [];
  }

  return generateComplexPlan(intent, slots, context);
}

export { isComplexIntent } from '@/services/intent';
