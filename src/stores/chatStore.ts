import { create } from 'zustand';
import type { ChatMessage, AiAction } from '@/types/ai';
import type { ConversationState, Intent } from '@/types/conversation';
import { createInitialConversationState } from '@/types/conversation';
import { db } from '@/services/db';
import { sendMessage, sendToolResult, executeAction } from '@/services/ai';
import type { ZhipuMessage, ZhipuToolCall } from '@/services/ai';
import { recognizeIntent } from '@/services/intent';
import { collectSlots, generateAskMessage } from '@/services/slots';
import { planActions } from '@/services/planning';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  conversationState: ConversationState;
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
  conversationState: createInitialConversationState(),

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
    const { conversationState } = get();
    set({ loading: true });

    const updatedContext = {
      ...conversationState.context,
      conversationTurn: conversationState.context.conversationTurn + 1,
    };

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
      // ---- Phase: slot_filling → user is answering follow-up questions ----
      if (conversationState.phase === 'slot_filling' && conversationState.currentIntent) {
        const { slots, missingSlots } = await collectSlots(
          content,
          conversationState.currentIntent,
          conversationState.slots,
        );

        const newState: ConversationState = {
          ...conversationState,
          slots,
          missingSlots,
          context: updatedContext,
        };

        if (missingSlots.length > 0) {
          const askText = generateAskMessage(conversationState.currentIntent, missingSlots);
          newState.phase = 'slot_filling';

          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: askText,
            actions: [],
            timestamp: new Date().toISOString(),
          };
          await db.chatMessages.add(assistantMsg);
          set((state) => ({
            messages: [...state.messages, assistantMsg],
            conversationState: newState,
            loading: false,
          }));
          return;
        }

        // Slots complete → plan
        newState.phase = 'planning';
        set({ conversationState: newState });

        const actions = await planActions(
          conversationState.currentIntent,
          slots,
          updatedContext,
        );

        if (actions.length === 0) {
          const response = await sendMessage(content);
          newState.phase = 'completed';

          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.text,
            actions: response.actions,
            timestamp: new Date().toISOString(),
          };
          await db.chatMessages.add(assistantMsg);
          set((state) => ({
            messages: [...state.messages, assistantMsg],
            conversationState: newState,
            loading: false,
          }));
          return;
        }

        const summaryText = generatePlanSummary(conversationState.currentIntent, actions);
        newState.phase = 'executing';

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: summaryText,
          actions,
          timestamp: new Date().toISOString(),
        };
        await db.chatMessages.add(assistantMsg);
        set((state) => ({
          messages: [...state.messages, assistantMsg],
          conversationState: newState,
          loading: false,
        }));
        return;
      }

      // ---- Phase: idle → normal flow ----
      // Intent recognition
      const intent = await recognizeIntent(content, updatedContext);

      // chat / unknown → direct AI conversation
      if (intent === 'chat' || intent === 'unknown') {
        const response = await sendMessage(content);
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.text,
          actions: response.actions,
          timestamp: new Date().toISOString(),
        };
        await db.chatMessages.add(assistantMsg);
        set((state) => ({
          messages: [...state.messages, assistantMsg],
          conversationState: {
            ...createInitialConversationState(),
            context: updatedContext,
          },
          loading: false,
        }));
        return;
      }

      // Slot collection
      const { slots, missingSlots } = await collectSlots(content, intent, {});

      if (missingSlots.length > 0) {
        const askText = generateAskMessage(intent, missingSlots);
        const newState: ConversationState = {
          ...createInitialConversationState(),
          currentIntent: intent,
          slots,
          missingSlots,
          phase: 'slot_filling',
          context: updatedContext,
        };

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: askText,
          actions: [],
          timestamp: new Date().toISOString(),
        };
        await db.chatMessages.add(assistantMsg);
        set((state) => ({
          messages: [...state.messages, assistantMsg],
          conversationState: newState,
          loading: false,
        }));
        return;
      }

      // Slots complete → plan
      const actions = await planActions(intent, slots, updatedContext);

      if (actions.length === 0) {
        const response = await sendMessage(content);
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.text,
          actions: response.actions,
          timestamp: new Date().toISOString(),
        };
        await db.chatMessages.add(assistantMsg);
        set((state) => ({
          messages: [...state.messages, assistantMsg],
          conversationState: {
            ...createInitialConversationState(),
            context: updatedContext,
          },
          loading: false,
        }));
        return;
      }

      // Has actions → show for confirmation
      const summaryText = generatePlanSummary(intent, actions);
      const newState: ConversationState = {
        ...createInitialConversationState(),
        currentIntent: intent,
        slots,
        phase: 'executing',
        context: updatedContext,
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: summaryText,
        actions,
        timestamp: new Date().toISOString(),
      };
      await db.chatMessages.add(assistantMsg);
      set((state) => ({
        messages: [...state.messages, assistantMsg],
        conversationState: newState,
        loading: false,
      }));
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `出错了: ${error instanceof Error ? error.message : '未知错误'}`,
        actions: [],
        timestamp: new Date().toISOString(),
      };
      await db.chatMessages.add(errorMsg);
      set((state) => ({
        messages: [...state.messages, errorMsg],
        conversationState: {
          ...createInitialConversationState(),
          context: updatedContext,
        },
        loading: false,
      }));
    }
  },

  confirmAction: async (messageId, actionIndex) => {
    const { messages, conversationState } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    if (!msg.actions[actionIndex]) return;

    const action = msg.actions[actionIndex]!;
    if (action.status !== 'pending') return;

    const confirmedActions = [...msg.actions];
    confirmedActions[actionIndex] = { ...action, status: 'confirmed' as const };

    await db.chatMessages.update(messageId, { actions: confirmedActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: confirmedActions } : m)),
    }));

    const resultText = await executeAction(action);
    const success = !resultText.startsWith('操作失败');

    const finalActions = [...confirmedActions];
    finalActions[actionIndex] = {
      ...confirmedActions[actionIndex]!,
      status: success ? ('executed' as const) : ('pending' as const),
    };

    await db.chatMessages.update(messageId, { actions: finalActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: finalActions } : m)),
    }));

    set({
      conversationState: {
        ...conversationState,
        executedActions: [...conversationState.executedActions, action],
      },
    });
  },

  confirmAllActions: async (messageId) => {
    const { messages, conversationState } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.actions.length === 0) return;

    const pendingActions = msg.actions.filter((a) => a.status === 'pending');
    if (pendingActions.length === 0) return;

    const confirmedActions = msg.actions.map((a) =>
      a.status === 'pending' ? { ...a, status: 'confirmed' as const } : a
    );

    await db.chatMessages.update(messageId, { actions: confirmedActions as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: confirmedActions } : m)),
    }));

    const toolCalls: ZhipuToolCall[] = [];
    const toolResults: Array<{ tool_call_id: string; content: string }> = [];
    const executedActions: AiAction[] = [];

    for (const action of confirmedActions) {
      if (action.status !== 'confirmed') continue;

      const resultText = await executeAction(action);
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
      executedActions.push({ ...action, status: 'executed' as const });
    }

    const executedResult = confirmedActions.map((a) =>
      a.status === 'confirmed' ? { ...a, status: 'executed' as const } : a
    );

    await db.chatMessages.update(messageId, { actions: executedResult as never });
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, actions: executedResult } : m)),
    }));

    set({
      conversationState: {
        ...conversationState,
        executedActions: [...conversationState.executedActions, ...executedActions],
      },
    });

    try {
      set({ loading: true });

      const systemPrompt = '你是一个智能个人助手。以下是工具执行的结果，请根据结果给用户一个自然语言的总结回复。';
      const conversationMessages: ZhipuMessage[] = [
        { role: 'system', content: systemPrompt },
      ];

      const finalText = await sendToolResult(conversationMessages, toolCalls, toolResults);

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
        conversationState: {
          ...conversationState,
          phase: 'completed',
        },
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  cancelAction: async (messageId, actionIndex) => {
    const { messages, conversationState } = get();
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

    const allDone = updatedActions.every((a) => a.status === 'executed' || a.status === 'cancelled');
    if (allDone) {
      set({
        conversationState: {
          ...conversationState,
          phase: 'completed',
        },
      });
    }
  },

  clearMessages: async () => {
    await db.chatMessages.clear();
    set({
      messages: [],
      conversationState: createInitialConversationState(),
    });
  },
}));

/** Generate plan summary text */
function generatePlanSummary(intent: Intent, actions: AiAction[]): string {
  const intentLabels: Record<string, string> = {
    add_todo: '创建待办',
    update_todo: '修改待办',
    delete_todo: '删除待办',
    add_plan: '创建学习计划',
    update_plan: '修改学习计划',
    delete_plan: '删除学习计划',
    add_note: '创建笔记',
    update_note: '修改笔记',
    delete_note: '删除笔记',
    plan_weekly: '周计划',
    plan_study: '学习规划',
    plan_schedule: '日程安排',
    suggest_todos: '待办建议',
    analyze_progress: '进度分析',
  };

  const label = intentLabels[intent] ?? intent;
  if (actions.length === 1) {
    return `我将为你${label}：${actions[0]!.description}。请确认是否执行。`;
  }
  const actionList = actions.map((a, i) => `${i + 1}. ${a.description}`).join('\n');
  return `我为你制定了${label}计划，共 ${actions.length} 个操作：\n${actionList}\n\n请确认是否执行。`;
}
