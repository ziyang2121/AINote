import { create } from 'zustand';
import type { LearningPlan } from '@/types/learning';
import { db } from '@/services/db';

interface LearningState {
  plans: LearningPlan[];
  loading: boolean;
  loadPlans: () => Promise<void>;
  addPlan: (plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlan: (id: string, updates: Record<string, unknown>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

export const useLearningStore = create<LearningState>((set) => ({
  plans: [],
  loading: false,

  loadPlans: async () => {
    set({ loading: true });
    const rows = await db.learningPlans.orderBy('createdAt').reverse().toArray();
    set({ plans: rows as LearningPlan[], loading: false });
  },

  addPlan: async (plan) => {
    const now = new Date().toISOString();
    const newPlan: LearningPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.learningPlans.add(newPlan as never);
    set((state) => ({ plans: [newPlan, ...state.plans] }));
  },

  updatePlan: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    await db.learningPlans.update(id, updatedData);
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, ...updatedData } as LearningPlan : p)),
    }));
  },

  deletePlan: async (id) => {
    await db.learningPlans.delete(id);
    set((state) => ({ plans: state.plans.filter((p) => p.id !== id) }));
  },
}));
