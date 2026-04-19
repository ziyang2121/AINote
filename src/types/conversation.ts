import type { AiAction } from './ai';

/** 对话阶段 */
export type ConversationPhase =
  | 'idle'
  | 'intent_recognition'
  | 'slot_filling'
  | 'planning'
  | 'executing'
  | 'completed';

/** 意图类型 */
export type Intent =
  // 待办相关
  | 'add_todo' | 'update_todo' | 'delete_todo' | 'list_todo' | 'complete_todo'
  // 计划相关
  | 'add_plan' | 'update_plan' | 'delete_plan' | 'list_plan'
  // 笔记相关
  | 'add_note' | 'update_note' | 'delete_note' | 'list_note'
  // 规划意图
  | 'plan_weekly' | 'plan_study' | 'plan_schedule'
  // 主动建议
  | 'suggest_todos' | 'analyze_progress'
  // 通用
  | 'chat' | 'unknown';

/** 槽位定义 */
export interface SlotDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'entity_ref' | 'array';
  required: boolean;
  askPrompt?: string;
}

/** 对话上下文 */
export interface ConversationContext {
  mentionedEntities: Record<string, string>;
  lastTopic: string;
  conversationTurn: number;
}

/** 对话状态 */
export interface ConversationState {
  currentIntent: Intent | null;
  slots: Record<string, unknown>;
  missingSlots: string[];
  phase: ConversationPhase;
  currentPlan: Plan | null;
  executedActions: AiAction[];
  context: ConversationContext;
}

/** 执行计划 */
export interface Plan {
  id: string;
  intent: Intent;
  actions: PlannedAction[];
  currentStep: number;
}

/** 计划中的单个 Action */
export interface PlannedAction {
  action: AiAction;
  dependencies: string[];
  status: 'pending' | 'ready' | 'executing' | 'completed' | 'failed';
}

/** 初始对话状态 */
export function createInitialConversationState(): ConversationState {
  return {
    currentIntent: null,
    slots: {},
    missingSlots: [],
    phase: 'idle',
    currentPlan: null,
    executedActions: [],
    context: {
      mentionedEntities: {},
      lastTopic: '',
      conversationTurn: 0,
    },
  };
}
