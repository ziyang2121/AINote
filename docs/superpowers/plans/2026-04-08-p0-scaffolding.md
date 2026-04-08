# P0 - 项目脚手架与基础架构 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建项目基础骨架，配置工具链，确保四个路由可切换、Ant Design Pro Layout 正确渲染。

**Architecture:** Vite + React 18 + TypeScript SPA 应用。使用 React Router v6 管理路由，Ant Design Pro Layout 提供侧边栏布局，zustand 管理状态，dexie.js 操作 IndexedDB 存储数据。

**Tech Stack:** React 18, TypeScript, Vite, Ant Design 5, @ant-design/pro-layout, React Router v6, zustand, dexie, dayjs

---

## 文件结构

```
智能待办/
├── index.html                         # Vite 入口 HTML
├── package.json                       # 依赖管理
├── vite.config.ts                     # Vite 配置
├── tsconfig.json                      # TypeScript 配置
├── tsconfig.node.json                 # TypeScript Node 配置 (Vite 用)
├── src/
│   ├── main.tsx                       # React 入口
│   ├── App.tsx                        # 根组件 + 路由
│   ├── vite-env.d.ts                  # Vite 类型声明
│   ├── layouts/
│   │   └── MainLayout.tsx             # Ant Design Pro Layout
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   └── index.tsx              # 首页占位
│   │   ├── Todo/
│   │   │   └── index.tsx              # 待办占位
│   │   ├── Learning/
│   │   │   └── index.tsx              # 学习计划占位
│   │   └── Memo/
│   │       └── index.tsx              # 备忘录占位
│   ├── types/
│   │   ├── todo.ts                    # Todo 类型定义
│   │   ├── learning.ts               # LearningPlan 类型定义
│   │   ├── memo.ts                    # Memo 类型定义
│   │   ├── ai.ts                      # AI 相关类型定义
│   │   └── index.ts                   # 类型统一导出
│   ├── services/
│   │   └── db.ts                      # IndexedDB 初始化 (dexie)
│   └── stores/
│       ├── todoStore.ts              # Todo 状态 (基础骨架)
│       ├── learningStore.ts          # Learning 状态 (基础骨架)
│       ├── memoStore.ts              # Memo 状态 (基础骨架)
│       └── settingsStore.ts          # 设置状态
```

---

### Task 1: 项目初始化与依赖安装

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "smart-todo",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "^5.6.1",
    "@ant-design/pro-layout": "^7.21.3",
    "antd": "^5.24.6",
    "dayjs": "^1.11.13",
    "dexie": "^4.0.11",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.2",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.6.2",
    "vite": "^6.2.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
});
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>智能待办</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 7: 安装依赖**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npm install`
Expected: 依赖安装成功，生成 node_modules

- [ ] **Step 8: 验证 Vite 可启动**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b && npx vite build`
Expected: 构建成功（可能因为缺少 main.tsx 报错，这是预期的，下一步会创建）

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `src/types/todo.ts`
- Create: `src/types/learning.ts`
- Create: `src/types/memo.ts`
- Create: `src/types/ai.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建 src/types/todo.ts**

```typescript
export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4 | 5;
  dueDate: string | null;
  completed: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TodoCreateInput = Omit<Todo, 'id' | 'completed' | 'createdAt' | 'updatedAt'>;
export type TodoUpdateInput = Partial<Omit<Todo, 'id' | 'createdAt'>>;
```

- [ ] **Step 2: 创建 src/types/learning.ts**

```typescript
export interface LearningTask {
  id: string;
  title: string;
  completed: boolean;
  resources: string[];
  subTasks: LearningTask[];
}

export interface LearningPlan {
  id: string;
  title: string;
  description: string;
  tasks: LearningTask[];
  checkInDates: string[];
  createdAt: string;
  updatedAt: string;
}

export type LearningPlanCreateInput = Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>;
export type LearningPlanUpdateInput = Partial<Omit<LearningPlan, 'id' | 'createdAt'>>;
```

- [ ] **Step 3: 创建 src/types/memo.ts**

```typescript
export interface Memo {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type MemoCreateInput = Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>;
export type MemoUpdateInput = Partial<Omit<Memo, 'id' | 'createdAt'>>;
```

- [ ] **Step 4: 创建 src/types/ai.ts**

```typescript
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
       | 'add_memo' | 'update_memo' | 'delete_memo';
  payload: Record<string, unknown>;
  description: string;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
}

export interface AiSettings {
  apiKey: string;
  model: string;
}
```

- [ ] **Step 5: 创建 src/types/index.ts**

```typescript
export type { Todo, TodoCreateInput, TodoUpdateInput } from './todo';
export type { LearningTask, LearningPlan, LearningPlanCreateInput, LearningPlanUpdateInput } from './learning';
export type { Memo, MemoCreateInput, MemoUpdateInput } from './memo';
export type { ChatMessage, AiAction, AiSettings } from './ai';
```

- [ ] **Step 6: 验证类型定义无语法错误**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc --noEmit src/types/index.ts`
Expected: 无报错

---

### Task 3: IndexedDB 数据库初始化

**Files:**
- Create: `src/services/db.ts`

- [ ] **Step 1: 创建 src/services/db.ts**

```typescript
import Dexie, { type Table } from 'dexie';
import type { Todo } from '@/types/todo';
import type { LearningPlan } from '@/types/learning';
import type { Memo } from '@/types/memo';
import type { ChatMessage } from '@/types/ai';

class SmartTodoDB extends Dexie {
  todos!: Table<Todo, string>;
  learningPlans!: Table<LearningPlan, string>;
  memos!: Table<Memo, string>;
  chatMessages!: Table<ChatMessage, string>;

  constructor() {
    super('SmartTodoDB');
    this.version(1).stores({
      todos: 'id, priority, dueDate, completed, *tags, createdAt',
      learningPlans: 'id, createdAt',
      memos: 'id, *tags, createdAt, updatedAt',
      chatMessages: 'id, role, timestamp',
    });
  }
}

export const db = new SmartTodoDB();
```

- [ ] **Step 2: 验证 db.ts 无语法错误**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc --noEmit src/services/db.ts`
Expected: 无报错

---

### Task 4: zustand Store 基础骨架

**Files:**
- Create: `src/stores/todoStore.ts`
- Create: `src/stores/learningStore.ts`
- Create: `src/stores/memoStore.ts`
- Create: `src/stores/settingsStore.ts`

- [ ] **Step 1: 创建 src/stores/todoStore.ts**

```typescript
import { create } from 'zustand';
import type { Todo } from '@/types/todo';
import { db } from '@/services/db';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  loadTodos: () => Promise<void>;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,

  loadTodos: async () => {
    set({ loading: true });
    const todos = await db.todos.orderBy('createdAt').reverse().toArray();
    set({ todos, loading: false });
  },

  addTodo: async (todo) => {
    const now = new Date().toISOString();
    const newTodo: Todo = {
      ...todo,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.todos.add(newTodo);
    set((state) => ({ todos: [newTodo, ...state.todos] }));
  },

  updateTodo: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    await db.todos.update(id, updatedData);
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...updatedData } : t)),
    }));
  },

  deleteTodo: async (id) => {
    await db.todos.delete(id);
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }));
  },
}));
```

- [ ] **Step 2: 创建 src/stores/learningStore.ts**

```typescript
import { create } from 'zustand';
import type { LearningPlan } from '@/types/learning';
import { db } from '@/services/db';

interface LearningState {
  plans: LearningPlan[];
  loading: boolean;
  loadPlans: () => Promise<void>;
  addPlan: (plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlan: (id: string, updates: Partial<LearningPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

export const useLearningStore = create<LearningState>((set) => ({
  plans: [],
  loading: false,

  loadPlans: async () => {
    set({ loading: true });
    const plans = await db.learningPlans.orderBy('createdAt').reverse().toArray();
    set({ plans, loading: false });
  },

  addPlan: async (plan) => {
    const now = new Date().toISOString();
    const newPlan: LearningPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.learningPlans.add(newPlan);
    set((state) => ({ plans: [newPlan, ...state.plans] }));
  },

  updatePlan: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    await db.learningPlans.update(id, updatedData);
    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? { ...p, ...updatedData } : p)),
    }));
  },

  deletePlan: async (id) => {
    await db.learningPlans.delete(id);
    set((state) => ({ plans: state.plans.filter((p) => p.id !== id) }));
  },
}));
```

- [ ] **Step 3: 创建 src/stores/memoStore.ts**

```typescript
import { create } from 'zustand';
import type { Memo } from '@/types/memo';
import { db } from '@/services/db';

interface MemoState {
  memos: Memo[];
  loading: boolean;
  loadMemos: () => Promise<void>;
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMemo: (id: string, updates: Partial<Memo>) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
}

export const useMemoStore = create<MemoState>((set) => ({
  memos: [],
  loading: false,

  loadMemos: async () => {
    set({ loading: true });
    const memos = await db.memos.orderBy('updatedAt').reverse().toArray();
    set({ memos, loading: false });
  },

  addMemo: async (memo) => {
    const now = new Date().toISOString();
    const newMemo: Memo = {
      ...memo,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.memos.add(newMemo);
    set((state) => ({ memos: [newMemo, ...state.memos] }));
  },

  updateMemo: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };
    await db.memos.update(id, updatedData);
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? { ...m, ...updatedData } : m)),
    }));
  },

  deleteMemo: async (id) => {
    await db.memos.delete(id);
    set((state) => ({ memos: state.memos.filter((m) => m.id !== id) }));
  },
}));
```

- [ ] **Step 4: 创建 src/stores/settingsStore.ts**

```typescript
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
```

- [ ] **Step 5: 验证所有 store 无语法错误**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc --noEmit`
Expected: 无报错

---

### Task 5: 页面占位组件

**Files:**
- Create: `src/pages/Dashboard/index.tsx`
- Create: `src/pages/Todo/index.tsx`
- Create: `src/pages/Learning/index.tsx`
- Create: `src/pages/Memo/index.tsx`

- [ ] **Step 1: 创建 src/pages/Dashboard/index.tsx**

```tsx
import { Typography } from 'antd';

const { Title } = Typography;

export default function Dashboard() {
  return (
    <div>
      <Title level={3}>首页</Title>
      <p>进度展示区域 — 待实现</p>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/pages/Todo/index.tsx**

```tsx
import { Typography } from 'antd';

const { Title } = Typography;

export default function TodoPage() {
  return (
    <div>
      <Title level={3}>待办事项</Title>
      <p>待办事项管理 — 待实现</p>
    </div>
  );
}
```

- [ ] **Step 3: 创建 src/pages/Learning/index.tsx**

```tsx
import { Typography } from 'antd';

const { Title } = Typography;

export default function LearningPage() {
  return (
    <div>
      <Title level={3}>学习计划</Title>
      <p>学习计划管理 — 待实现</p>
    </div>
  );
}
```

- [ ] **Step 4: 创建 src/pages/Memo/index.tsx**

```tsx
import { Typography } from 'antd';

const { Title } = Typography;

export default function MemoPage() {
  return (
    <div>
      <Title level={3}>备忘录</Title>
      <p>备忘录管理 — 待实现</p>
    </div>
  );
}
```

---

### Task 6: 主布局与路由配置

**Files:**
- Create: `src/layouts/MainLayout.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: 创建 src/layouts/MainLayout.tsx**

```tsx
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-layout';
import {
  CheckSquareOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
} from '@ant-design/icons';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ProLayout
      title="智能待办"
      logo={null}
      collapsed={collapsed}
      onCollapse={setCollapsed}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => (
        <span onClick={() => navigate(item.path || '/')}>{dom}</span>
      )}
      menu={{
        request: async () => [
          {
            path: '/',
            name: '首页',
            icon: <HomeOutlined />,
          },
          {
            path: '/todo',
            name: '待办事项',
            icon: <CheckSquareOutlined />,
          },
          {
            path: '/learning',
            name: '学习计划',
            icon: <BookOutlined />,
          },
          {
            path: '/memo',
            name: '备忘录',
            icon: <FileTextOutlined />,
          },
        ],
      }}
    >
      <Outlet />
    </ProLayout>
  );
}
```

- [ ] **Step 2: 创建 src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import TodoPage from '@/pages/Todo';
import LearningPage from '@/pages/Learning';
import MemoPage from '@/pages/Memo';

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/todo" element={<TodoPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/memo" element={<MemoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
```

- [ ] **Step 3: 创建 src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### Task 7: 构建验证

- [ ] **Step 1: TypeScript 编译检查**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b`
Expected: 无报错

- [ ] **Step 2: Vite 构建检查**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npx vite build`
Expected: 构建成功，生成 dist/ 目录

- [ ] **Step 3: 启动开发服务器验证**

Run: `cd c:\Users\ziy\Desktop\newproj\智能待办 && npx vite`
Expected:
- 浏览器自动打开 http://localhost:3000
- 显示 Ant Design Pro Layout 侧边栏
- 侧边栏有 4 个菜单项（首页、待办事项、学习计划、备忘录）
- 点击菜单项可切换页面，URL 对应变化
- 各页面显示对应的占位标题

- [ ] **Step 4: 停止开发服务器，完成 P0**

Run: 在终端按 Ctrl+C 停止
