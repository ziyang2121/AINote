import type { Intent, ConversationContext } from '@/types/conversation';
import { INTENT_RULES } from './definitions';
import { recognizeIntentWithAI } from './aiRecognizer';

/**
 * 规则匹配：计算输入与规则的匹配分数
 */
function matchWithRules(input: string): { intent: Intent; score: number } | null {
  let bestMatch: { intent: Intent; score: number } | null = null;

  for (const rule of INTENT_RULES) {
    let score = 0;

    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        score += 3;
      }
    }

    for (const keyword of rule.keywords) {
      if (input.includes(keyword)) {
        score += 1;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { intent: rule.intent, score };
    }
  }

  return bestMatch;
}

/**
 * 意图识别入口：规则优先，AI fallback
 */
export async function recognizeIntent(
  input: string,
  context: ConversationContext,
): Promise<Intent> {
  const ruleResult = matchWithRules(input);
  if (ruleResult && ruleResult.score >= 2) {
    return ruleResult.intent;
  }

  try {
    return await recognizeIntentWithAI(input, context.conversationTurn);
  } catch {
    return 'chat';
  }
}

export { isComplexIntent } from './definitions';
