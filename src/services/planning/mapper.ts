import type { AiAction } from '@/types/ai';
import type { Intent } from '@/types/conversation';

/**
 * 将简单意图的槽位直接映射为 AiAction
 */
export function mapSingleIntent(
  intent: Intent,
  slots: Record<string, unknown>,
): AiAction[] {
  const payload = { ...slots };
  if ('todoId' in payload) {
    payload.id = payload.todoId;
    delete payload.todoId;
  }
  if ('planId' in payload) {
    payload.id = payload.planId;
    delete payload.planId;
  }
  if ('noteId' in payload) {
    payload.id = payload.noteId;
    delete payload.noteId;
  }
  if ('topic' in payload && !('title' in payload)) {
    payload.title = payload.topic;
    delete payload.topic;
  }

  const noActionIntents: Intent[] = ['list_todo', 'list_plan', 'list_note', 'complete_todo'];
  if (noActionIntents.includes(intent)) {
    return [];
  }

  return [
    {
      type: intent as AiAction['type'],
      payload,
      description: describeActionFromIntent(intent, payload),
      status: 'pending' as const,
    },
  ];
}

function describeActionFromIntent(intent: Intent, payload: Record<string, unknown>): string {
  switch (intent) {
    case 'add_todo': return `创建待办: ${payload.title ?? '未命名'}`;
    case 'update_todo': return `修改待办: ${payload.id ?? payload.title ?? ''}`;
    case 'delete_todo': return `删除待办: ${payload.id ?? ''}`;
    case 'add_plan': return `创建学习计划: ${payload.title ?? '未命名'}`;
    case 'update_plan': return `修改学习计划: ${payload.id ?? ''}`;
    case 'delete_plan': return `删除学习计划: ${payload.id ?? ''}`;
    case 'add_note': return `创建笔记: ${payload.title ?? '未命名'}`;
    case 'update_note': return `修改笔记: ${payload.id ?? ''}`;
    case 'delete_note': return `删除笔记: ${payload.id ?? ''}`;
    default: return `执行: ${intent}`;
  }
}
