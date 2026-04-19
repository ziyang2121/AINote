import { db } from '@/services/db';
import { useTodoStore } from '@/stores/todoStore';
import { useLearningStore } from '@/stores/learningStore';
import { useNoteStore } from '@/stores/noteStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { AiAction } from '@/types/ai';
import type { LearningTask } from '@/types/learning';

const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

function buildSystemPrompt(): string {
  const todos = useTodoStore.getState().todos;
  const plans = useLearningStore.getState().plans;
  const notes = useNoteStore.getState().notes;

  const todoSection = todos.length > 0
    ? `【待办事项】(${todos.length}条)\n${todos.map(t => `- [${t.completed ? '✓' : '○'}] ${t.title} | 优先级:P${t.priority} | 截止:${t.dueDate || '无'} | 标签:${t.tags.join(',') || '无'}${t.content ? ` | 备注:${t.content.slice(0, 50)}` : ''}`).join('\n')}`
    : '【待办事项】暂无';

  const planSection = plans.length > 0
    ? `【学习计划】(${plans.length}个)\n${plans.map(p => {
      const totalTasks = countTasks(p.tasks);
      const completed = countCompleted(p.tasks);
      const taskList = p.tasks.map(t => `  - [${t.completed ? '✓' : '○'}] ${t.title}`).join('\n');
      return `- ${p.title}: ${completed}/${totalTasks} 已完成 | 打卡${p.checkInDates.length}天\n${taskList}`;
    }).join('\n')}`
    : '【学习计划】暂无';

  const noteSection = notes.length > 0
    ? `【笔记】(${notes.length}条)\n${notes.map(n => `- ${n.title}: ${n.content.slice(0, 80)}${n.content.length > 80 ? '...' : ''}`).join('\n')}`
    : '【笔记】暂无';

  const now = new Date();
  const todayStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

  return `你是一个智能个人助手，帮助用户管理待办事项、学习计划和笔记。

## 时间信息（重要）
- 今天是：${todayStr}
- 日期格式：YYYY-MM-DD（例如 ${now.toISOString().slice(0, 10)}）
- 明天的日期是：${tomorrowStr}
- 设置截止日期时，必须使用 YYYY-MM-DD 格式。如果用户说"明天"，请用 ${tomorrowStr}；说"后天"则 +2 天，以此类推。

## 模块职责与使用规则

### 待办事项 (add_todo / update_todo / delete_todo)
适用场景：任何需要"做"的事情。包括但不限于：
- 一次性任务、日程安排、提醒事项
- 短笔记、备忘信息（使用 content 字段存储详细内容）
触发关键词：提醒我、帮我做、任务、待办、记一下（短信息）、deadline

**多事项处理规则（非常重要）：**
当用户一次提到多个事项时（用逗号"、"和"、"并"、"还有"、"另外"等连接），你必须为每个事项分别发起一个独立的 add_todo 工具调用。例如：
- 用户说"买菜，交水费，退衣服" → 发起 3 个 add_todo 调用，每个对应一件事
- 绝对不要把多个事项合并到一个 add_todo 的 title 中
- 每个事项的 dueDate 根据用户提到的时间统一设置（如都设为明天）

### 学习计划 (add_plan / update_plan / delete_plan)
适用场景：需要持续学习、系统掌握某个主题时。
关键规则：
- 创建学习计划时，你必须将目标拆解为多个阶段性任务（至少 3 个，建议 3-8 个）
- 每个任务应该是具体可执行的，而不是笼统的方向
- 任务之间应有逻辑递进关系（基础 → 进阶 → 实战）
- 如果用户说的主题较大，主动拆分为 5-8 个步骤
- 每个任务可以有子任务（subTasks）来进一步细化
触发关键词：学习、掌握、学习路线、学习计划、XX入门

### 笔记 (add_note / update_note / delete_note)
适用场景：记录信息、知识、想法、长文本内容。
- 适合存储参考资料、会议记录、技术笔记、灵感等
- 不需要"完成"的内容
触发关键词：笔记、记录这段、参考资料、摘录、这段内容记一下

### 判断决策树
用户说"学习XX"/"掌握XX"/"XX学习路线" → 学习计划
用户说"提醒我"/"帮我做"/"XX任务"/"记一下XX（短）" → 待办事项
用户说"笔记"/"记录这段话"/"参考资料"/"摘录" → 笔记
如果仍然无法判断，优先询问用户想要创建待办事项、学习计划还是笔记。

## 当前用户数据状态
${todoSection}

${planSection}

${noteSection}

## 行为规则
1. 当需要执行数据操作时，请使用对应的工具函数。
2. 在执行任何数据修改操作前，请先用自然语言向用户说明你将要做什么，然后调用工具函数。
3. 创建学习计划时，务必将目标拆解为多个有递进关系的阶段性任务。
4. 不要重复创建已有的内容。先检查当前数据状态。
5. **多事项必须分多次调用**：用户一次说多件事时，每件事都要单独调一次 add_todo，不要合并。`;
}

function countTasks(tasks: { subTasks?: unknown[] }[]): number {
  return tasks.reduce((sum, t) => sum + 1 + countTasks((t.subTasks ?? []) as typeof tasks), 0);
}

function countCompleted(tasks: { completed: boolean; subTasks?: unknown[] }[]): number {
  return tasks.reduce(
    (sum, t) => sum + (t.completed ? 1 : 0) + countCompleted((t.subTasks ?? []) as typeof tasks),
    0
  );
}

// Recursive task item schema for learning plan tools
const taskItemSchema = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const, description: '任务标题，应具体可执行' },
    resources: { type: 'array' as const, items: { type: 'string' as const }, description: '学习资源链接' },
    subTasks: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const, description: '子任务标题' },
          resources: { type: 'array' as const, items: { type: 'string' as const }, description: '学习资源链接' },
          subTasks: { type: 'array' as const, description: '嵌套子任务（最多两层）' },
        },
        required: ['title'] as string[],
      },
      description: '子任务列表，用于进一步拆分复杂任务',
    },
  },
  required: ['title'] as string[],
};

const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'add_todo',
      description: '创建待办事项。适用于一次性任务、提醒、短笔记。如果需要记录较长的内容可填入 content 字段。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '待办标题' },
          description: { type: 'string', description: '简要描述' },
          content: { type: 'string', description: '详细内容/备注（长文本）' },
          priority: { type: 'number', description: '优先级1-5，1最高，默认3' },
          dueDate: { type: 'string', description: '截止日期，格式 YYYY-MM-DD' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签列表' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_todo',
      description: '修改已有的待办事项',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '待办事项ID' },
          title: { type: 'string', description: '新标题' },
          description: { type: 'string', description: '新描述' },
          content: { type: 'string', description: '新内容' },
          priority: { type: 'number', description: '新优先级1-5' },
          dueDate: { type: 'string', description: '新截止日期 YYYY-MM-DD' },
          completed: { type: 'boolean', description: '是否完成' },
          tags: { type: 'array', items: { type: 'string' }, description: '新标签列表' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_todo',
      description: '删除待办事项',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '待办事项ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_plan',
      description: '创建学习计划。创建时必须将学习目标拆解为多个具体、有递进关系的阶段性任务（至少3个，建议3-8个）。每个任务应可独立执行，任务间有逻辑关系（基础→进阶→实战）。复杂任务可通过 subTasks 进一步拆分。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '计划标题' },
          description: { type: 'string', description: '计划描述、学习目标' },
          tasks: {
            type: 'array',
            items: taskItemSchema,
            description: '学习任务列表（至少3个，有递进关系）',
          },
        },
        required: ['title', 'tasks'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_plan',
      description: '修改已有的学习计划',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '学习计划ID' },
          title: { type: 'string', description: '新标题' },
          description: { type: 'string', description: '新描述' },
          tasks: { type: 'array', description: '新的任务列表', items: taskItemSchema },
          checkInDates: { type: 'array', items: { type: 'string' }, description: '打卡日期列表' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_plan',
      description: '删除学习计划',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '学习计划ID' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_note',
      description: '创建笔记。适用于记录信息、知识、想法、参考资料、会议记录等不需要"完成"的长文本内容。与待办事项的区别：笔记没有优先级、截止日期、完成状态。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '笔记标题' },
          content: { type: 'string', description: '笔记内容（支持长文本）' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签列表' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_note',
      description: '修改已有的笔记',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '笔记ID' },
          title: { type: 'string', description: '新标题' },
          content: { type: 'string', description: '新内容' },
          tags: { type: 'array', items: { type: 'string' }, description: '新标签列表' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_note',
      description: '删除笔记',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '笔记ID' },
        },
        required: ['id'],
      },
    },
  },
];

export interface ZhipuToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ZhipuMessage {
  role: string;
  content: string | null;
  tool_calls?: ZhipuToolCall[];
  tool_call_id?: string;
}

interface ZhipuResponse {
  choices: Array<{
    message: ZhipuMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AiResponse {
  text: string;
  actions: AiAction[];
  toolCalls?: ZhipuToolCall[];
}

export async function callApi(messages: ZhipuMessage[]): Promise<ZhipuMessage> {
  const { apiKey, model } = useSettingsStore.getState();
  if (!apiKey) throw new Error('请先在设置中配置 API Key');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${error}`);
  }

  const data: ZhipuResponse = await response.json();
  const message = data.choices[0]?.message;
  if (!message) throw new Error('API 返回了空响应');
  return message;
}

function parseToolCalls(toolCalls: ZhipuToolCall[] | undefined): AiAction[] {
  if (!toolCalls) return [];
  return toolCalls.map((tc) => {
    const args = JSON.parse(tc.function.arguments);
    return {
      type: tc.function.name as AiAction['type'],
      payload: args,
      description: describeAction(tc.function.name, args),
      status: 'pending' as const,
    };
  });
}

export async function sendMessage(userMessage: string): Promise<AiResponse> {
  const systemPrompt = buildSystemPrompt();

  const messages: ZhipuMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Load recent chat history (last 20 messages)
  const recentMessages = await db.chatMessages
    .orderBy('timestamp')
    .reverse()
    .limit(20)
    .reverse()
    .toArray();

  for (const msg of recentMessages) {
    if (msg.role === 'system') continue;
    // Preserve tool_calls from assistant messages
    const zhipuMsg: ZhipuMessage = {
      role: msg.role,
      content: msg.content || null,
    };
    // Note: We don't restore tool_calls from history to avoid complex state reconstruction.
    // The system prompt rebuilds current data state each time, which provides sufficient context.
    messages.push(zhipuMsg);
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  const message = await callApi(messages);

  const text = message.content || '';
  const actions = parseToolCalls(message.tool_calls);

  return { text, actions, toolCalls: message.tool_calls };
}

export async function sendToolResult(
  conversationMessages: ZhipuMessage[],
  toolCalls: ZhipuToolCall[],
  toolResults: Array<{ tool_call_id: string; content: string }>
): Promise<string> {
  // Append the assistant message with tool_calls
  conversationMessages.push({
    role: 'assistant',
    content: null,
    tool_calls: toolCalls,
  });

  // Append each tool result
  for (const result of toolResults) {
    conversationMessages.push({
      role: 'tool',
      content: result.content,
      tool_call_id: result.tool_call_id,
    });
  }

  // Call API again to get final response
  const message = await callApi(conversationMessages);
  return message.content || '';
}

export async function executeAction(action: AiAction): Promise<string> {
  try {
    const { payload } = action;

    switch (action.type) {
      case 'add_todo': {
        const store = useTodoStore.getState();
        await store.addTodo({
          title: (payload.title as string) || '未命名',
          description: (payload.description as string) || '',
          content: (payload.content as string) || '',
          priority: (payload.priority as 1 | 2 | 3 | 4 | 5) || 3,
          dueDate: (payload.dueDate as string) || null,
          completed: false,
          tags: (payload.tags as string[]) || [],
        });
        return `成功创建待办事项「${payload.title}」`;
      }
      case 'update_todo': {
        const store = useTodoStore.getState();
        const updates: Record<string, unknown> = {};
        if (payload.title !== undefined) updates.title = payload.title;
        if (payload.description !== undefined) updates.description = payload.description;
        if (payload.content !== undefined) updates.content = payload.content;
        if (payload.priority !== undefined) updates.priority = payload.priority;
        if (payload.dueDate !== undefined) updates.dueDate = payload.dueDate;
        if (payload.completed !== undefined) updates.completed = payload.completed;
        if (payload.tags !== undefined) updates.tags = payload.tags;
        await store.updateTodo(payload.id as string, updates);
        return `成功修改待办事项，ID: ${payload.id}`;
      }
      case 'delete_todo': {
        const store = useTodoStore.getState();
        await store.deleteTodo(payload.id as string);
        return `成功删除待办事项，ID: ${payload.id}`;
      }
      case 'add_plan': {
        const store = useLearningStore.getState();
        const rawTasks = (payload.tasks as Array<{
          title: string;
          resources?: string[];
          subTasks?: Array<{ title: string; resources?: string[]; subTasks?: unknown[] }>;
        }>) || [];
        const tasks = rawTasks.map((t) => ({
          id: crypto.randomUUID(),
          title: t.title,
          completed: false,
          resources: t.resources || [],
          subTasks: mapSubTasks(t.subTasks) as LearningTask[],
        }));
        await store.addPlan({
          title: (payload.title as string) || '未命名计划',
          description: (payload.description as string) || '',
          tasks,
          checkInDates: [],
        });
        return `成功创建学习计划「${payload.title}」，包含 ${tasks.length} 个任务`;
      }
      case 'update_plan': {
        const store = useLearningStore.getState();
        await store.updatePlan(payload.id as string, payload);
        return `成功修改学习计划，ID: ${payload.id}`;
      }
      case 'delete_plan': {
        const store = useLearningStore.getState();
        await store.deletePlan(payload.id as string);
        return `成功删除学习计划，ID: ${payload.id}`;
      }
      case 'add_note': {
        const store = useNoteStore.getState();
        await store.addNote({
          title: (payload.title as string) || '未命名',
          content: (payload.content as string) || '',
          tags: (payload.tags as string[]) || [],
        });
        return `成功创建笔记「${payload.title}」`;
      }
      case 'update_note': {
        const store = useNoteStore.getState();
        const updates: Record<string, unknown> = {};
        if (payload.title !== undefined) updates.title = payload.title;
        if (payload.content !== undefined) updates.content = payload.content;
        if (payload.tags !== undefined) updates.tags = payload.tags;
        await store.updateNote(payload.id as string, updates);
        return `成功修改笔记，ID: ${payload.id}`;
      }
      case 'delete_note': {
        const store = useNoteStore.getState();
        await store.deleteNote(payload.id as string);
        return `成功删除笔记，ID: ${payload.id}`;
      }
      case 'list_todo': {
        const store = useTodoStore.getState();
        const list = store.todos.map(t => `[${t.completed ? '✓' : '○'}] ${t.title} (P${t.priority})`).join('\n');
        return list || '暂无待办事项';
      }
      case 'complete_todo': {
        const store = useTodoStore.getState();
        await store.updateTodo(payload.id as string, { completed: true });
        return `已完成待办事项，ID: ${payload.id}`;
      }
      case 'list_plan': {
        const store = useLearningStore.getState();
        const list = store.plans.map(p => `- ${p.title}`).join('\n');
        return list || '暂无学习计划';
      }
      case 'list_note': {
        const store = useNoteStore.getState();
        const list = store.notes.map(n => `- ${n.title}`).join('\n');
        return list || '暂无笔记';
      }
      case 'plan_weekly':
      case 'plan_study':
      case 'plan_schedule':
      case 'suggest_todos':
      case 'analyze_progress':
        return `复杂意图 ${action.type} 应通过规划引擎处理`;
      default:
        return `未知操作类型: ${action.type}`;
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : '未知错误';
    return `操作失败: ${errMsg}`;
  }
}

function mapSubTasks(rawSubTasks: Array<{ title: string; resources?: string[]; subTasks?: unknown[] }> | undefined): LearningTask[] {
  if (!rawSubTasks) return [];
  return rawSubTasks.map((t) => ({
    id: crypto.randomUUID(),
    title: t.title,
    completed: false,
    resources: t.resources || [],
    subTasks: mapSubTasks(t.subTasks as Array<{ title: string; resources?: string[]; subTasks?: unknown[] }>),
  }));
}

function describeAction(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'add_todo': return `创建待办: ${args.title}`;
    case 'update_todo': return `修改待办 (${args.id}): ${JSON.stringify(args)}`;
    case 'delete_todo': return `删除待办: ${args.id}`;
    case 'add_plan': return `创建学习计划: ${args.title}`;
    case 'update_plan': return `修改学习计划 (${args.id})`;
    case 'delete_plan': return `删除学习计划: ${args.id}`;
    case 'add_note': return `创建笔记: ${args.title}`;
    case 'update_note': return `修改笔记 (${args.id})`;
    case 'delete_note': return `删除笔记: ${args.id}`;
    case 'list_todo': return '列出待办事项';
    case 'complete_todo': return `完成待办: ${args.id}`;
    case 'list_plan': return '列出学习计划';
    case 'list_note': return '列出笔记';
    case 'plan_weekly': return '制定周计划';
    case 'plan_study': return '制定学习规划';
    case 'plan_schedule': return '安排日程';
    case 'suggest_todos': return '建议待办';
    case 'analyze_progress': return '分析进度';
    default: return `未知操作: ${name}`;
  }
}
