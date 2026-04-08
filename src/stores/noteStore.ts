import { create } from 'zustand';
import type { Note } from '@/types/note';
import { db } from '@/services/db';

interface NoteState {
  notes: Note[];
  loading: boolean;
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loading: false,

  loadNotes: async () => {
    set({ loading: true });
    const notes = await db.notes.orderBy('updatedAt').reverse().toArray();
    set({ notes, loading: false });
  },

  addNote: async (note) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.notes.add(newNote);
    set((state) => ({ notes: [newNote, ...state.notes] }));
  },

  updateNote: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    await db.notes.update(id, updatedData);
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updatedData } : n)),
    }));
  },

  deleteNote: async (id) => {
    await db.notes.delete(id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },
}));
