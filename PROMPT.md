# PROMPT.md - v2 Smart Todo Build Loop

You are working on the v2 iteration of a Smart Todo app (React 18 + TypeScript + Vite + Ant Design + Zustand + Dexie.js).

## Context
- Project root: `c:\Users\ziy\Desktop\newproj\智能待办`
- Spec: `docs/superpowers/specs/v2-smart-todo-design.md`
- Plan: `IMPLEMENTATION_PLAN.md`
- Current working directory: project root

## Rules
1. Read `IMPLEMENTATION_PLAN.md` and pick the first uncompleted task.
2. Read the relevant source files before making any changes.
3. Implement the task.
4. After implementation, run backpressure commands from AGENTS.md.
5. Update `IMPLEMENTATION_PLAN.md` — mark task as done with `[x]`, add notes if needed.
6. Commit with clear message: `feat(v2): <task description>`
7. Move to next task.

## Key Architecture Notes
- Dexie.js uses loose `LearningPlanRow` interface (tasks: unknown[]) to avoid recursive type issue — maintain this pattern
- TypeScript strict mode with `noUncheckedIndexedAccess: true` — handle possibly-undefined array elements
- Path alias: `@/` → `src/` (tsconfig paths + vite resolve.alias)
- Build: `cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b && npx vite build"`
