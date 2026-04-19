# AI 助手多轮状态管理与规划模块 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 AI 助手添加意图识别、槽位填充、规划引擎和多轮对话状态管理能力。

**Architecture:** 规则引擎+AI 混合架构。意图识别层优先规则匹配，AI 作为 fallback；槽位管理层负责参数收集与多轮追问；规划引擎区分简单/复杂意图分别映射或生成执行计划；对话状态通过 Zustand store 管理。

**Tech Stack:** React 18, TypeScript (strict), Zustand 5, 智谱 AI API (GLM-4), Ant Design 5

---

## 文件结构

```
src/
├── types/
│   ├── ai.ts                    # 修改：扩展 AiAction type，新增 Intent 相关类型
│   └── conversation.ts          # 新增：对话状态类型定义
├── services/
│   ├── intent/                  # 新增：意图识别层
│   │   ├── index.ts             # 意图识别入口（规则优先 + AI fallback）
│   │   ├── definitions.ts       # 意图枚举与规则定义
│   │   └── aiRecognizer.ts      # AI 意图识别 fallback
│   ├── slots/                   # 新增：槽位管理层
│   │   ├── index.ts             # 槽位管理入口（提取 + 校验 + 追问生成）
│   │   └── definitions.ts       # 各意图的槽位定义
│   ├── planning/                # 新增：规划引擎
│   │   ├── index.ts             # 规划引擎入口（区分简单/复杂意图）
│   │   ├── mapper.ts            # 简单意图 → Action 映射
│   │   └── generator.ts         # 复杂意图 → AI 生成 Action 列表
│   └── ai.ts                    # 修改：重构 sendMessage 集成新模块
├── stores/
│   └── chatStore.ts             # 修改：新增 conversationState
└── components/
    └── AiChat/
        └── AiChatWindow.tsx     # 修改：适配追问流程 UI
```

---

### Task 1: 类型定义 — `src/types/conversation.ts`

**Files:**
- Create: `src/types/conversation.ts`
- Modify: `src/types/ai.ts`

- [ ] **Step 1: 创建对话状态类型文件**

创建 `src/types/conversation.ts`：

```typescript
import type { AiAction } from './ai';

/** 对话阶段 */
export type ConversationPhase =
  | 'idle'
  | 'intent_recognition'
  | 'slot_filling'
  | 'planning'
  | 'executing'
  | 'completed';

/** 意图类型 */
export type Intent =
  // 待办相关
  | 'add_todo' | 'update_todo' | 'delete_todo' | 'list_todo' | 'complete_todo'
  // 计划相关
  | 'add_plan' | 'update_plan' | 'delete_plan' | 'list_plan'
  // 笔记相关
  | 'add_note' | 'update_note' | 'delete_note' | 'list_note'
  // 规划意图
  | 'plan_weekly' | 'plan_study' | 'plan_schedule'
  // 主动建议
  | 'suggest_todos' | 'analyze_progress'
  // 通用
  | 'chat' | 'unknown';

/** 槽位定义 */
export interface SlotDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'entity_ref' | 'array';
  required: boolean;
  askPrompt?: string;
}

/** 对话上下文 */
export interface ConversationContext {
  mentionedEntities: Record<string, string>;
  lastTopic: string;
  conversationTurn: number;
}

/** 对话状态 */
export interface ConversationState {
  currentIntent: Intent | null;
  slots: Record<string, unknown>;
  missingSlots: string[];
  phase: ConversationPhase;
  currentPlan: Plan | null;
  executedActions: AiAction[];
  context: ConversationContext;
}

/** 执行计划 */
export interface Plan {
  id: string;
  intent: Intent;
  actions: PlannedAction[];
  currentStep: number;
}

/** 计划中的单个 Action */
export interface PlannedAction {
  action: AiAction;
  dependencies: string[];
  status: 'pending' | 'ready' | 'executing' | 'completed' | 'failed';
}

/** 初始对话状态 */
export function createInitialConversationState(): ConversationState {
  return {
    currentIntent: null,
    slots: {},
    missingSlots: [],
    phase: 'idle',
    currentPlan: null,
    executedActions: [],
    context: {
      mentionedEntities: {},
      lastTopic: '',
      conversationTurn: 0,
    },
  };
}
```

- [ ] **Step 2: 扩展 AiAction 类型以支持新意图**

修改 `src/types/ai.ts`，在 `AiAction.type` 联合类型中追加新意图：

将第 9-12 行的 `AiAction` 接口的 `type` 字段从：
```typescript
  type: 'add_todo' | 'update_todo' | 'delete_todo'
       | 'add_plan' | 'update_plan' | 'delete_plan'
       | 'add_note' | 'update_note' | 'delete_note';
```
改为：
```typescript
  type: 'add_todo' | 'update_todo' | 'delete_todo' | 'list_todo' | 'complete_todo'
       | 'add_plan' | 'update_plan' | 'delete_plan' | 'list_plan'
       | 'add_note' | 'update_note' | 'delete_note' | 'list_note'
       | 'plan_weekly' | 'plan_study' | 'plan_schedule'
       | 'suggest_todos' | 'analyze_progress';
```

- [ ] **Step 3: 运行类型检查确认无报错**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

- [ ] **Step 4: Commit**

```bash
git add src/types/conversation.ts src/types/ai.ts
git commit -m "feat: add conversation state types and extend AiAction intent types"
```

---

### Task 2: 意图识别层 — `src/services/intent/`

**Files:**
- Create: `src/services/intent/definitions.ts`
- Create: `src/services/intent/aiRecognizer.ts`
- Create: `src/services/intent/index.ts`

- [ ] **Step 1: 创建意图定义与规则**

创建 `src/services/intent/definitions.ts`：

```typescript
import type { Intent } from '@/types/conversation';

/** 规则匹配模式 */
export interface IntentRule {
  intent: Intent;
  patterns: RegExp[];
  keywords: string[];
}

/** 意图规则表 */
export const INTENT_RULES: IntentRule[] = [
  // ---- 待办 ----
  {
    intent: 'add_todo',
    patterns: [/添加.*待办/, /新建.*任务/, /创建.*todo/i, /提醒我/, /帮我做/, /记一下/],
    keywords: ['添加', '新建', '创建', '待办', '任务', '提醒', '记一下'],
  },
  {
    intent: 'update_todo',
    patterns: [/修改.*待办/, /更新.*任务/, /改一下.*todo/i, /编辑.*待办/],
    keywords: ['修改', '更新', '编辑', '改一下'],
  },
  {
    intent: 'delete_todo',
    patterns: [/删除.*待办/, /移除.*任务/, /去掉.*todo/i],
    keywords: ['删除', '移除', '去掉'],
  },
  {
    intent: 'list_todo',
    patterns: [/有哪些.*待办/, /待办.*列表/, /显示.*任务/, /查看.*待办/],
    keywords: ['列表', '有哪些', '查看', '显示'],
  },
  {
    intent: 'complete_todo',
    patterns: [/完成.*待办/, /打卡.*任务/, /标记.*完成/],
    keywords: ['完成', '打卡', '标记完成'],
  },
  // ---- 计划 ----
  {
    intent: 'add_plan',
    patterns: [/学习.*计划/, /制定.*计划/, /学习路线/, /入门.*计划/],
    keywords: ['学习计划', '制定计划', '学习路线'],
  },
  {
    intent: 'update_plan',
    patterns: [/修改.*计划/, /更新.*计划/, /编辑.*计划/],
    keywords: ['修改计划', '更新计划'],
  },
  {
    intent: 'delete_plan',
    patterns: [/删除.*计划/, /移除.*计划/],
    keywords: ['删除计划'],
  },
  {
    intent: 'list_plan',
    patterns: [/有哪些.*计划/, /计划.*列表/, /查看.*计划/],
    keywords: ['查看计划'],
  },
  // ---- 笔记 ----
  {
    intent: 'add_note',
    patterns: [/记.*笔记/, /记录.*内容/, /摘录/, /参考资料/],
    keywords: ['笔记', '记录', '摘录', '参考资料'],
  },
  {
    intent: 'update_note',
    patterns: [/修改.*笔记/, /更新.*笔记/, /编辑.*笔记/],
    keywords: ['修改笔记'],
  },
  {
    intent: 'delete_note',
    patterns: [/删除.*笔记/, /移除.*笔记/],
    keywords: ['删除笔记'],
  },
  {
    intent: 'list_note',
    patterns: [/有哪些.*笔记/, /笔记.*列表/, /查看.*笔记/],
    keywords: ['查看笔记'],
  },
  // ---- 规划意图 ----
  {
    intent: 'plan_weekly',
    patterns: [/安排.*周/, /本周.*计划/, /周计划/, /这周.*安排/, /一周.*规划/],
    keywords: ['周计划', '本周安排', '这周'],
  },
  {
    intent: 'plan_study',
    patterns: [/规划.*学习/, /学习.*规划/, /系统学/],
    keywords: ['学习规划', '系统学'],
  },
  {
    intent: 'plan_schedule',
    patterns: [/安排.*日程/, /日程.*规划/, /时间.*安排/],
    keywords: ['日程', '时间安排'],
  },
  // ---- 主动建议 ----
  {
    intent: 'suggest_todos',
    patterns: [/建议.*待办/, /推荐.*任务/, /帮我.*建议/],
    keywords: ['建议', '推荐'],
  },
  {
    intent: 'analyze_progress',
    patterns: [/分析.*进度/, /进度.*分析/, /完成.*情况/],
    keywords: ['进度', '完成情况'],
  },
];

/** 复杂意图集合（需要 AI 生成计划） */
export const COMPLEX_INTENTS: Set<Intent> = new Set([
  'plan_weekly',
  'plan_study',
  'plan_schedule',
  'suggest_todos',
  'analyze_progress',
]);

/** 判断是否为复杂意图 */
export function isComplexIntent(intent: Intent): boolean {
  return COMPLEX_INTENTS.has(intent);
}
```

- [ ] **Step 2: 创建 AI 意图识别 fallback**

创建 `src/services/intent/aiRecognizer.ts`：

```typescript
import type { Intent } from '@/types/conversation';
import type { ZhipuMessage } from '@/services/ai';
import { callApi } from '@/services/ai';

const ALL_INTENTS: Intent[] = [
  'add_todo', 'update_todo', 'delete_todo', 'list_todo', 'complete_todo',
  'add_plan', 'update_plan', 'delete_plan', 'list_plan',
  'add_note', 'update_note', 'delete_note', 'list_note',
  'plan_weekly', 'plan_study', 'plan_schedule',
  'suggest_todos', 'analyze_progress',
  'chat', 'unknown',
];

/**
 * 当规则匹配未命中时，使用 AI 识别意图
 */
export async function recognizeIntentWithAI(input: string, contextTurn: number): Promise<Intent> {
  const messages: ZhipuMessage[] = [
    {
      role: 'system',
      content: `你是一个意图分类器。根据用户输入，从以下意图中选择最匹配的一个：
${ALL_INTENTS.map((i) => `- ${i}`).join('\n')}

规则：
- 只输出意图名称，不要其他内容
- 如果无法判断，输出 chat
- 如果用户在回答之前的追问，根据上下文判断意图`,
    },
    {
      role: 'user',
      content: `用户输入：${input}\n当前是第 ${contextTurn} 轮对话`,
    },
  ];

  const response = await callApi(messages);
  const text = (response.content ?? '').trim().toLowerCase();

  // 从 AI 响应中提取有效意图
  for (const intent of ALL_INTENTS) {
    if (text.includes(intent)) {
      return intent;
    }
  }
  return 'chat';
}
```

- [ ] **Step 3: 创建意图识别入口**

创建 `src/services/intent/index.ts`：

```typescript
import type { Intent } from '@/types/conversation';
import type { ConversationContext } from '@/types/conversation';
import { INTENT_RULES } from './definitions';
import { recognizeIntentWithAI } from './aiRecognizer';

/**
 * 规则匹配：计算输入与规则的匹配分数
 */
function matchWithRules(input: string): { intent: Intent; score: number } | null {
  let bestMatch: { intent: Intent; score: number } | null = null;

  for (const rule of INTENT_RULES) {
    let score = 0;

    // 正则匹配（权重更高）
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        score += 3;
      }
    }

    // 关键词匹配
    for (const keyword of rule.keywords) {
      if (input.includes(keyword)) {
        score += 1;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { intent: rule.intent, score };
    }
  }

  return bestMatch;
}

/**
 * 意图识别入口：规则优先，AI fallback
 */
export async function recognizeIntent(
  input: string,
  context: ConversationContext,
): Promise<Intent> {
  // 1. 如果当前处于 slot_filling 阶段，保持现有意图
  // （用户在回答追问，意图不变——此逻辑在 chatStore 中处理）

  // 2. 规则匹配
  const ruleResult = matchWithRules(input);
  if (ruleResult && ruleResult.score >= 2) {
    return ruleResult.intent;
  }

  // 3. AI fallback
  try {
    return await recognizeIntentWithAI(input, context.conversationTurn);
  } catch {
    // AI 识别失败，回退到 chat
    return 'chat';
  }
}

export { isComplexIntent } from './definitions';
```

- [ ] **Step 4: 在 ai.ts 中导出 callApi**

修改 `src/services/ai.ts` 第 320 行，将 `callApi` 从私有函数改为导出：

将 `async function callApi` 改为 `export async function callApi`

- [ ] **Step 5: 运行类型检查**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

- [ ] **Step 6: Commit**

```bash
git add src/services/intent/ src/services/ai.ts
git commit -m "feat: add intent recognition layer with rule-based + AI fallback"
```

---

### Task 3: 槽位管理层 — `src/services/slots/`

**Files:**
- Create: `src/services/slots/definitions.ts`
- Create: `src/services/slots/index.ts`

- [ ] **Step 1: 创建槽位定义**

创建 `src/services/slots/definitions.ts`：

```typescript
import type { Intent } from '@/types/conversation';
import type { SlotDefinition } from '@/types/conversation';

/** 各意图的槽位定义 */
export const INTENT_SLOTS: Partial<Record<Intent, SlotDefinition[]>> = {
  add_todo: [
    { name: 'title', type: 'string', required: true, askPrompt: '请告诉我待办的标题' },
    { name: 'dueDate', type: 'date', required: false, askPrompt: '这个待办的截止日期是？' },
    { name: 'priority', type: 'number', required: false, askPrompt: '优先级是多少（1-5）？' },
    { name: 'tags', type: 'array', required: false },
  ],
  update_todo: [
    { name: 'todoId', type: 'entity_ref', required: true, askPrompt: '你想修改哪个待办？请提供标题或ID' },
    { name: 'title', type: 'string', required: false },
    { name: 'dueDate', type: 'date', required: false },
    { name: 'priority', type: 'number', required: false },
    { name: 'completed', type: 'string', required: false },
  ],
  delete_todo: [
    { name: 'todoId', type: 'entity_ref', required: true, askPrompt: '你想删除哪个待办？' },
  ],
  list_todo: [],
  complete_todo: [
    { name: 'todoId', type: 'entity_ref', required: true, askPrompt: '你想完成哪个待办？' },
  ],
  add_plan: [
    { name: 'title', type: 'string', required: true, askPrompt: '学习计划的标题是什么？' },
    { name: 'description', type: 'string', required: false, askPrompt: '请描述一下学习目标' },
  ],
  update_plan: [
    { name: 'planId', type: 'entity_ref', required: true, askPrompt: '你想修改哪个学习计划？' },
  ],
  delete_plan: [
    { name: 'planId', type: 'entity_ref', required: true, askPrompt: '你想删除哪个学习计划？' },
  ],
  list_plan: [],
  add_note: [
    { name: 'title', type: 'string', required: true, askPrompt: '笔记的标题是什么？' },
    { name: 'content', type: 'string', required: false, askPrompt: '请输入笔记内容' },
    { name: 'tags', type: 'array', required: false },
  ],
  update_note: [
    { name: 'noteId', type: 'entity_ref', required: true, askPrompt: '你想修改哪个笔记？' },
  ],
  delete_note: [
    { name: 'noteId', type: 'entity_ref', required: true, askPrompt: '你想删除哪个笔记？' },
  ],
  list_note: [],
  plan_weekly: [
    { name: 'focusArea', type: 'string', required: false, askPrompt: '这周的重点领域是什么？' },
    { name: 'goals', type: 'array', required: false, askPrompt: '这周你有什么主要目标？' },
  ],
  plan_study: [
    { name: 'topic', type: 'string', required: true, askPrompt: '你想学习什么主题？' },
    { name: 'duration', type: 'string', required: false, askPrompt: '预计学习多长时间？' },
  ],
  plan_schedule: [
    { name: 'date', type: 'date', required: false, askPrompt: '你要安排哪天的日程？' },
  ],
  suggest_todos: [],
  analyze_progress: [],
};

/** 获取意图的槽位定义 */
export function getSlotDefinitions(intent: Intent): SlotDefinition[] {
  return INTENT_SLOTS[intent] ?? [];
}
```

- [ ] **Step 2: 创建槽位管理入口**

创建 `src/services/slots/index.ts`：

```typescript
import type { Intent, SlotDefinition } from '@/types/conversation';
import type { ZhipuMessage } from '@/services/ai';
import { callApi } from '@/services/ai';
import { getSlotDefinitions } from './definitions';

/**
 * 从用户输入中提取槽位值
 */
async function extractSlotsFromInput(
  input: string,
  definitions: SlotDefinition[],
): Promise<Record<string, unknown>> {
  if (definitions.length === 0) return {};

  const fieldDesc = definitions
    .map((d) => `${d.name}(${d.type}${d.required ? ', 必填' : ''})`)
    .join(', ');

  const messages: ZhipuMessage[] = [
    {
      role: 'system',
      content: `从用户输入中提取信息。需要的字段：${fieldDesc}
规则：
- 以 JSON 格式输出提取结果
- 未找到的字段设为 null
- 日期格式为 YYYY-MM-DD
- entity_ref 类型：尝试匹配实体名称，输出名称字符串
- 只输出 JSON，不要其他内容`,
    },
    { role: 'user', content: input },
  ];

  const response = await callApi(messages);
  const text = (response.content ?? '').trim();

  try {
    // 提取 JSON 部分（AI 可能在 JSON 前后加文字）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]!) as Record<string, unknown>;
    }
  } catch {
    // JSON 解析失败，返回空
  }
  return {};
}

/**
 * 检查必填槽位是否完整，返回缺失的槽位名列表
 */
export function checkMissingSlots(
  intent: Intent,
  slots: Record<string, unknown>,
): string[] {
  const definitions = getSlotDefinitions(intent);
  return definitions
    .filter((d) => d.required && (slots[d.name] === undefined || slots[d.name] === null))
    .map((d) => d.name);
}

/**
 * 生成追问消息
 */
export function generateAskMessage(intent: Intent, missingSlots: string[]): string {
  const definitions = getSlotDefinitions(intent);
  const missing = definitions.filter((d) => missingSlots.includes(d.name));

  if (missing.length === 0) return '';

  const prompts = missing
    .map((d) => d.askPrompt ?? `请提供${d.name}`)
    .join('；');

  return prompts;
}

/**
 * 槽位收集入口：提取 + 合并 + 校验
 */
export async function collectSlots(
  input: string,
  intent: Intent,
  existingSlots: Record<string, unknown>,
): Promise<{
  slots: Record<string, unknown>;
  missingSlots: string[];
}> {
  const definitions = getSlotDefinitions(intent);

  // 从用户输入提取新槽位
  const extracted = await extractSlotsFromInput(input, definitions);

  // 合并：新提取的值覆盖已有值（非 null 的才覆盖）
  const merged: Record<string, unknown> = { ...existingSlots };
  for (const [key, value] of Object.entries(extracted)) {
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }

  // 校验必填槽位
  const missingSlots = checkMissingSlots(intent, merged);

  return { slots: merged, missingSlots };
}

export { getSlotDefinitions } from './definitions';
```

- [ ] **Step 3: 运行类型检查**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

- [ ] **Step 4: Commit**

```bash
git add src/services/slots/
git commit -m "feat: add slot management layer with AI-assisted extraction"
```

---

### Task 4: 规划引擎 — `src/services/planning/`

**Files:**
- Create: `src/services/planning/mapper.ts`
- Create: `src/services/planning/generator.ts`
- Create: `src/services/planning/index.ts`

- [ ] **Step 1: 创建简单意图映射器**

创建 `src/services/planning/mapper.ts`：

```typescript
import type { AiAction } from '@/types/ai';
import type { Intent } from '@/types/conversation';

/**
 * 将简单意图的槽位直接映射为 AiAction
 */
export function mapSingleIntent(
  intent: Intent,
  slots: Record<string, unknown>,
): AiAction[] {
  // entity_ref 类型的槽位需要转换为 id 字段
  const payload = { ...slots };
  if ('todoId' in payload) {
    payload.id = payload.todoId;
    delete payload.todoId;
  }
  if ('planId' in payload) {
    payload.id = payload.planId;
    delete payload.planId;
  }
  if ('noteId' in payload) {
    payload.id = payload.noteId;
    delete payload.noteId;
  }
  // topic → title（plan_study 场景）
  if ('topic' in payload && !('title' in payload)) {
    payload.title = payload.topic;
    delete payload.topic;
  }

  // list / complete 等查询类意图，返回空 actions（由 AI 文本回复处理）
  const noActionIntents: Intent[] = ['list_todo', 'list_plan', 'list_note', 'complete_todo'];
  if (noActionIntents.includes(intent)) {
    return [];
  }

  return [
    {
      type: intent as AiAction['type'],
      payload,
      description: describeActionFromIntent(intent, payload),
      status: 'pending' as const,
    },
  ];
}

function describeActionFromIntent(intent: Intent, payload: Record<string, unknown>): string {
  switch (intent) {
    case 'add_todo': return `创建待办: ${payload.title ?? '未命名'}`;
    case 'update_todo': return `修改待办: ${payload.id ?? payload.title ?? ''}`;
    case 'delete_todo': return `删除待办: ${payload.id ?? ''}`;
    case 'add_plan': return `创建学习计划: ${payload.title ?? '未命名'}`;
    case 'update_plan': return `修改学习计划: ${payload.id ?? ''}`;
    case 'delete_plan': return `删除学习计划: ${payload.id ?? ''}`;
    case 'add_note': return `创建笔记: ${payload.title ?? '未命名'}`;
    case 'update_note': return `修改笔记: ${payload.id ?? ''}`;
    case 'delete_note': return `删除笔记: ${payload.id ?? ''}`;
    default: return `执行: ${intent}`;
  }
}
```

- [ ] **Step 2: 创建复杂意图生成器**

创建 `src/services/planning/generator.ts`：

```typescript
import type { AiAction } from '@/types/ai';
import type { Intent, ConversationContext } from '@/types/conversation';
import type { ZhipuMessage } from '@/services/ai';
import { callApi } from '@/services/ai';
import { useTodoStore } from '@/stores/todoStore';
import { useLearningStore } from '@/stores/learningStore';
import { useNoteStore } from '@/stores/noteStore';

/** 规划提示词模板 */
const PLANNING_PROMPTS: Record<string, (slots: Record<string, unknown>, ctx: ConversationContext) => string> = {
  plan_weekly: (slots, ctx) => {
    const todos = useTodoStore.getState().todos;
    const plans = useLearningStore.getState().plans;
    return `用户想要规划本周的学习/工作。

当前数据状态：
- 待办事项：${JSON.stringify(todos.map(t => ({ title: t.title, dueDate: t.dueDate, completed: t.completed })))}
- 学习计划：${JSON.stringify(plans.map(p => ({ title: p.title })))}

用户目标：${slots.goals ?? '未指定'}
重点领域：${slots.focusArea ?? '未指定'}

请生成一个执行计划，以 JSON 数组格式输出。每个元素是一个 action 对象，格式为：
{"type": "add_todo" 或 "add_plan", "payload": {...}, "description": "操作描述"}
规则：
1. 先创建学习计划 (add_plan)，再分解为待办 (add_todo)
2. 待办要有合理的截止日期（YYYY-MM-DD 格式）
3. 只输出 JSON 数组，不要其他内容`;
  },

  plan_study: (slots, _ctx) => {
    return `用户想要制定学习计划。

学习主题：${slots.topic ?? slots.title ?? '未指定'}
预计时间：${slots.duration ?? '未指定'}

请生成学习计划，以 JSON 数组格式输出。每个元素是一个 action 对象，格式为：
{"type": "add_plan", "payload": {"title": "...", "description": "...", "tasks": [...]}, "description": "操作描述"}
或
{"type": "add_todo", "payload": {"title": "...", "dueDate": "..."}, "description": "操作描述"}
规则：
1. 先创建学习计划 (add_plan)，将目标拆解为3-8个递进任务
2. 再创建关键的待办节点 (add_todo)
3. 只输出 JSON 数组`;
  },

  plan_schedule: (slots, _ctx) => {
    const todos = useTodoStore.getState().todos;
    return `用户想要安排日程。

日期：${slots.date ?? '今天'}
当前待办：${JSON.stringify(todos.map(t => ({ title: t.title, dueDate: t.dueDate, completed: t.completed })))}

请安排日程，以 JSON 数组格式输出 action 对象。主要是 add_todo 类型的操作。
只输出 JSON 数组。`;
  },

  suggest_todos: (_slots, _ctx) => {
    const todos = useTodoStore.getState().todos;
    const plans = useLearningStore.getState().plans;
    return `分析用户数据，提出建议。

当前待办：${JSON.stringify(todos.map(t => ({ title: t.title, priority: t.priority, dueDate: t.dueDate, completed: t.completed })))}
当前计划：${JSON.stringify(plans.map(p => ({ title: p.title })))}

请根据用户现有数据提出合理的待办建议。以 JSON 数组格式输出 add_todo 类型的 action。
只输出 JSON 数组。`;
  },

  analyze_progress: (_slots, _ctx) => {
    const todos = useTodoStore.getState().todos;
    const plans = useLearningStore.getState().plans;
    const notes = useNoteStore.getState().notes;
    return `分析用户进度。

数据概览：
- 待办：${todos.length} 条，${todos.filter(t => t.completed).length} 已完成
- 计划：${plans.length} 个
- 笔记：${notes.length} 条

请分析并给出建议。以 JSON 数组格式输出 action（如建议添加的待办）。
如果不需要添加任何操作，输出空数组 []。`;
  },
};

/**
 * 使用 AI 生成复杂意图的执行计划
 */
export async function generateComplexPlan(
  intent: Intent,
  slots: Record<string, unknown>,
  context: ConversationContext,
): Promise<AiAction[]> {
  const promptBuilder = PLANNING_PROMPTS[intent];
  if (!promptBuilder) return [];

  const prompt = promptBuilder(slots, context);

  const messages: ZhipuMessage[] = [
    { role: 'system', content: prompt },
    { role: 'user', content: '请生成计划' },
  ];

  const response = await callApi(messages);
  const text = (response.content ?? '').trim();

  try {
    // 提取 JSON 数组
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]!) as Array<{
        type: string;
        payload: Record<string, unknown>;
        description?: string;
      }>;

      return parsed.map((item) => ({
        type: item.type as AiAction['type'],
        payload: item.payload,
        description: item.description ?? `${item.type}: ${JSON.stringify(item.payload)}`,
        status: 'pending' as const,
      }));
    }
  } catch {
    // JSON 解析失败
  }
  return [];
}
```

- [ ] **Step 3: 创建规划引擎入口**

创建 `src/services/planning/index.ts`：

```typescript
import type { AiAction } from '@/types/ai';
import type { Intent, ConversationContext } from '@/types/conversation';
import { isComplexIntent } from '@/services/intent';
import { mapSingleIntent } from './mapper';
import { generateComplexPlan } from './generator';

/**
 * 规划引擎入口：根据意图类型选择映射或生成
 */
export async function planActions(
  intent: Intent,
  slots: Record<string, unknown>,
  context: ConversationContext,
): Promise<AiAction[]> {
  if (intent === 'chat' || intent === 'unknown') {
    return [];
  }

  if (isComplexIntent(intent)) {
    return generateComplexPlan(intent, slots, context);
  }

  return mapSingleIntent(intent, slots);
}

export { isComplexIntent } from '@/services/intent';
```

- [ ] **Step 4: 运行类型检查**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

- [ ] **Step 5: Commit**

```bash
git add src/services/planning/
git commit -m "feat: add planning engine with simple mapping and complex AI generation"
```

---

### Task 5: 对话状态管理 — 扩展 `chatStore`

**Files:**
- Modify: `src/stores/chatStore.ts`

- [ ] **Step 1: 扩展 chatStore，添加对话状态**

将 `src/stores/chatStore.ts` 整体替换为：

```typescript
import { create } from 'zustand';
import type { ChatMessage, AiAction } from '@/types/ai';
import type { ConversationState, Intent, ConversationPhase } from '@/types/conversation';
import { createInitialConversationState } from '@/types/conversation';
import { db } from '@/services/db';
import { sendMessage, sendToolResult, executeAction } from '@/services/ai';
import type { ZhipuMessage, ZhipuToolCall } from '@/services/ai';
import { recognizeIntent, isComplexIntent } from '@/services/intent';
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

    // 增加对话轮次
    const updatedContext = {
      ...conversationState.context,
      conversationTurn: conversationState.context.conversationTurn + 1,
    };

    // ---- 阶段 1: 如果正在 slot_filling，用户回答追问 ----
    if (conversationState.phase === 'slot_filling' && conversationState.currentIntent) {
      // 保存用户消息
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
        // 用新输入补充槽位
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
          // 槽位仍不完整，继续追问
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

        // 槽位完整 → 进入规划
        newState.phase = 'planning';
        set({ conversationState: newState });

        const actions = await planActions(
          conversationState.currentIntent,
          slots,
          updatedContext,
        );

        if (actions.length === 0) {
          // 无操作意图（如 list、chat），走原有 AI 对话
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

        // 有 actions → 展示给用户确认
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
          conversationState: { ...conversationState, phase: 'idle', context: updatedContext },
          loading: false,
        }));
      }
      return;
    }

    // ---- 阶段 2: 正常流程（idle） ----
    // 保存用户消息
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
      // 意图识别
      const intent = await recognizeIntent(content, updatedContext);

      // chat / unknown → 直接走原有 AI 对话
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

      // 有明确意图 → 槽位收集
      const { slots, missingSlots } = await collectSlots(content, intent, {});

      if (missingSlots.length > 0) {
        // 槽位不完整 → 追问
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

      // 槽位完整 → 规划
      const actions = await planActions(intent, slots, updatedContext);

      if (actions.length === 0) {
        // 无操作意图，走 AI 对话
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

      // 有 actions → 展示给用户确认
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

    // 更新对话状态中的已执行列表
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

    // 更新对话状态
    set({
      conversationState: {
        ...conversationState,
        executedActions: [...conversationState.executedActions, ...executedActions],
      },
    });

    // 发送工具结果获取 AI 最终回复
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

    // 检查是否所有 action 都已完成/取消
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

/** 生成计划摘要文本 */
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
```

- [ ] **Step 2: 运行类型检查**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

- [ ] **Step 3: 修复类型错误（如有）**

根据 `tsc` 输出修复所有类型错误。常见问题：
- `AiAction.type` 不包含新增的意图 → 已在 Task 1 扩展
- `callApi` 未导出 → 已在 Task 2 导出
- `noUncheckedIndexedAccess` → 数组访问需要 `!` 或 guard

- [ ] **Step 4: Commit**

```bash
git add src/stores/chatStore.ts
git commit -m "feat: extend chatStore with conversation state management"
```

---

### Task 6: 更新 AI 服务 — 修改 `src/services/ai.ts`

**Files:**
- Modify: `src/services/ai.ts`

- [ ] **Step 1: 在 ai.ts 的 executeAction 中添加新意图的 case**

在 `src/services/ai.ts` 的 `executeAction` 函数的 switch 中，在 `default` 之前追加：

```typescript
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
        // 这些复杂意图在规划引擎中处理，不应走 executeAction
        return `复杂意图 ${action.type} 应通过规划引擎处理`;
```

- [ ] **Step 2: 在 describeAction 函数中添加新意图的描述**

在 `src/services/ai.ts` 的 `describeAction` 函数的 switch 中，在 `default` 之前追加：

```typescript
    case 'list_todo': return '列出待办事项';
    case 'complete_todo': return `完成待办: ${args.id}`;
    case 'list_plan': return '列出学习计划';
    case 'list_note': return '列出笔记';
    case 'plan_weekly': return '制定周计划';
    case 'plan_study': return '制定学习规划';
    case 'plan_schedule': return '安排日程';
    case 'suggest_todos': return '建议待办';
    case 'analyze_progress': return '分析进度';
```

- [ ] **Step 3: 运行类型检查**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

- [ ] **Step 4: Commit**

```bash
git add src/services/ai.ts
git commit -m "feat: add new intent cases to executeAction and describeAction"
```

---

### Task 7: UI 适配 — 更新 AiChatWindow

**Files:**
- Modify: `src/components/AiChat/AiChatWindow.tsx`

- [ ] **Step 1: 在 AiChatWindow 中显示对话阶段状态**

在 `src/components/AiChat/AiChatWindow.tsx` 中，从 chatStore 额外获取 `conversationState`：

将现有的 store 解构：
```typescript
const { messages, loading, loadMessages, send, clearMessages } = useChatStore();
```
改为：
```typescript
const { messages, loading, conversationState, loadMessages, send, clearMessages } = useChatStore();
```

在消息列表上方（Drawer title 下方）添加阶段指示器。找到 Drawer 的 `<Flex vertical>` 子元素，在消息列表之前添加：

```tsx
{conversationState.phase !== 'idle' && conversationState.phase !== 'completed' && (
  <div style={{ padding: '4px 12px', fontSize: 12, color: '#888', background: '#fafafa', borderRadius: 4 }}>
    {conversationState.phase === 'slot_filling' && '等待补充信息...'}
    {conversationState.phase === 'executing' && '等待确认操作...'}
    {conversationState.phase === 'planning' && '正在规划...'}
    {conversationState.phase === 'intent_recognition' && '理解中...'}
  </div>
)}
```

- [ ] **Step 2: 运行类型检查**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

- [ ] **Step 3: Commit**

```bash
git add src/components/AiChat/AiChatWindow.tsx
git commit -m "feat: show conversation phase indicator in chat window"
```

---

### Task 8: 集成验证 — 端到端测试

**Files:** 无新增

- [ ] **Step 1: 运行完整类型检查**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"`

Expected: 0 errors

- [ ] **Step 2: 运行 Vite 构建**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx vite build"`

Expected: 构建成功

- [ ] **Step 3: 启动开发服务器，手动测试关键场景**

Run: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx vite"`

测试场景：
1. **简单意图**：输入"添加待办 买牛奶" → 应直接生成 add_todo action
2. **追问流程**：输入"修改待办" → 应追问"你想修改哪个待办？"
3. **复杂意图**：输入"帮我安排这周的学习计划" → 应生成多个 actions
4. **普通聊天**：输入"你好" → 应正常聊天回复
5. **确认执行**：点击"全部执行" → actions 应依次执行

- [ ] **Step 4: 修复发现的问题**

根据测试结果修复所有问题并 commit。

- [ ] **Step 5: 最终 commit**

```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```
