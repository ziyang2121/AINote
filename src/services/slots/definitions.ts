import type { Intent, SlotDefinition } from '@/types/conversation';

/** 各意图的槽位定义 */
export const INTENT_SLOTS: Partial<Record<Intent, SlotDefinition[]>> = {
  add_todo: [
    { name: 'title', type: 'string', required: true, askPrompt: '请告诉我待办的标题' },
    { name: 'dueDate', type: 'date', required: false, askPrompt: '这个待办的截止日期是？' },
    { name: 'priority', type: 'number', required: false, askPrompt: '优先级是多少（1-5）？' },
    { name: 'tags', type: 'array', required: false },
  ],
  update_todo: [
    { name: 'todoId', type: 'entity_ref', required: true, askPrompt: '你想修改哪个待办？请提供标题或ID' },
    { name: 'title', type: 'string', required: false },
    { name: 'dueDate', type: 'date', required: false },
    { name: 'priority', type: 'number', required: false },
    { name: 'completed', type: 'string', required: false },
  ],
  delete_todo: [
    { name: 'todoId', type: 'entity_ref', required: true, askPrompt: '你想删除哪个待办？' },
  ],
  list_todo: [],
  complete_todo: [
    { name: 'todoId', type: 'entity_ref', required: true, askPrompt: '你想完成哪个待办？' },
  ],
  add_plan: [
    { name: 'title', type: 'string', required: true, askPrompt: '学习计划的标题是什么？' },
    { name: 'description', type: 'string', required: false, askPrompt: '请描述一下学习目标' },
  ],
  update_plan: [
    { name: 'planId', type: 'entity_ref', required: true, askPrompt: '你想修改哪个学习计划？' },
  ],
  delete_plan: [
    { name: 'planId', type: 'entity_ref', required: true, askPrompt: '你想删除哪个学习计划？' },
  ],
  list_plan: [],
  add_note: [
    { name: 'title', type: 'string', required: true, askPrompt: '笔记的标题是什么？' },
    { name: 'content', type: 'string', required: false, askPrompt: '请输入笔记内容' },
    { name: 'tags', type: 'array', required: false },
  ],
  update_note: [
    { name: 'noteId', type: 'entity_ref', required: true, askPrompt: '你想修改哪个笔记？' },
  ],
  delete_note: [
    { name: 'noteId', type: 'entity_ref', required: true, askPrompt: '你想删除哪个笔记？' },
  ],
  list_note: [],
  plan_weekly: [
    { name: 'focusArea', type: 'string', required: false, askPrompt: '这周的重点领域是什么？' },
    { name: 'goals', type: 'array', required: false, askPrompt: '这周你有什么主要目标？' },
  ],
  plan_study: [
    { name: 'topic', type: 'string', required: true, askPrompt: '你想学习什么主题？' },
    { name: 'duration', type: 'string', required: false, askPrompt: '预计学习多长时间？' },
  ],
  plan_schedule: [
    { name: 'date', type: 'date', required: false, askPrompt: '你要安排哪天的日程？' },
  ],
  suggest_todos: [],
  analyze_progress: [],
};

/** 获取意图的槽位定义 */
export function getSlotDefinitions(intent: Intent): SlotDefinition[] {
  return INTENT_SLOTS[intent] ?? [];
}
