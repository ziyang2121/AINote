export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions: AiAction[];
  timestamp: string;
}

export interface AiAction {
  type: 'add_todo' | 'update_todo' | 'delete_todo'
       | 'add_plan' | 'update_plan' | 'delete_plan'
       | 'add_note' | 'update_note' | 'delete_note';
  payload: Record<string, unknown>;
  description: string;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
}

export interface AiSettings {
  apiKey: string;
  model: string;
}
