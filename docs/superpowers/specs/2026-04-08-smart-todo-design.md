# 智能待办 - 技术设计文档

> 日期：2026-04-08
> 状态：待用户审核

## 1. 系统架构

```
┌─────────────────────────────────────────────┐
│                  浏览器                       │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │           React Application          │   │
│  │  ┌─────────┐ ┌─────────────────┐    │   │
│  │  │ Pages   │ │    Components   │    │   │
│  │  └────┬────┘ └───────┬─────────┘    │   │
│  │       │              │              │   │
│  │  ┌────┴──────────────┴─────┐       │   │
│  │  │      zustand Store       │       │   │
│  │  └────────────┬─────────────┘       │   │
│  │               │                     │   │
│  │  ┌────────────┴─────────────┐       │   │
│  │  │      Service Layer       │       │   │
│  │  │  ┌─────────┐ ┌────────┐  │       │   │
│  │  │  │  DB     │ │  AI    │  │       │   │
│  │  │  │(dexie)  │ │Service │  │       │   │
│  │  │  └────┬────┘ └───┬────┘  │       │   │
│  │  └───────┼──────────┼───────┘       │   │
│  └──────────┼──────────┼────────────────┘   │
│             │          │                    │
│  ┌──────────┴──┐  ┌───┴──────────────┐     │
│  │  IndexedDB  │  │  智谱 ChatGLM API │     │
│  └─────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────┘
```

## 2. 项目目录结构

```
src/
├── main.tsx                    # 应用入口
├── App.tsx                     # 根组件 + 路由配置
├── components/                 # 通用组件
│   ├── AiChat/                 # AI 对话组件
│   │   ├── AiChatWindow.tsx    # 对话窗口（浮动）
│   │   ├── ChatMessage.tsx     # 消息气泡
│   │   └── ActionPreview.tsx   # 操作预览卡片
│   ├── Widgets/                # 首页装饰小组件
│   │   ├── ClockWidget.tsx
│   │   ├── WeatherWidget.tsx
│   │   └── QuoteWidget.tsx
│   └── common/                 # 通用 UI 组件
├── pages/                      # 页面组件
│   ├── Dashboard/              # 首页/仪表盘
│   │   ├── index.tsx
│   │   ├── ProgressOverview.tsx
│   │   └── WidgetArea.tsx
│   ├── Todo/                   # 待办事项模块
│   │   ├── index.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── TodoForm.tsx
│   ├── Learning/               # 学习计划模块
│   │   ├── index.tsx
│   │   ├── PlanList.tsx
│   │   ├── PlanDetail.tsx
│   │   ├── TaskChecklist.tsx
│   │   └── CheckInCalendar.tsx
│   └── Memo/                   # 备忘录模块
│       ├── index.tsx
│       ├── MemoList.tsx
│       ├── MemoEditor.tsx
│       └── MemoDetail.tsx
├── services/                   # 服务层
│   ├── db.ts                   # IndexedDB 初始化和操作
│   ├── ai.ts                   # 智谱 API 调用
│   └── notification.ts         # 浏览器通知
├── stores/                     # zustand 状态管理
│   ├── todoStore.ts
│   ├── learningStore.ts
│   ├── memoStore.ts
│   ├── chatStore.ts
│   └── settingsStore.ts
├── types/                      # TypeScript 类型定义
│   ├── todo.ts
│   ├── learning.ts
│   ├── memo.ts
│   └── ai.ts
└── utils/                      # 工具函数
    ├── contextBuilder.ts       # AI 上下文构建
    └── formatters.ts
```

## 3. 数据模型

### 3.1 Todo（待办事项）

```typescript
interface Todo {
  id: string;           // crypto.randomUUID()
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4 | 5;  // 1=最高
  dueDate?: string;     // ISO date string
  completed: boolean;
  tags: string[];
  createdAt: string;    // ISO datetime
  updatedAt: string;
}
```

### 3.2 LearningPlan（学习计划）

```typescript
interface LearningTask {
  id: string;
  title: string;
  completed: boolean;
  resources?: string[];  // 学习资源链接
  subTasks?: LearningTask[];
}

interface LearningPlan {
  id: string;
  title: string;
  description?: string;
  tasks: LearningTask[];
  checkInDates: string[];  // 打卡日期数组
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Memo（备忘录）

```typescript
interface Memo {
  id: string;
  title: string;
  content: string;       // Markdown 格式
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 ChatMessage（AI 对话消息）

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions?: AiAction[];  // AI 返回的操作指令
  timestamp: string;
}

interface AiAction {
  type: 'add_todo' | 'update_todo' | 'delete_todo'
       | 'add_plan' | 'update_plan' | 'delete_plan'
       | 'add_memo' | 'update_memo' | 'delete_memo';
  payload: Record<string, any>;
  description: string;  // 人类可读的操作描述
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
}
```

## 4. AI 服务设计

### 4.1 上下文构建

```typescript
// contextBuilder.ts
function buildSystemContext(): string {
  const todos = await db.todos.toArray();
  const plans = await db.learningPlans.toArray();
  const memos = await db.memos.toArray();

  return `你是一个智能待办助手。当前用户数据状态如下：

【待办事项】(${todos.length}条)
${todos.map(t => `- [${t.completed ? '✓' : '○'}] ${t.title} | 优先级:${t.priority} | 截止:${t.dueDate || '无'}`).join('\n')}

【学习计划】(${plans.length}个)
${plans.map(p => `- ${p.title}: ${p.tasks.filter(t => t.completed).length}/${p.tasks.length} 已完成`).join('\n')}

【备忘录】(${memos.length}条)
${memos.map(m => `- ${m.title}: ${m.content.slice(0, 50)}...`).join('\n')}

你可以直接创建、修改、删除待办事项、学习计划和备忘录。使用工具函数执行操作。`;
}
```

### 4.2 Function Calling 定义

向智谱 API 注册以下工具函数：

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'add_todo',
      description: '创建新的待办事项',
      parameters: {
        title: { type: 'string', description: '待办标题' },
        description: { type: 'string', description: '详细描述' },
        priority: { type: 'number', description: '优先级1-5' },
        dueDate: { type: 'string', description: '截止日期 YYYY-MM-DD' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签' }
      }
    }
  },
  // ... 其余 8 个操作类似定义
];
```

### 4.3 操作执行流程

```
用户发送消息
    ↓
构建 system prompt（含上下文）
    ↓
调用智谱 API（messages + tools）
    ↓
解析响应
    ├─ 纯文本 → 直接展示
    └─ tool_calls → 展示 ActionPreview 卡片
                        ↓
                   用户确认
                        ↓
                   执行数据库操作
                        ↓
                   更新 zustand store → UI 刷新
                        ↓
                   反馈执行结果到对话
```

## 5. 组件设计要点

### 5.1 AI 对话窗口

- 位置：右下角浮动，固定定位
- 默认状态：折叠为圆形按钮（显示 AI 图标）
- 展开状态：400x500px 对话窗口
- 支持拖拽调整位置
- 消息列表自动滚动到底部
- ActionPreview 卡片内联在消息流中

### 5.2 Dashboard 进度展示

- 使用 Ant Design Card + Progress 组件
- 备忘录区：列表展示最近 5 条，点击可快速编辑
- 待办区：统计卡片（总数/已完成/逾期）+ 今日待办列表
- 学习计划区：各计划进度条 + 打卡热力图（近30天）

### 5.3 装饰小组件

- 时钟：数字时钟 + 日期显示
- 天气：调用免费 API（wttr.in），展示当前天气
- 名言：内置 100+ 条名言数组，每日随机轮播

## 6. 关键技术决策

| 决策 | 选择 | 理由 |
|---|---|---|
| IndexedDB vs localStorage | IndexedDB (dexie.js) | 支持结构化查询、容量更大、异步操作不阻塞 UI |
| zustand vs Redux | zustand | API 更简洁、样板代码更少、适合个人项目 |
| Vite vs CRA | Vite | 启动快、HMR 快、构建快 |
| Function Calling | 智谱 tool_calls | 让 AI 可以执行结构化操作，而非仅返回文本 |
