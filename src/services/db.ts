import Dexie, { type Table } from 'dexie';
import type { Todo } from '@/types/todo';
import type { Note } from '@/types/note';
import type { ChatMessage } from '@/types/ai';

// LearningTask.subTasks 自引用会导致 dexie Table 类型递归解析 key paths 时
// 触发 TS2615 循环引用错误。此处 learningPlans 使用宽松类型，
// 业务层通过 store 做类型转换。
interface LearningPlanRow {
  id: string;
  title: string;
  description: string;
  tasks: unknown[];
  checkInDates: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

class SmartTodoDB extends Dexie {
  todos!: Table<Todo, string>;
  learningPlans!: Table<LearningPlanRow, string>;
  notes!: Table<Note, string>;
  chatMessages!: Table<ChatMessage, string>;

  constructor() {
    super('SmartTodoDB');
    this.version(1).stores({
      todos: 'id, priority, dueDate, completed, *tags, createdAt',
      learningPlans: 'id, createdAt',
      memos: 'id, *tags, createdAt, updatedAt',
      chatMessages: 'id, role, timestamp',
    });
    this.version(2).stores({
      todos: 'id, priority, dueDate, completed, *tags, createdAt',
      learningPlans: 'id, createdAt',
      notes: 'id, *tags, createdAt, updatedAt',
      chatMessages: 'id, role, timestamp',
    }).upgrade(tx => {
      // Migrate memos → notes
      return tx.table('memos').toArray().then((memos: Array<Record<string, unknown>>) => {
        return tx.table('notes').bulkAdd(memos);
      });
    });
  }
}

export const db = new SmartTodoDB();
