import { create } from 'zustand';
import type { Todo } from '@/types/todo';
import { db } from '@/services/db';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  loadTodos: () => Promise<void>;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,

  loadTodos: async () => {
    set({ loading: true });
    const todos = await db.todos.orderBy('createdAt').reverse().toArray();
    set({ todos, loading: false });
  },

  addTodo: async (todo) => {
    const now = new Date().toISOString();
    const newTodo: Todo = {
      ...todo,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.todos.add(newTodo);
    set((state) => ({ todos: [newTodo, ...state.todos] }));
  },

  updateTodo: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    await db.todos.update(id, updatedData);
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...updatedData } : t)),
    }));
  },

  deleteTodo: async (id) => {
    await db.todos.delete(id);
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }));
  },
}));
