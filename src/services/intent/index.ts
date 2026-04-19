import type { Intent, ConversationContext } from '@/types/conversation';
import { INTENT_RULES } from './definitions';
import { recognizeIntentWithAI } from './aiRecognizer';

/**
 * 规则匹配：只针对规划类意图匹配
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
 * 意图识别入口：只识别规划类意图，其余一律返回 chat
 * CRUD 操作（add_todo 等）交给 AI + tools 自然处理
 */
export async function recognizeIntent(
  input: string,
  context: ConversationContext,
): Promise<Intent> {
  // 1. Rule matching for planning intents
  const ruleResult = matchWithRules(input);
  if (ruleResult && ruleResult.score >= 2) {
    return ruleResult.intent;
  }

  // 2. AI fallback for planning intent detection
  try {
    const aiIntent = await recognizeIntentWithAI(input, context.conversationTurn);
    // Only accept planning intents from AI; everything else → chat
    const planningIntents: Intent[] = [
      'plan_weekly', 'plan_study', 'plan_schedule',
      'suggest_todos', 'analyze_progress',
    ];
    if (planningIntents.includes(aiIntent)) {
      return aiIntent;
    }
  } catch {
    // AI recognition failed, fall through
  }

  // 3. Default: chat (let AI + tools handle CRUD naturally)
  return 'chat';
}

export { isComplexIntent } from './definitions';
