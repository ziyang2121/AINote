# v2 Smart Todo - Design Spec

## Overview

v2 targets two major areas: **AI core architecture overhaul** and **module fixes/enhancements**.

## Topic 1: AI Architecture Overhaul

### Problem
1. AI cannot distinguish between creating todos vs learning plans (vague system prompt)
2. AI does not proactively break learning plans into steps (tasks param not required, weak description)
3. AI never receives tool execution results (no feedback loop)
4. Tool call history is lost across conversation turns (only text preserved)
5. `temperature: 0.7` is too high for structured tool calling
6. `tool_choice: 'auto'` with no fallback when model skips tool call

### Solution: Full Function Calling Result Loop

Implement the standard tool calling protocol:
```
User message → API call → Model returns tool_calls
  → Show to user → User confirms
  → Execute tool → Get result
  → Send tool result back to API → Model generates final response
  → Show final response to user
```

Key changes to `src/services/ai.ts`:
- `sendMessage()`: Make initial API call, return tool_calls for user confirmation (no execute)
- New `sendToolResult()`: After user confirms, send tool_calls + results back to API, get final text response
- Reconstruct full conversation history including tool_calls and tool result messages
- `temperature`: 0.7 → 0.3
- Chat history: Preserve `tool_calls` and `tool` role messages (not just text)

Key changes to `src/stores/chatStore.ts`:
- `confirmAction()`: Execute action → call `sendToolResult()` → append AI final response as new message
- Store `tool_calls` array on assistant messages for history reconstruction

### System Prompt Rewrite

Current: 8 lines, no module distinction rules.
New: Structured prompt with:
- Module responsibility definitions (when to use todo vs plan vs note)
- Decision tree for ambiguous user intents
- Mandatory behavior rules (e.g., learning plans MUST have 3+ tasks)
- Examples of correct tool usage

### Tool Definition Enhancements

- `add_todo`: Add `content` field for long text. Better description distinguishing from notes.
- `add_plan`: Mark `tasks` as required. Enhanced description requiring 3-8 progressive tasks.
- `update_plan`/`add_plan`: Add `subTasks` to task item schema so AI can create nested tasks.
- Remove `add_memo`/`update_memo`/`delete_memo` (memo → notes, different tools).
- Add `add_note`/`update_note`/`delete_note` with clearer distinction from todo.

## Topic 2: Memo → Notes Redesign

### Problem
Memo and Todo have overlapping functionality causing AI confusion.

### Solution
Rename "备忘录" to "笔记" throughout the app:
- `src/types/memo.ts` → `src/types/note.ts` (Memo → Note interface)
- `src/stores/memoStore.ts` → `src/stores/noteStore.ts`
- `src/pages/Memo/` → `src/pages/Notes/`
- AI tools: `add_memo`/`update_memo`/`delete_memo` → `add_note`/`update_note`/`delete_note`
- DB table: `memos` → `notes` (need migration for existing data)
- Sidebar: "备忘录" → "笔记"
- System prompt: Clear distinction — Notes for long-form content/knowledge, Todos for action items

### Note vs Todo Distinction in System Prompt
- **Note**: For recording information, knowledge, ideas. "记一下"、"笔记"、"这段内容"
- **Todo**: For things to DO. Tasks, reminders, action items. "提醒我"、"帮我做"、"任务"
- **Learning Plan**: For systematic learning of a topic. "学习X"、"掌握X"、"X学习路线"

## Topic 3: Learning Module Bug Fixes

### 3a. AI Tool subTasks Support
Current: `add_plan` tool task items only have `title` and `resources`.
Fix: Add `subTasks` to task item schema (recursive), so AI can create nested task structures.

### 3b. PlanDetail SubTask Rendering
Current: `PlanDetail.tsx` only renders top-level tasks; `subTasks` field exists in type but is never displayed.
Fix: Render subTasks as indented nested list under each parent task with toggle/delete.

### 3c. PlanForm Task Creation
Current: `PlanForm.tsx` only has title + description; tasks start as empty array.
Fix: Add dynamic task list to PlanForm where user can add/remove tasks during creation.

## Topic 4: Todo Module Bug Fixes

### 4a. Edit Button Implementation
Current: `TodoItem` has edit button but `onEdit` handler in `TodoPage` is `() => {}` (no-op).
Fix: Wire edit button to open TodoForm modal pre-filled with existing todo data, then call `updateTodo`.

### 4b. Todo Content Field
Current: Todo only has `description` (short text).
Fix: Add `content: string` field to Todo type for long-form notes within a todo item.
Update TodoForm to include a TextArea for content.

## Non-Functional
- All existing data must be preserved (DB migration from memos → notes table)
- No new dependencies
- Build must pass with zero TS errors after all changes
