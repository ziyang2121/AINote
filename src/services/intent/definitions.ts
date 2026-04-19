import type { Intent } from '@/types/conversation';

/** 规则匹配模式 */
export interface IntentRule {
  intent: Intent;
  patterns: RegExp[];
  keywords: string[];
}

/** 意图规则表 */
export const INTENT_RULES: IntentRule[] = [
  // ---- 待办 ----
  {
    intent: 'add_todo',
    patterns: [/添加.*待办/, /新建.*任务/, /创建.*todo/i, /提醒我/, /帮我做/, /记一下/],
    keywords: ['添加', '新建', '创建', '待办', '任务', '提醒', '记一下'],
  },
  {
    intent: 'update_todo',
    patterns: [/修改.*待办/, /更新.*任务/, /改一下.*todo/i, /编辑.*待办/],
    keywords: ['修改', '更新', '编辑', '改一下'],
  },
  {
    intent: 'delete_todo',
    patterns: [/删除.*待办/, /移除.*任务/, /去掉.*todo/i],
    keywords: ['删除', '移除', '去掉'],
  },
  {
    intent: 'list_todo',
    patterns: [/有哪些.*待办/, /待办.*列表/, /显示.*任务/, /查看.*待办/],
    keywords: ['列表', '有哪些', '查看', '显示'],
  },
  {
    intent: 'complete_todo',
    patterns: [/完成.*待办/, /打卡.*任务/, /标记.*完成/],
    keywords: ['完成', '打卡', '标记完成'],
  },
  // ---- 计划 ----
  {
    intent: 'add_plan',
    patterns: [/学习.*计划/, /制定.*计划/, /学习路线/, /入门.*计划/],
    keywords: ['学习计划', '制定计划', '学习路线'],
  },
  {
    intent: 'update_plan',
    patterns: [/修改.*计划/, /更新.*计划/, /编辑.*计划/],
    keywords: ['修改计划', '更新计划'],
  },
  {
    intent: 'delete_plan',
    patterns: [/删除.*计划/, /移除.*计划/],
    keywords: ['删除计划'],
  },
  {
    intent: 'list_plan',
    patterns: [/有哪些.*计划/, /计划.*列表/, /查看.*计划/],
    keywords: ['查看计划'],
  },
  // ---- 笔记 ----
  {
    intent: 'add_note',
    patterns: [/记.*笔记/, /记录.*内容/, /摘录/, /参考资料/],
    keywords: ['笔记', '记录', '摘录', '参考资料'],
  },
  {
    intent: 'update_note',
    patterns: [/修改.*笔记/, /更新.*笔记/, /编辑.*笔记/],
    keywords: ['修改笔记'],
  },
  {
    intent: 'delete_note',
    patterns: [/删除.*笔记/, /移除.*笔记/],
    keywords: ['删除笔记'],
  },
  {
    intent: 'list_note',
    patterns: [/有哪些.*笔记/, /笔记.*列表/, /查看.*笔记/],
    keywords: ['查看笔记'],
  },
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

/** 复杂意图集合（需要 AI 生成计划） */
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
