import { create } from 'zustand';
import type { ChatMessage } from '@/types/ai';
import { db } from '@/services/db';
import { sendMessage, sendToolResult, executeAction } from '@/services/ai';
import type { ZhipuMessage, ZhipuToolCall } from '@/services/ai';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  loadMessages: () => Promise<void>;
  send: (content: string) => Promise<void>;
  confirmAction: (messageId: string, actionIndex: number) => Promise<void>;
  confirmAllActions: (messageId: string) => Promise<void>;
  cancelAction: (messageId: string, actionIndex: number) => Promise<void>;
  clearMessages: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,

  loadMessages: async () => {
    const messages = await db.chatMessages
      .orderBy('timestamp')
      .reverse()
      .limit(50)
      .reverse()
      .toArray();
    set({ messages });
  },

  send: async (content: string) => {
    set({ loading: true });

    // Save user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      actions: [],
      timestamp: new Date().toISOString(),
    };
    await db.chatMessages.add(userMsg);
    set((state) => ({ messages: [...state.messages, userMsg] }));

    try {
      const response = await sendMessage(content);

      // Save assistant message (may contain pending actions)
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text,
        actions: response.actions,
        timestamp: new Date().toISOString(),
      };
      await db.chatMessages.add(assistantMsg);
      set((state) => ({ messages: [...state.messages, assistantMsg], loading: false }));
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `出错了: ${error instanceof Error ? error.message : '未知错误'}`,
        actions: [],
        timestamp: new Date().toISOString(),
      };
      await db.chatMessages.add(errorMsg);
      set((state) => ({ messages: [...state.messages, errorMsg], loading: false }));
    }
  },

  confirmAction: async (messageId, actionIndex) => {
    const { messages } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    if (!msg.actions[actionIndex]) return;

    const action = msg.actions[actionIndex]!;
    if (action.status !== 'pending') return;

    // Mark as confirmed
    const confirmedActions = [...msg.actions];
    confirmedActions[actionIndex] = { ...action, status: 'confirmed' as const };

    await db.chatMessages.update(messageId, { actions: confirmedActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: confirmedActions } : m)),
    }));

    // Execute action and get result text
    const resultText = await executeAction(action);
    const success = !resultText.startsWith('操作失败');

    // Mark as executed or failed
    const finalActions = [...confirmedActions];
    finalActions[actionIndex] = {
      ...confirmedActions[actionIndex]!,
      status: success ? ('executed' as const) : ('pending' as const),
    };

    await db.chatMessages.update(messageId, { actions: finalActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: finalActions } : m)),
    }));
  },

  confirmAllActions: async (messageId) => {
    const { messages } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.actions.length === 0) return;

    const pendingActions = msg.actions.filter((a) => a.status === 'pending');
    if (pendingActions.length === 0) return;

    // Mark all as confirmed
    const confirmedActions = msg.actions.map((a) =>
      a.status === 'pending' ? { ...a, status: 'confirmed' as const } : a
    );

    await db.chatMessages.update(messageId, { actions: confirmedActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: confirmedActions } : m)),
    }));

    // Execute all pending (now confirmed) actions
    const toolCalls: ZhipuToolCall[] = [];
    const toolResults: Array<{ tool_call_id: string; content: string }> = [];

    for (const action of confirmedActions) {
      if (action.status !== 'confirmed') continue;

      const resultText = await executeAction(action);
      // Generate synthetic tool_call_id for result loop
      const toolCallId = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
      toolCalls.push({
        id: toolCallId,
        type: 'function',
        function: {
          name: action.type,
          arguments: JSON.stringify(action.payload),
        },
      });
      toolResults.push({
        tool_call_id: toolCallId,
        content: resultText,
      });
    }

    // Mark all as executed
    const executedActions = confirmedActions.map((a) =>
      a.status === 'confirmed' ? { ...a, status: 'executed' as const } : a
    );

    await db.chatMessages.update(messageId, { actions: executedActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: executedActions } : m)),
    }));

    // Send tool results to AI for final response (result loop)
    try {
      set({ loading: true });

      const systemPrompt = `你是一个智能个人助手。以下是工具执行的结果，请根据结果给用户一个自然语言的总结回复。`;
      const conversationMessages: ZhipuMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      const finalText = await sendToolResult(conversationMessages, toolCalls, toolResults);

      // Append AI final response as new message
      const followUpMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: finalText,
        actions: [],
        timestamp: new Date().toISOString(),
      };
      await db.chatMessages.add(followUpMsg);
      set((state) => ({
        messages: [...state.messages, followUpMsg],
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  cancelAction: async (messageId, actionIndex) => {
    const { messages } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    if (!msg.actions[actionIndex]) return;

    const updatedActions = [...msg.actions];
    const existingAction = updatedActions[actionIndex]!;
    updatedActions[actionIndex] = { ...existingAction, status: 'cancelled' as const };

    await db.chatMessages.update(messageId, { actions: updatedActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: updatedActions } : m)),
    }));
  },

  clearMessages: async () => {
    await db.chatMessages.clear();
    set({ messages: [] });
  },
}));
