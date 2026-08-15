# External Module Deletion Restriction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Временно исключить небезопасное удаление модуля команды из partial e2e, зафиксировать ограничение и продолжить полную платформенную матрицу.

**Architecture:** Декларативная матрица перестаёт объявлять зависимую пару удаления и повторного добавления модуля команды. Production-планировщик не изменяется; ограничение документирует, почему операция остаётся запрещённой до отдельного исследования.

**Tech Stack:** TypeScript 7, Vitest 4, декларативный partial e2e, автономный сервер и агентный режим конфигуратора.

## Global Constraints

- Работать только в worktree `/Users/nikita/git/nkdk/.worktrees/partial-sync-resumable-test`.
- Согласованный договор: `docs/superpowers/specs/2026-08-15-external-file-deletion-partial-sync-design.md`.
- Не изменять production-планировщик и существующие XML-фикстуры.
- Сохранить `module:command:change`, создание модуля вместе с командой и остальные операции модулей.
- Продолжать автономный e2e без повторной начальной загрузки после безопасного переноса `planHash`.
- После слоя выполнить `pnpm duplicates -- --base f2404b782`.

---

### Task 1: Исключить запрещённую пару из матрицы

**Files:**
- Modify: `e2e/partial-sync/matrix.test.ts`
- Modify: `e2e/partial-sync/matrix/module-operations.ts`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Consumes: `moduleOperations`, `moduleSupplementalOperations`, `moduleRestoreOperations`.
- Produces: матрица из 95 блоков без `module:command:remove` и `module:command:add`.

- [ ] **Step 1: Написать падающую проверку состава модульных операций**

Расширить тест `covers module and external payload classes`:

```ts
expect(moduleSupplementalOperations.map(({ key }) => key)).toEqual([
  "module:form:change",
  "module:object:change",
])
expect(moduleRestoreOperations.map(({ key }) => key)).toEqual([
  "module:object:remove",
  "module:form:remove",
  "module:common:restore",
])
```

Добавить недостающие импорты `moduleSupplementalOperations` и
`moduleRestoreOperations` из `matrix/module-operations`.

- [ ] **Step 2: Запустить RED**

Run:

```bash
pnpm exec vitest run --config e2e/partial-sync/vitest.config.ts e2e/partial-sync/matrix.test.ts
```

Expected: тест падает, потому что `moduleSupplementalOperations` ещё содержит
`module:command:remove` и `module:command:add`.

- [ ] **Step 3: Удалить зависимую пару деклараций**

В `moduleSupplementalOperations` удалить:

```ts
operation("module:command:remove", "command", commandPath, commandChanged, null),
operation("module:command:add", "command", commandPath, null, commandInitial),
```

Константы `commandInitial` и `commandChanged` оставить: они используются
`module:command:change`.

- [ ] **Step 4: Зафиксировать ограничение**

Добавить в `.agents/restrictions.md` пункт:

```markdown
- Отдельное удаление внешнего модуля пока запрещено в partial sync. Загрузка XML владельца без полного набора его файлов удаляет не только целевой модуль, но и другие отсутствующие в ZIP модули и файловые части. До исследования безопасного состава пакета partial e2e не выполняет пару удаления и повторного добавления модуля команды; создание и изменение модулей остаются покрыты.
```

- [ ] **Step 5: Запустить GREEN и проверки слоя**

Run:

```bash
pnpm exec vitest run --config e2e/partial-sync/vitest.config.ts e2e/partial-sync/matrix.test.ts
pnpm type-check
pnpm duplicates -- --base f2404b782
```

Expected: целевой тест и type-check проходят, новых блокирующих дублей нет.

- [ ] **Step 6: Закоммитить ограничение сценария**

```bash
git add .agents/restrictions.md e2e/partial-sync/matrix.test.ts e2e/partial-sync/matrix/module-operations.ts docs/superpowers/specs/2026-08-15-external-file-deletion-partial-sync-design.md docs/superpowers/plans/2026-08-15-external-file-deletion-partial-sync.md
git commit -m "test: :white_check_mark: исключить удаление внешнего модуля"
```

### Task 2: Перенести контрольную точку и продолжить автономный e2e

**Files:**
- Verify only: `/Users/nikita/Базы 1С/temp_test/full-current-standalone`

**Interfaces:**
- Consumes: checkpoint после `module:object:add:probe`, старый и новый планы.
- Produces: согласованный `planHash` только при неизменном префиксе блоков 1–38; прохождение оставшихся блоков сокращённого плана.

- [ ] **Step 1: Проверить неизменность префикса**

Сохранить JSON блоков старого плана до изменения матрицы и сравнить его с
блоками нового плана до `module:object:add:probe`. Ожидать полное равенство 38
блоков; при любом отличии не переносить checkpoint.

- [ ] **Step 2: Перенести только `planHash`**

В `state.json` и `checkpoints/current/manifest.json` заменить старый `planHash`
на хэш нового плана. Не изменять `completedBlock`, базу, проект и список хэшей
файлов manifest. После записи вызвать штатную проверку checkpoint.

- [ ] **Step 3: Продолжить без `--reset`**

Run outside sandbox:

```bash
pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test/full-current-standalone' --mode standalone-server
```

Expected: сценарий начинает со следующего блока `module:form:change:probe` и
идёт до конца. При новом сбое сохраняется новая контрольная точка; начало не
повторяется.

### Task 3: Проверить агентный режим и ветку

**Files:**
- Verify only: `/Users/nikita/Базы 1С/temp_test/full-current-designer-agent`

**Interfaces:**
- Consumes: сокращённая матрица из 95 блоков.
- Produces: полный результат агентного режима и проверки репозитория.

- [ ] **Step 1: Запустить чистый агентный прогон**

Run outside sandbox:

```bash
pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test/full-current-designer-agent' --mode designer-agent --reset
```

- [ ] **Step 2: Запустить обязательные проверки**

Run outside sandbox where required:

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base f2404b782
```

- [ ] **Step 3: Зафиксировать итог**

Составить таблицу выполненных блоков, времени двух режимов, обнаруженных ошибок
и ссылок на журналы. Не считать матрицу полностью проверенной, если какой-либо
режим не завершил последний блок и итоговое сравнение.
