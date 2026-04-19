export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions: AiAction[];
  timestamp: string;
}

export interface AiAction {
  type: 'add_todo' | 'update_todo' | 'delete_todo' | 'list_todo' | 'complete_todo'
       | 'add_plan' | 'update_plan' | 'delete_plan' | 'list_plan'
       | 'add_note' | 'update_note' | 'delete_note' | 'list_note'
       | 'plan_weekly' | 'plan_study' | 'plan_schedule'
       | 'suggest_todos' | 'analyze_progress';
  payload: Record<string, unknown>;
  description: string;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
}

export interface AiSettings {
  apiKey: string;
  model: string;
}
