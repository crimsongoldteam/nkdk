# Safe Partial Infobase Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести частичную загрузку к подтверждённому поведению ЕДТ, всегда обновлять конфигурацию базы, запретить автономный режим для клиент-серверных баз и сделать e2e-контрольную копию восстанавливаемой после сбоев.

**Architecture:** Платформенный слой классифицирует `loadTargets` как модульную или структурную загрузку и одинаково исполняет две команды в агентной и автономной сессиях. MCP публикует строгий результат с фактическим режимом загрузки. Отдельная e2e-обвязка использует `state.json` как точку фиксации файловой транзакции контрольной копии.

**Tech Stack:** TypeScript 7, Node.js `fs/promises`, Zod, Vitest 4, MCP stdio, команды платформы 8.3.27.

## Global Constraints

- Работать только в worktree `/Users/nikita/git/nkdk/.worktrees/partial-sync-resumable-test`.
- Не изменять существующие XML-фикстуры.
- Следовать TDD: каждый новый договор сначала должен дать ожидаемое падение.
- `--partial` передавать только для непустого списка, состоящего исключительно из `.bsl`.
- После успешного `config load-files` всегда выполнять `config update-db-cfg --session-terminate="prompt"`.
- Автономный режим временно поддерживает только файловые базы.
- Полную матрицу реального partial e2e повторно не запускать.
- Согласованный договор: `docs/superpowers/specs/2026-08-15-safe-partial-infobase-sync-design.md`.

---

### Task 1: Единая классификация и исполнение загрузки

**Files:**
- Modify: `packages/platform/src/sessions/commands.ts`
- Modify: `packages/platform/src/sessions/commands.test.ts`
- Modify: `packages/platform/src/sessions/types.ts`
- Modify: `packages/platform/src/sessions/designerAgent.ts`
- Modify: `packages/platform/src/sessions/designerAgent.test.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts`
- Modify: `packages/platform/src/sessions/manager.ts`
- Modify: `packages/platform/src/sessions/manager.test.ts`

**Interfaces:**
- Produces: `classifyPartialLoad(loadTargets): "partial" | "selected"`.
- Produces: обязательный `loadMode` в `LoadPartialConfigurationResult` и результате `PlatformSession.loadPartialConfiguration`.
- Consumes: существующие `archivePath`, `loadTargets`, `extensionName`, журнал и сигнал отмены.

- [ ] **Step 1: Написать падающие тесты построителя команды**

Добавить случаи: один или несколько `.bsl` дают `--partial`; XML, смешанный и пустой списки не дают ключ. Команда по-прежнему содержит точный `--list-file`.

- [ ] **Step 2: Запустить RED для `commands.test.ts`**

Run: `pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/commands.test.ts`

Expected: FAIL из-за отсутствующей классификации и параметра режима.

- [ ] **Step 3: Реализовать минимальную классификацию**

Добавить чистую функцию, нормализующую разделители только для проверки суффикса `.bsl`, и обязательный параметр `loadMode` построителя команды. Не читать ZIP и не дублировать классификацию в адаптерах.

- [ ] **Step 4: Написать падающие тесты двух сессий**

Для каждой сессии проверить две последовательности команд:

```text
config load-files ... --partial ...
config update-db-cfg --session-terminate="prompt"
```

и

```text
config load-files ... без --partial
config update-db-cfg --session-terminate="prompt"
```

Результат должен содержать соответствующий `loadMode`. Ошибка второй команды не должна считаться успешной доставкой.

- [ ] **Step 5: Запустить RED тестов сессий**

Run: `pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/designerAgent.test.ts packages/platform/src/sessions/standaloneServer.test.ts`

Expected: FAIL у агентной сессии из-за отсутствующего `update-db-cfg`, а у обеих — из-за отсутствующего `loadMode` и условного `--partial`.

- [ ] **Step 6: Реализовать общий договор сессий и менеджера**

Обе сессии вычисляют режим одной общей функцией перед построением команды, выполняют обновление базы после загрузки и возвращают `{ warnings, loadMode }`. Менеджер без потерь передаёт результат наружу.

- [ ] **Step 7: Запустить GREEN платформенного узла**

Run: `pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/commands.test.ts packages/platform/src/sessions/designerAgent.test.ts packages/platform/src/sessions/standaloneServer.test.ts packages/platform/src/sessions/manager.test.ts`

Expected: PASS.

- [ ] **Step 8: Проверить дубли слоя**

Run: `pnpm duplicates -- --base d3ea36255`

Expected: нет новых блокирующих дублей.

### Task 2: Запрет клиент-серверного автономного режима

**Files:**
- Modify: `packages/platform/src/sessions/standaloneServer.ts`
- Modify: `packages/platform/src/sessions/standaloneServer.test.ts`

**Interfaces:**
- Consumes: результат `parseConnection`.
- Produces: `PlatformSessionError("unsupported_connection", ...)` до любых вызовов файловой системы и процессов для `connection.type === "server"`.

- [ ] **Step 1: Усилить существующий тест клиент-серверного подключения**

Ожидать `unsupported_connection`, сообщение о временном ограничении автономного режима и пустой список граничных вызовов даже при переданных параметрах СУБД.

- [ ] **Step 2: Запустить RED**

Run: `pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/standaloneServer.test.ts`

Expected: FAIL, потому что текущий код пытается инициализировать клиент-серверную конфигурацию.

- [ ] **Step 3: Добавить ранний отказ**

Сохранить файловую ветку; удалить недостижимую подготовку автономной конфигурации через `database` и не менять агентный режим.

- [ ] **Step 4: Запустить GREEN**

Run: `pnpm exec vitest run --config packages/platform/vitest.config.ts packages/platform/src/sessions/standaloneServer.test.ts`

Expected: PASS.

### Task 3: Строгий MCP-результат и актуальная документация

**Files:**
- Modify: `packages/mcp/src/contracts/syncToInfobase.ts`
- Modify: `packages/mcp/src/contracts/syncToInfobase.test.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.test.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.integration.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/README.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `LoadPartialConfigurationResult.loadMode`.
- Produces: строгий discriminated union `unchanged | synchronized`, где `loadMode` обязателен только для `synchronized`.

- [ ] **Step 1: Написать падающие контрактные тесты**

Добавить отрицательные проверки: `unchanged` с полями пакета и `synchronized` без любого обязательного поля отклоняются. Полный `synchronized` содержит `loadMode`.

- [ ] **Step 2: Запустить RED контракта**

Run: `pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/contracts/syncToInfobase.test.ts`

Expected: FAIL на текущей ослабленной схеме.

- [ ] **Step 3: Вернуть строгое объединение и тип payload**

Экспортировать success schema как `z.union([unchangedSchema, synchronizedSchema])`, добавить `loadMode`, а сервисный payload определить объединением двух точных форм вместо объекта со всеми необязательными полями.

- [ ] **Step 4: Передать `loadMode` и исправить подтверждение компонента**

В успешном результате использовать значение платформенного менеджера. Сообщение `confirmation_required` и details должны сохранять фактический `componentPath`, включая `cfe/<Имя>`.

- [ ] **Step 5: Обновить README**

Описать обязательное обновление конфигурации базы, условный `--partial`, выборочный `--list-file` и запрет автономного режима для клиент-серверных баз.

- [ ] **Step 6: Запустить GREEN MCP-узла**

Run: `pnpm exec vitest run --config packages/mcp/vitest.config.ts packages/mcp/src/contracts/syncToInfobase.test.ts packages/mcp/src/services/syncToInfobase.test.ts packages/mcp/src/services/syncToInfobase.integration.test.ts packages/mcp/src/tools/registerTools.test.ts`

Expected: PASS.

### Task 4: Файловая транзакция контрольной копии

**Files:**
- Modify: `e2e/partial-sync/checkpoints.ts`
- Modify: `e2e/partial-sync/checkpoints.test.ts`
- Modify: `e2e/partial-sync/workspace.ts`
- Modify: `e2e/partial-sync/workspace.test.ts`

**Interfaces:**
- Produces: публикацию, где `writeState` является точкой фиксации.
- Produces: восстановление из подходящего `current` либо единственного `previous`.
- Produces: безопасное согласование `state.json.tmp` при открытии рабочего каталога.

- [ ] **Step 1: Добавить инъекции и падающие тесты публикации**

Через зависимости `rename` и `remove` воспроизвести сбои до и после записи состояния. Проверить, что сбой удаления `previous` после фиксации возвращает успех, оставляет новое состояние и следующая операция очищает остаток.

- [ ] **Step 2: Добавить падающие тесты восстановления**

Проверить отсутствующий `current` с целым `previous`, отказ второго переименования рабочего каталога и откат только завершённых шагов без удаления исходного `project`.

- [ ] **Step 3: Добавить падающие тесты временного состояния**

Проверить продвижение валидного `state.json.tmp`, если основного файла нет, и удаление временного файла после проверки валидного основного состояния.

- [ ] **Step 4: Запустить RED e2e-модулей**

Run: `pnpm exec vitest run --config e2e/partial-sync/vitest.config.ts e2e/partial-sync/checkpoints.test.ts e2e/partial-sync/workspace.test.ts`

Expected: FAIL на каждой новой аварийной границе.

- [ ] **Step 5: Реализовать минимальную транзакцию**

Разделить замену до точки фиксации и необязательную очистку после неё; восстанавливать только выполненные переименования; при согласовании копий сначала независимо проверять кандидаты, не требуя существования `current`.

- [ ] **Step 6: Реализовать согласование `state.json.tmp`**

Не удалять файл до синтаксической и структурной проверки. Валидный основной файл остаётся авторитетным; при его отсутствии валидный временный файл атомарно становится основным.

- [ ] **Step 7: Запустить GREEN контрольных копий**

Run: `pnpm exec vitest run --config e2e/partial-sync/vitest.config.ts e2e/partial-sync/checkpoints.test.ts e2e/partial-sync/workspace.test.ts`

Expected: PASS.

- [ ] **Step 8: Проверить дубли слоя**

Run: `pnpm duplicates -- --base d3ea36255`

Expected: нет новых блокирующих дублей.

### Task 5: Узкая реальная проверка и общая верификация

**Files:**
- Modify if needed after observed failure: only files already listed in Tasks 1–4.
- Do not modify: `e2e/partial-sync/matrix/*` and existing XML fixtures.

**Interfaces:**
- Consumes: `/Users/nikita/Базы 1С/temp_test` как источник последней подтверждённой контрольной копии.
- Produces: четыре независимых результата — модуль и структура для `designer-agent`, модуль и структура для `standalone-server`.

- [ ] **Step 1: Выполнить статические проверки**

Run: `pnpm type-check`

Run: `pnpm test:architecture:rules`

Run: `pnpm test:architecture`

Expected: PASS.

- [ ] **Step 2: Выполнить полный обычный набор тестов**

Run outside sandbox: `pnpm test`

Expected: PASS. Эта команда не запускает внешний partial-sync сценарий.

- [ ] **Step 3: Подготовить четыре временные копии одной контрольной точки**

Копировать только `checkpoints/current/base` и `checkpoints/current/project` во временные каталоги под `/private/tmp`; исходный каталог сценария не изменять. В настройках каждой копии установить нужный `operations.import.mode`.

- [ ] **Step 4: Проверить модульный случай в двух режимах**

Изменить один существующий `.bsl`, вызвать `nkdk.sync_to_infobase`, проверить в ответе единственную модульную цель и `loadMode: "partial"`, затем получить `unchanged` и подтвердить изменение обратным импортом.

- [ ] **Step 5: Проверить структурный случай в двух режимах**

Добавить один безопасный строковый реквизит существующему тестовому объекту, вызвать синхронизацию, проверить XML-цели и `loadMode: "selected"`, затем получить `unchanged` и подтвердить изменение обратным импортом.

- [ ] **Step 6: Не запускать полную матрицу**

Не выполнять `pnpm test:partial-sync -- --root '/Users/nikita/Базы 1С/temp_test'` без узкого ограничителя: команда продолжает весь оставшийся декларативный план.

- [ ] **Step 7: Финальная проверка дублей**

Run: `pnpm duplicates -- --base d3ea36255`

Expected: нет новых блокирующих дублей.

