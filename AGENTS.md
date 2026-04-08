# AGENTS.md - v2 Smart Todo

## Project: 智能待办 (Smart Todo)
- Stack: React 18, TypeScript (strict), Vite, Ant Design 5, Zustand 5, Dexie.js
- Path alias: `@/` → `src/`

## Build / Type Check
```bash
cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx tsc -b"
cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx vite build"
```

## Dev Server
```bash
cmd /c "cd /d c:\Users\ziy\Desktop\newproj\智能待办 && npx vite"
```

## Key Patterns
- Dexie recursive type workaround: Use loose interface with `tasks: unknown[]` + `[key: string]: unknown`, cast at store boundary
- `noUncheckedIndexedAccess`: Always handle possibly-undefined on array[index], use `!` or guard
- PowerShell does not support `&&` — use `cmd /c "cd /d ... && ..."` for chained commands

## TypeScript Strictness
- `noUncheckedIndexedAccess: true` — array element access may be undefined
- `noEmit: true` — tsc used for type checking only, vite handles compilation
- Unused imports/variables are errors

## DB Migration
- Dexie auto-migrates when `version()` number increases and `stores()` schema changes
- For memos → notes rename: bump version, copy data in upgrade handler

## Operational Notes
- (to be updated during implementation)
