import type { Intent } from '@/types/conversation';

/** 规则匹配模式 */
export interface IntentRule {
  intent: Intent;
  patterns: RegExp[];
  keywords: string[];
}

/**
 * 意图规则表 — 只保留规划类意图
 * CRUD 意图（add_todo 等）由 AI + tools 自然处理，不需要规则匹配
 */
export const INTENT_RULES: IntentRule[] = [
  // ---- 规划意图 ----
  {
    intent: 'plan_weekly',
    patterns: [/安排.*周/, /本周.*计划/, /周计划/, /这周.*安排/, /一周.*规划/],
    keywords: ['周计划', '本周安排', '这周'],
  },
  {
    intent: 'plan_study',
    patterns: [/规划.*学习/, /学习.*规划/, /系统学/],
    keywords: ['学习规划', '系统学'],
  },
  {
    intent: 'plan_schedule',
    patterns: [/安排.*日程/, /日程.*规划/, /时间.*安排/],
    keywords: ['日程', '时间安排'],
  },
  // ---- 主动建议 ----
  {
    intent: 'suggest_todos',
    patterns: [/建议.*待办/, /推荐.*任务/, /帮我.*建议/],
    keywords: ['建议', '推荐'],
  },
  {
    intent: 'analyze_progress',
    patterns: [/分析.*进度/, /进度.*分析/, /完成.*情况/],
    keywords: ['进度', '完成情况'],
  },
];

/** 复杂意图集合（需要 AI 生成计划，不带 tools） */
export const COMPLEX_INTENTS: Set<Intent> = new Set([
  'plan_weekly',
  'plan_study',
  'plan_schedule',
  'suggest_todos',
  'analyze_progress',
]);

/** 判断是否为复杂意图 */
export function isComplexIntent(intent: Intent): boolean {
  return COMPLEX_INTENTS.has(intent);
}
