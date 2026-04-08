export interface Todo {
  id: string;
  title: string;
  description: string;
  content: string;
  priority: 1 | 2 | 3 | 4 | 5;
  dueDate: string | null;
  completed: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TodoCreateInput = Omit<Todo, 'id' | 'completed' | 'createdAt' | 'updatedAt'>;
export type TodoUpdateInput = Partial<Omit<Todo, 'id' | 'createdAt'>>;
