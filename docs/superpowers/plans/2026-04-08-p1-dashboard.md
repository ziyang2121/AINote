# P1 - 首页 Dashboard 实现计划

**Goal:** 完成首页四大区域的 UI 实现：装饰小组件（时钟/天气/名言）、进度展示、AI 对话浮动窗口。

**Architecture:** 首页 Dashboard 页面包含顶部小组件区、中央进度概览区、右下角 AI 对话浮动窗口。小组件为独立组件，通过 useEffect 管理生命周期。进度数据暂从 zustand store 读取（P2-P4 完善后自然接入真实数据）。

---

### Task 1: 时钟小组件

- [ ] **创建 src/components/Widgets/ClockWidget.tsx** — 实时数字时钟 + 日期显示，每秒更新

### Task 2: 名言轮播组件

- [ ] **创建 src/components/Widgets/QuoteWidget.tsx** — 内置名言数组，每 30 秒切换，带淡入动画

### Task 3: 天气小组件

- [ ] **创建 src/components/Widgets/WeatherWidget.tsx** — 调用 wttr.in API 获取天气，展示温度和图标

### Task 4: AI 对话浮动窗口（骨架）

- [ ] **创建 src/components/AiChat/AiChatWindow.tsx** — 浮动按钮 + 可展开对话窗口容器

### Task 5: 进度概览组件

- [ ] **创建 src/pages/Dashboard/ProgressOverview.tsx** — 三个模块进度卡片

### Task 6: 更新 Dashboard 首页

- [ ] **更新 src/pages/Dashboard/index.tsx** — 组装小组件区 + 进度概览 + AI 对话窗口
