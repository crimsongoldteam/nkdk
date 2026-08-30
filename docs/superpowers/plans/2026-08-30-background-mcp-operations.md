# Фоновые операции MCP — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Немедленно возвращать `operationId` для длительных MCP-инструментов и надёжно предоставлять состояние, итог и отмену независимо от 300-секундного ограничения клиента.

**Architecture:** Процессный `BackgroundOperationManager` исполняет типизированный реестр операций и сохраняет снимки в `.nkdk/operations`. MCP-инструменты являются тонкими адаптерами start/get/cancel; исходные сервисы остаются синхронно тестируемыми исполнителями и получают отдельный `AbortSignal` операции.

**Tech Stack:** TypeScript 7, MCP SDK 2.0, TypeBox, Node.js fs/promises, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-30-reliable-long-mcp-operations-and-created-resource-sync-design.md`

## Global Constraints

- Используется прикладной API NKDK, а не экспериментальный MCP Tasks.
- После `accepted` сигнал исходного запроса не управляет операцией.
- Секреты и полные platform logs не сохраняются в JSON операции.
- Состояния: `queued`, `running`, `succeeded`, `failed`, `cancelled`, `interrupted`.
- Незавершённая операция после старта процесса становится `interrupted` и не повторяется автоматически.
- Терминальные записи хранятся 30 дней; активные не удаляются.
- HTTP и stdio используют один process-level manager.
- База проверки дублей: `49024fc07141c1945ce169929984ed6b6126c0fe`.

---

### Task 1: Типизированные договоры start/get/cancel

**Files:**
- Create: `packages/mcp/src/contracts/backgroundOperations.ts`
- Create: `packages/mcp/src/contracts/backgroundOperations.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`

**Interfaces:**
- Produces: `BackgroundOperationKind`, `OperationAccepted`, `GetOperationInput`, `CancelOperationInput`, `BackgroundOperationSnapshot` и TypeBox schemas.

- [ ] **Step 1: Write failing schema tests**

Проверить `accepted`, каждое состояние, запрет дополнительных полей и соответствие результата виду операции. Минимальный договор:

```ts
export const backgroundOperationKindSchema = Type.Union([
  Type.Literal("import_from_infobase"), Type.Literal("import_from_xml"),
  Type.Literal("sync_to_infobase"), Type.Literal("sync_to_xml"),
  Type.Literal("rebuild_project_cache"), Type.Literal("validate_project"),
])
```

- [ ] **Step 2: Run and confirm missing-contract failure**

```bash
pnpm --filter @nkdk/mcp exec vitest run --project unit src/contracts/backgroundOperations.test.ts
```

- [ ] **Step 3: Implement discriminated schemas**

`OperationAccepted` содержит `ok`, `status: "accepted"`, `operationId`, `operationKind`, `projectDir`; get/cancel принимают только `projectDir` и `operationId`. Терминальный `result` строится как union шести пар `operationKind` + существующая output schema соответствующего инструмента, без `Type.Unknown()` на общей границе.

- [ ] **Step 4: Add the schemas to `mcpSchemas` and run type-check**

```bash
pnpm --filter @nkdk/mcp type-check
```

- [ ] **Step 5: Commit contracts**

```bash
git add packages/mcp/src/contracts/backgroundOperations.ts packages/mcp/src/contracts/backgroundOperations.test.ts packages/mcp/src/tools/registerTools.ts
git commit -m "feat: :sparkles: определить договор фоновых операций MCP"
```

### Task 2: Атомарное файловое хранилище операций

**Files:**
- Create: `packages/mcp/src/services/backgroundOperationStore.ts`
- Create: `packages/mcp/src/services/backgroundOperationStore.test.ts`

**Interfaces:**
- Produces: `BackgroundOperationStore` with `read`, `write`, `markInterrupted`, `cleanup`; `createBackgroundOperationStore(fileSystem?, clock?)`.

- [ ] **Step 1: Write failing store tests**

Закрепить путь `.nkdk/operations/<id>.json`, атомарную пару temporary+rename, перевод queued/running в interrupted, сохранение terminal и удаление только terminal старше 30 дней. В тестовом payload включить `password: "secret"` и ожидать, что сериализованный текст его не содержит.

- [ ] **Step 2: Implement a strict persisted record**

Хранилище принимает уже санитизированный snapshot; перед записью рекурсивно отклоняет ключи `/password|token|secret/i`. Запись выполняется:

```ts
await fs.mkdir(directory, { recursive: true })
await fs.writeFile(temporaryPath, `${JSON.stringify(record)}\n`, { flag: "wx" })
await fs.rename(temporaryPath, targetPath)
```

Имя temporary содержит UUID, чтобы параллельные записи не конфликтовали.

- [ ] **Step 3: Run store tests and type-check**

```bash
pnpm --filter @nkdk/mcp exec vitest run --project unit src/services/backgroundOperationStore.test.ts
pnpm --filter @nkdk/mcp type-check
```

- [ ] **Step 4: Commit storage**

```bash
git add packages/mcp/src/services/backgroundOperationStore.ts packages/mcp/src/services/backgroundOperationStore.test.ts
git commit -m "feat: :sparkles: сохранять состояние операций MCP"
```

### Task 3: Диспетчер жизненного цикла и отмены

**Files:**
- Create: `packages/mcp/src/services/backgroundOperationManager.ts`
- Create: `packages/mcp/src/services/backgroundOperationManager.test.ts`

**Interfaces:**
- Produces:

```ts
export interface BackgroundOperationRunner<K extends BackgroundOperationKind> {
  run(input: BackgroundOperationInput<K>, context: {
    signal: AbortSignal
    report(update: { stage: string; completed?: number; total?: number; message?: string }): Promise<void>
  }): Promise<BackgroundOperationResult<K>>
}

export interface BackgroundOperationManager {
  start<K extends BackgroundOperationKind>(kind: K, input: BackgroundOperationInput<K>): Promise<OperationAccepted>
  get(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot>
  cancel(projectDir: string, operationId: string): Promise<BackgroundOperationSnapshot>
  close(): Promise<void>
}
```

- [ ] **Step 1: Write lifecycle tests with a deferred runner**

Проверить немедленный `accepted`, независимость от клиентского signal, queued/running/succeeded, typed result, normalized failure, cancellation before and during run, shared lookup and idempotent terminal reads.

- [ ] **Step 2: Implement manager state transitions**

`start` сохраняет queued до запуска promise через `queueMicrotask`. Каждый transition сначала изменяет in-memory snapshot, затем атомарно пишет его. Отдельный `AbortController` хранится только в памяти. AbortError/`operation_cancelled` при запрошенной отмене даёт `cancelled`; иная ошибка — `failed`.

- [ ] **Step 3: Implement close/recovery behavior**

`close` abort-ит controllers и ждёт `Promise.allSettled`; если исполнитель не подтвердил завершение до закрытия, persisted active record остаётся для последующего `markInterrupted`. При создании manager выполняются recovery и cleanup до приёма start.

- [ ] **Step 4: Run lifecycle tests and commit**

```bash
pnpm --filter @nkdk/mcp exec vitest run --project unit src/services/backgroundOperationManager.test.ts
pnpm --filter @nkdk/mcp type-check
git add packages/mcp/src/services/backgroundOperationManager.ts packages/mcp/src/services/backgroundOperationManager.test.ts
git commit -m "feat: :sparkles: управлять жизненным циклом операций MCP"
```

### Task 4: Реестр длительных сервисов и cooperative cancellation

**Files:**
- Create: `packages/mcp/src/services/backgroundOperationRegistry.ts`
- Create: `packages/mcp/src/services/backgroundOperationRegistry.test.ts`
- Modify: `packages/mcp/src/services/importFromXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/services/projectCache.ts`
- Modify: `packages/mcp/src/services/validateProject.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/runtime/metadataRuntime.ts`
- Modify: `packages/rules/metadata/runtime/contracts.ts`
- Modify: `packages/rules/metadata/runtime/createMetadataRuntime.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.integration.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/syncConfiguration.test.ts`
- Modify: `packages/rules/metadata/project/validateProject.ts`
- Modify: `packages/rules/metadata/project/validateProject.integration.test.ts`
- Modify: `packages/rules/metadata/projectState/service.ts`
- Modify: `packages/rules/metadata/projectState/service.integration.test.ts`

**Interfaces:**
- Consumes: six existing service functions.
- Produces: `createBackgroundOperationRegistry(services)`; each runner receives its own operation `signal`.

- [ ] **Step 1: Write registry mapping tests**

Для каждого kind передать spy service, вызвать runner и проверить точный input/result. Для `import_from_infobase` и `sync_to_infobase` проверить третий аргумент `signal`; для остальных — новый optional signal.

- [ ] **Step 2: Add AbortSignal to non-platform service boundaries**

Сигнатуры становятся:

```ts
importFromXml(input, deps?, signal?)
syncToXml(input, deps?, signal?)
rebuildProjectCache(input, deps?, signal?)
validateYamlProject(input, deps?, signal?)
```

Перед и после каждой крупной Core-фазы вызывать единый `throwIfCancelled(signal)`. Там, где runtime уже принимает signal (`projectState.rebuild`), передать его. В `metadataRuntime.ts` и `runtime/contracts.ts` добавить `signal?: AbortSignal` в параметры import, full sync и validation; `createMetadataRuntime.ts` передаёт его без преобразования. `importConfiguration.ts`, `syncConfiguration.ts` и `validateProject.ts` проверяют signal до подготовки, после worker execution и перед публикацией/фиксацией результата. Их перечисленные integration-тесты удерживают соответствующую deferred phase, вызывают `controller.abort()` и ожидают `operation_cancelled`; import не заменяет индекс, full sync не фиксирует sync state, validation не публикует итоговую коллекцию. `projectState/service.ts` получает тот же signal в `refreshAndValidate`/`rebuild`, используя уже существующий abort-договор сервиса.

- [ ] **Step 3: Keep services directly testable**

Не переносить бизнес-логику в manager. Registry содержит только адаптеры вида:

```ts
sync_to_xml: {
  run: (input, { signal }) => syncToXml(input, undefined, signal),
}
```

- [ ] **Step 4: Run focused service/runtime tests and type-check**

Запустить изменённые тестовые файлы, затем:

```bash
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm --filter @nkdk/mcp type-check
pnpm duplicates -- --base 49024fc07141c1945ce169929984ed6b6126c0fe
```

- [ ] **Step 5: Commit registry and cancellation propagation**

```bash
git add packages/runtime packages/rules packages/mcp/src/coreApi.ts packages/mcp/src/services
git commit -m "feat: :sparkles: подключить длительные сервисы к операциям"
```

### Task 5: Инструменты MCP и process-level handle

**Files:**
- Create: `packages/mcp/src/backgroundOperationHandle.ts`
- Create: `packages/mcp/src/backgroundOperationHandle.test.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/src/mcpServer.ts`
- Modify: `packages/mcp/src/server.ts`
- Modify: `packages/mcp/src/server.test.ts`
- Modify: `packages/mcp/src/httpModern.integration.test.ts`

**Interfaces:**
- Produces: singleton `backgroundOperationHandle.get()/close()`; MCP tools `nkdk.get_operation`, `nkdk.cancel_operation`; six start handlers.

- [ ] **Step 1: Write registration and immediate-return tests**

Проверить список инструментов, output schemas, вызов `start` вместо ожидания service, get/cancel formatting. In-memory MCP test запускает deferred operation, закрывает первый client/server instance, создаёт второй server instance и читает ту же операцию.

- [ ] **Step 2: Implement the process handle**

Следовать шаблону `metadataRuntimeHandle`, но manager создаётся один раз и получает registry/store. `createNkdkMcpServer` регистрирует capabilities с одним handle; stateless HTTP factory не создаёт отдельный manager.

- [ ] **Step 3: Replace six synchronous handlers**

До `start` явно вернуть `confirmation_required`, если write-operation не содержит `allowWrite: true`. После этого handler вызывает manager и возвращает `jsonToolResult(accepted)`. `get_operation` форматирует terminal result тем же formatter, который ранее использовал исходный tool, не меняя persisted result.

- [ ] **Step 4: Add manager shutdown after transport close**

В `server.ts` добавить `() => backgroundOperationHandle.close()` в coordinator после закрытия транспорта и до metadata/platform handles. Тест shutdown проверяет однократное закрытие.

- [ ] **Step 5: Run MCP unit and transport tests, then commit**

```bash
pnpm --filter @nkdk/mcp test:isolated
pnpm --filter @nkdk/mcp exec vitest run --project integration src/httpModern.integration.test.ts
git add packages/mcp/src
git commit -m "feat: :sparkles: запустить длительные MCP-инструменты в фоне"
```

### Task 6: Документация и полная проверка

**Files:**
- Modify after explicit approval: `.agents/architecture.md`
- Modify: `packages/mcp/README.md`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: related guide tests.

**Interfaces:**
- Produces: documented `start -> get_operation`, cancel and restart semantics.

- [ ] **Step 1: Document usage and architecture after explicit approval**

В README и guides привести полный JSON-пример start/get. В architecture описать process-level manager, `.nkdk/operations`, typed registry и запрет зависимости jobs от request signal.

- [ ] **Step 2: Run mandatory checks**

```bash
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 49024fc07141c1945ce169929984ed6b6126c0fe
```

Expected: все команды exit 0.

- [ ] **Step 3: Commit documentation**

```bash
git add .agents/architecture.md packages/mcp/README.md packages/mcp/src/guides
git commit -m "docs: :memo: описать фоновые операции MCP"
```

- [ ] **Step 4: Real acceptance longer than 300 seconds**

На свежей собранной версии MCP запустить импорт `sed_nkdk`. Первый вызов должен быстро вернуть `operationId`; после времени более 300 секунд `nkdk.get_operation` должен вернуть `succeeded` и исходный результат. Затем отдельной тестовой операцией проверить cancel и отсутствие секретов в `.nkdk/operations/<id>.json`.
