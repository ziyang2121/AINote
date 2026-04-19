import type { AiAction } from '@/types/ai';
import type { Intent, ConversationContext } from '@/types/conversation';
import { isComplexIntent } from '@/services/intent';
import { mapSingleIntent } from './mapper';
import { generateComplexPlan } from './generator';

/**
 * 规划引擎入口：根据意图类型选择映射或生成
 */
export async function planActions(
  intent: Intent,
  slots: Record<string, unknown>,
  context: ConversationContext,
): Promise<AiAction[]> {
  if (intent === 'chat' || intent === 'unknown') {
    return [];
  }

  if (isComplexIntent(intent)) {
    return generateComplexPlan(intent, slots, context);
  }

  return mapSingleIntent(intent, slots);
}

export { isComplexIntent } from '@/services/intent';
