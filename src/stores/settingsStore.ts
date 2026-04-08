import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  apiKey: string;
  model: string;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'glm-4-flash',
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
    }),
    {
      name: 'smart-todo-settings',
    }
  )
);
