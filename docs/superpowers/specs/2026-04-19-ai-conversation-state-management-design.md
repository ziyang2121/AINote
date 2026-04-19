# AI 助手多轮状态管理与规划模块设计

## 背景

当前 AI 助手仅进行简单的 API 调用，缺少：
- 多轮对话状态管理
- 意图识别与槽位填充机制
- 规划能力（任务分解、多步骤执行）
- 主动建议能力

## 目标

设计并实现：
1. 意图槽位模式的状态管理
2. 规划模块与现有工具调用集成
3. 保留现有人机确认机制

## 架构概览

```
用户输入 → IntentLayer → SlotManager → PlanEngine → ActionExecutor
              │              │              │              │
         规则/AI识别     槽位收集      简单/复杂规划    现有确认机制
```

## 核心模块

### 1. 意图识别层 (IntentLayer)

**位置**: `src/services/intent/`

**职责**: 识别用户输入的意图

**策略**: 规则优先，AI fallback

```typescript
// 意图类型定义
type Intent = 
  // 待办相关
  | 'add_todo' | 'update_todo' | 'delete_todo' | 'list_todo' | 'complete_todo'
  // 计划相关  
  | 'add_plan' | 'update_plan' | 'delete_plan' | 'list_plan'
  // 笔记相关
  | 'add_note' | 'update_note' | 'delete_note' | 'list_note'
  // 规划意图（新增）
  | 'plan_weekly'      // 周计划
  | 'plan_study'       // 学习规划
  | 'plan_schedule'    // 日程安排
  // 主动建议（新增）
  | 'suggest_todos'    // 建议待办
  | 'analyze_progress' // 分析进度
  // 通用
  | 'chat' | 'unknown';
```

**规则匹配器** (`rules.ts`):
```typescript
const INTENT_RULES: IntentRule[] = [
  {
    intent: 'add_todo',
    patterns: [/添加.*待办/, /新建.*任务/, /创建.*todo/i],
    keywords: ['添加', '新建', '创建', '待办', '任务'],
  },
  {
    intent: 'plan_weekly',
    patterns: [/安排.*周/, /本周.*计划/, /周计划/],
    keywords: ['安排', '周', '计划', '规划'],
  },
  // ...
];

function matchIntent(input: string): Intent | null {
  // 1. 正则匹配
  // 2. 关键词匹配
  // 3. 返回匹配度最高的意图或 null
}
```

**AI 意图识别** (`aiRecognizer.ts`):
```typescript
async function recognizeIntentWithAI(input: string, context: Context): Promise<Intent> {
  const prompt = `分析用户意图，从以下选项中选择最匹配的一个：
意图列表：add_todo, update_todo, delete_todo, add_plan, plan_weekly, suggest_todos, chat...
用户输入：${input}
当前上下文：${JSON.stringify(context)}
只输出意图名称，不要其他内容。`;
  
  const response = await callAI(prompt);
  return parseIntent(response);
}
```

### 2. 槽位管理层 (SlotManager)

**位置**: `src/services/slots/`

**职责**: 收集执行意图所需的参数

**槽位定义** (`definitions.ts`):
```typescript
interface SlotDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'entity_ref' | 'array';
  required: boolean;
  extractPrompt?: string;  // AI 提取提示
  askPrompt?: string;      // 追问提示
}

const INTENT_SLOTS: Record<Intent, SlotDefinition[]> = {
  add_todo: [
    { name: 'title', type: 'string', required: true, askPrompt: '请告诉我待办的标题' },
    { name: 'dueDate', type: 'date', required: false, askPrompt: '这个待办的截止日期是？' },
    { name: 'priority', type: 'string', required: false },
    { name: 'tags', type: 'array', required: false },
  ],
  update_todo: [
    { name: 'todoId', type: 'entity_ref', required: true, askPrompt: '你想修改哪个待办？' },
    { name: 'title', type: 'string', required: false },
    { name: 'dueDate', type: 'date', required: false },
  ],
  plan_weekly: [
    { name: 'weekStart', type: 'date', required: false },
    { name: 'goals', type: 'array', required: false, askPrompt: '这周你有什么主要目标？' },
    { name: 'focusArea', type: 'string', required: false, askPrompt: '这周的重点领域是什么？' },
  ],
  // ...其他意图
};
```

**槽位提取** (`extractor.ts`):
```typescript
async function extractSlots(
  input: string, 
  intent: Intent, 
  definitions: SlotDefinition[]
): Promise<Record<string, unknown>> {
  const prompt = `从用户输入中提取以下信息：
需要的字段：${definitions.map(d => `${d.name}(${d.type})`).join(', ')}
用户输入：${input}
以 JSON 格式输出提取结果，未找到的字段设为 null。`;
  
  const response = await callAI(prompt);
  return JSON.parse(response);
}
```

**槽位收集流程**:
1. 从用户输入提取已知槽位（AI 辅助）
2. 检查必填槽位是否完整
3. 不完整 → 生成追问消息
4. 用户回答 → 填充槽位 → 循环检查

### 3. 规划引擎 (PlanEngine)

**位置**: `src/services/planning/`

**职责**: 根据意图和槽位生成执行计划

**意图分类**:
- **简单意图**: 单一工具调用，如 `add_todo`
- **复杂意图**: 多步骤规划，如 `plan_weekly`

```typescript
const COMPLEX_INTENTS = ['plan_weekly', 'plan_study', 'plan_schedule', 'suggest_todos', 'analyze_progress'];
```

**简单意图映射** (`mapper.ts`):
```typescript
function mapSingleIntent(intent: Intent, slots: Record<string, unknown>): Action[] {
  const mappers: Record<string, (s: Record<string, unknown>) => Action[]> = {
    add_todo: (s) => [{ type: 'add_todo', payload: s }],
    update_todo: (s) => [{ type: 'update_todo', payload: s }],
    delete_todo: (s) => [{ type: 'delete_todo', payload: s }],
    // ...
  };
  return mappers[intent]?.(slots) ?? [];
}
```

**复杂意图生成** (`generator.ts`):
```typescript
async function generateComplexPlan(
  intent: Intent, 
  slots: Record<string, unknown>, 
  context: Context
): Promise<Action[]> {
  const prompts = {
    plan_weekly: `用户想要规划本周的学习/工作。
当前数据状态：${JSON.stringify(context.userData)}
用户目标：${slots.goals || '未指定'}
重点领域：${slots.focusArea || '未指定'}
请生成执行计划，可能包含：
1. 创建学习计划 (add_plan)
2. 分解为多个待办 (add_todo)
以 JSON 数组格式输出，每个元素是一个 action 对象。`,
    
    suggest_todos: `分析用户数据，提出建议。
当前待办：${JSON.stringify(context.todos)}
当前计划：${JSON.stringify(context.plans)}
请分析并提出合理的待办建议。
以 JSON 数组格式输出建议的 action。`,
    // ...
  };
  
  const response = await callAI(prompts[intent]);
  return parseActions(response);
}
```

### 4. 对话状态管理

**位置**: `src/stores/chatStore.ts` 扩展

**状态定义**:
```typescript
interface ConversationState {
  currentIntent: Intent | null;
  slots: Record<string, unknown>;
  missingSlots: string[];
  phase: 'idle' | 'intent_recognition' | 'slot_filling' | 'planning' | 'executing' | 'completed';
  currentPlan: Plan | null;
  executedActions: Action[];
  context: {
    mentionedEntities: Map<string, string>;
    lastTopic: string;
    conversationTurn: number;
  };
}

interface Plan {
  id: string;
  intent: Intent;
  actions: PlannedAction[];
  currentStep: number;
}

interface PlannedAction {
  action: AiAction;
  dependencies: string[];
  status: 'pending' | 'ready' | 'executing' | 'completed' | 'failed';
}
```

**状态转换**:
```
idle → intent_recognition → slot_filling → planning → executing → completed
          ↑                      │                        │
          └──────────────────────┴────────────────────────┘
                          (失败/追问时回退)
```

### 5. 执行层集成

**复用现有机制**:
- Actions 设置为 `pending` 状态
- 用户通过 UI 确认执行
- 调用现有 `executeAction()` 函数
- 执行结果反馈到对话状态

**新增逻辑** (`src/services/ai.ts` 修改):
```typescript
async function sendMessage(userMessage: string): Promise<AiResponse> {
  const state = useChatStore.getState().conversationState;
  
  // 1. 意图识别
  const intent = await recognizeIntent(userMessage, state.context);
  useChatStore.getState().setIntent(intent);
  
  // 2. 槽位提取
  const slots = await extractSlots(userMessage, intent);
  useChatStore.getState().setSlots(slots);
  
  // 3. 检查槽位完整性
  const missingSlots = checkMissingSlots(intent, slots);
  if (missingSlots.length > 0) {
    return generateAskResponse(intent, missingSlots);
  }
  
  // 4. 生成计划
  const actions = isComplexIntent(intent) 
    ? await generateComplexPlan(intent, slots, state.context)
    : mapSingleIntent(intent, slots);
  
  // 5. 返回待确认的 Actions
  return {
    content: generatePlanSummary(actions),
    actions: actions.map(a => ({ ...a, status: 'pending' })),
  };
}
```

## 文件结构

```
src/
├── services/
│   ├── ai.ts              # 修改：集成意图识别和规划流程
│   ├── intent/            # 新增
│   │   ├── index.ts       # 意图识别入口
│   │   ├── rules.ts       # 规则匹配器
│   │   ├── aiRecognizer.ts # AI 意图识别 fallback
│   │   └── definitions.ts  # 意图定义
│   ├── slots/             # 新增
│   │   ├── index.ts       # 槽位管理入口
│   │   ├── extractor.ts   # 槽位提取（AI 辅助）
│   │   └── definitions.ts # 槽位定义
│   └── planning/          # 新增
│       ├── index.ts       # 规划引擎入口
│       ├── mapper.ts      # 简单意图映射
│       └── generator.ts   # 复杂意图生成
├── stores/
│   └── chatStore.ts       # 修改：新增 conversationState
└── types/
    ├── ai.ts              # 修改：新增类型
    └── conversation.ts    # 新增：对话状态类型
```

## 对现有代码的修改

| 文件 | 修改内容 |
|------|----------|
| `src/services/ai.ts` | 重构 `sendMessage`，集成意图识别和规划流程 |
| `src/stores/chatStore.ts` | 新增 `conversationState` 状态和相关方法 |
| `src/types/ai.ts` | 新增 `Intent`, `Plan`, `ConversationState` 等类型 |
| `src/components/AiChat/AiChatWindow.tsx` | 可能需要适配新的状态流程 |

## 示例对话流程

**用户**: "帮我安排这周的学习计划，重点是英语"

1. **IntentLayer**: `plan_weekly` (规则匹配成功)
2. **SlotManager**: 提取 `{ focusArea: "英语" }`，槽位完整
3. **PlanEngine**: AI 生成计划
   ```json
   [
     { "type": "add_plan", "payload": { "title": "本周英语学习计划" } },
     { "type": "add_todo", "payload": { "title": "背单词", "dueDate": "周一" } },
     { "type": "add_todo", "payload": { "title": "听力练习", "dueDate": "周三" } }
   ]
   ```
4. **ActionExecutor**: 3 个 Actions 显示为 pending，等待用户确认

**用户**: 点击"全部执行" → 依次执行 → 显示结果

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| AI 意图识别不准确 | 规则优先，AI 作为 fallback；添加置信度阈值 |
| 槽位提取失败 | 多轮追问机制，用户可手动补充 |
| 规划生成不合理 | 用户可预览和修改 Actions |
| 复杂意图 API 调用过多 | 缓存机制，合并相似请求 |

## 实现优先级

1. **P0**: 意图识别层（规则匹配）
2. **P0**: 槽位定义与提取
3. **P0**: 简单意图映射
4. **P1**: 复杂意图规划（AI 生成）
5. **P1**: 对话状态管理
6. **P2**: 主动建议功能
7. **P2**: 上下文追踪优化