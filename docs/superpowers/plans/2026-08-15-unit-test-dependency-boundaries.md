# Unit Test Dependency Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запретить unit-тестам реальные внешние зависимости, включить единые лимиты во всех unit/integration-командах и устранить подтверждённые превышения.

**Architecture:** Чистый анализатор исходников отделяется от файлового CLI, а общий Vitest guard блокирует фактические обращения через production-код. Тесты с реальным I/O получают суффикс `.integration.test.ts`; предметные сценарии переходят на существующие или новые нейтральные порты. Все package scripts запускают Vitest только через единый переходник длительности.

**Tech Stack:** TypeScript 7, Node.js 26, Vitest 4, pnpm, LMDB, dependency-cruiser, jscpd.

## Global Constraints

- Unit `*.test.ts` не вызывает сеть, файловую систему, базы данных, дочерние процессы, настоящие worker или внешние службы.
- Реальные внешние адаптеры разрешены только в `*.integration.test.ts`.
- Цель test case — 10 мс; жёсткий предел unit и integration test case — 50 мс.
- Жёсткий предел lifecycle test file — 1 000 мс; setup пакета — 3 000 мс с действующими коэффициентами CI/Windows.
- Нельзя повышать лимиты, исключать тест из проверки длительности или переносить его в integration только ради обхода лимита.
- Существующие XML-фикстуры не изменяются.
- Новое применение `!xml`, изменение общих типов rules.ts и перезапись архитектурных baseline запрещены.
- После каждого законченного слоя выполняется `pnpm duplicates -- --base a2156676f`.

---

### Task 1: Сделать лимиты едиными и обязательными

**Files:**
- Modify: `scripts/assert-test-durations.mjs`
- Modify: `packages/rules/scripts/assert-test-durations.test.ts`
- Modify: `packages/runtime/package.json`
- Modify: `packages/rules/package.json`
- Modify: `packages/mcp/package.json`
- Modify: `packages/rules/scripts/run-test-duration-check.test.ts`

**Interfaces:**
- Consumes: `runTestDurationCheck(projectRoot, vitestArguments, spawn, suite)`.
- Produces: единый предел `TEST_DURATION_LIMIT_MS = 50`, `TEST_FILE_LIMIT_MS = 1_000`, `TEST_PACKAGE_SETUP_LIMIT_MS = 3_000`; package scripts без прямого `vitest run`.

- [ ] **Step 1: Написать падающие проверки единого предела**

Изменить тесты анализатора так, чтобы integration `50` проходил, `50.01` попадал в `failures`, lifecycle file `1_000.01` и setup `3_000.01` также были ошибками:

```ts
expect(analyzeTestDurationReport(
  report({ testMs: 50.01 }),
  lifecycleReport(1_000),
  { NKDK_TEST_SUITE: "integration" },
).failures).toContainEqual(expect.objectContaining({ type: "test", duration: 50.01 }))

expect(analyzeTestDurationReport(
  report({ testMs: 1 }),
  lifecycleReport(1_000.01, 3_000.01),
).failures).toEqual(expect.arrayContaining([
  { type: "file", file: "/project/packages/rules/example.test.ts", duration: 1_000.01 },
  { type: "setup", duration: 3_000.01 },
]))
```

- [ ] **Step 2: Подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/scripts/assert-test-durations.test.ts`

Expected: FAIL — integration `50.01` ещё допускается, а file/setup возвращаются только как warnings.

- [ ] **Step 3: Реализовать минимальную модель лимитов**

В `analyzeTestDurationReport` использовать один base test limit и добавлять превышения file/setup в `failures`, сохраняя предупреждения для диагностики:

```js
export const TEST_DURATION_LIMIT_MS = 50
export const TEST_FILE_LIMIT_MS = 1_000
export const TEST_PACKAGE_SETUP_LIMIT_MS = 3_000

if (packageSetupDuration > TEST_PACKAGE_SETUP_LIMIT_MS * limitMultiplier) {
  const result = { type: "setup", duration: packageSetupDuration }
  warnings.push(result)
  failures.push(result)
}
```

Для file применить тот же шаблон. Удалить `INTEGRATION_TEST_DURATION_LIMIT_MS`; флаг suite сохранить только для совместимости CLI и понятных отчётов.

- [ ] **Step 4: Подключить переходник ко всем integration/native scripts**

Заменить прямые команды:

```json
{
  "test:integration": "node ../../scripts/run-test-duration-check.mjs --integration -- --passWithNoTests --include '**/*.integration.test.ts'"
}
```

Для rules сохранить проекты `native-lmdb`, `native-lmdb-integration`, `integration`, но запускать каждый через `run-test-duration-check.mjs --integration`. Для runtime переименованный LMDB-тест должен выбираться integration glob. Для MCP убрать единственный жёстко заданный путь и запускать все `*.integration.test.ts`.

- [ ] **Step 5: Подтвердить GREEN инфраструктуры**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/scripts/assert-test-durations.test.ts packages/rules/scripts/run-test-duration-check.test.ts`

Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
pnpm duplicates -- --base a2156676f
git add scripts/assert-test-durations.mjs packages/*/package.json packages/rules/scripts
git commit -m "test: :white_check_mark: унифицировать лимиты тестов"
```

---

### Task 2: Добавить структурный запрет внешних зависимостей unit-тестов

**Files:**
- Create: `scripts/unit-test-dependency-boundaries.mjs`
- Create: `scripts/check-unit-test-dependencies.mjs`
- Create: `scripts/unit-test-dependency-boundaries.test.mjs`
- Modify: `package.json`
- Modify: `.agents/testing.md`

**Interfaces:**
- Produces: `findForbiddenUnitTestDependencies(files): BoundaryViolation[]`.
- `BoundaryViolation`: `{ file: string, specifier: string, category: "filesystem" | "network" | "database" | "process" | "worker" }`.
- CLI рекурсивно читает `packages/*`, передаёт `{ file, source }` чистому анализатору и завершается кодом 1 при нарушениях.

- [ ] **Step 1: Написать чистые падающие unit-тесты анализатора**

Использовать только inline source, без `fs`:

```js
test("запрещает внешние импорты обычному unit-тесту", () => {
  const files = [
    { file: "packages/a/read.test.ts", source: 'import fs from "node:fs"' },
    { file: "packages/a/net.test.ts", source: 'import { request } from "node:https"' },
    { file: "packages/a/db.test.ts", source: 'import { open } from "lmdb"' },
    { file: "packages/a/process.test.ts", source: 'import { spawn } from "node:child_process"' },
    { file: "packages/a/worker.test.ts", source: 'import Piscina from "piscina"' },
  ]
  assert.deepEqual(findForbiddenUnitTestDependencies(files).map(({ category }) => category), [
    "filesystem", "network", "database", "process", "worker",
  ])
})

test("разрешает те же импорты интеграционному тесту", () => {
  assert.deepEqual(findForbiddenUnitTestDependencies([
    { file: "packages/a/read.integration.test.ts", source: 'import fs from "node:fs"' },
  ]), [])
})
```

Добавить случаи `fs/promises`, `fetch(...)`, `WebSocket`, `node:sqlite`, `ssh2`, `worker_threads` и динамического `import("node:fs")`.

- [ ] **Step 2: Подтвердить RED**

Run: `node --test scripts/unit-test-dependency-boundaries.test.mjs`

Expected: FAIL — модуль анализатора отсутствует.

- [ ] **Step 3: Реализовать анализатор и файловый CLI**

Анализатор не импортирует Node I/O. Он извлекает static/dynamic specifiers, проверяет глобальные сетевые вызовы и сортирует нарушения по `file`, затем `specifier`:

```js
export function findForbiddenUnitTestDependencies(files) {
  return files
    .filter(({ file }) => file.endsWith(".test.ts") && !file.endsWith(".integration.test.ts"))
    .flatMap(findFileViolations)
    .sort(compareViolations)
}
```

CLI владеет обходом файловой системы, исключает `node_modules`, `.git`, `.worktrees`, `dist`, `coverage`, печатает `file: категория: specifier` и возвращает число нарушений через exit code.

- [ ] **Step 4: Подключить проверку в корневой `pnpm test`**

```json
{
  "test:unit-boundaries": "node scripts/check-unit-test-dependencies.mjs",
  "test": "pnpm test:duplicates-script && pnpm test:unit-boundaries && pnpm -r --workspace-concurrency=1 run test"
}
```

- [ ] **Step 5: Явно записать запреты в `.agents/testing.md`**

Добавить раздел «Изоляция unit-тестов» с точной формулировкой: сеть, БД, файловая система, процессы и настоящие worker запрещены и заменяются моками/нейтральными портами; реальный адаптер требует `.integration.test.ts`; перенос не освобождает от 50 мс.

- [ ] **Step 6: Подтвердить GREEN анализатора и ожидаемый RED репозитория**

Run: `node --test scripts/unit-test-dependency-boundaries.test.mjs`

Expected: PASS.

Run: `pnpm test:unit-boundaries`

Expected: FAIL со стабильным отсортированным перечнем существующих unit-файлов, включая `packages/runtime/metadata/configurationIndex/store.test.ts` и файловые тесты rules/MCP.

- [ ] **Step 7: Зафиксировать слой**

```bash
pnpm duplicates -- --base a2156676f
git add package.json .agents/testing.md scripts/check-unit-test-dependencies.mjs scripts/unit-test-dependency-boundaries.mjs scripts/unit-test-dependency-boundaries.test.mjs
git commit -m "test: :white_check_mark: запретить внешние зависимости unit-тестов"
```

---

### Task 3: Добавить runtime guard и переклассифицировать существующий I/O

**Files:**
- Create: `scripts/vitest/forbid-unit-external-dependencies.ts`
- Create: `packages/rules/scripts/forbid-unit-external-dependencies.test.ts`
- Modify: `packages/platform/vitest.config.ts`
- Modify: `packages/runtime/vitest.config.ts`
- Modify: `packages/rules/vitest.config.ts`
- Modify: `packages/mcp/vitest.config.ts`
- Rename: все найденные `*.test.ts`, которые вызывают реальный I/O как часть договора, в `*.integration.test.ts`
- Modify: unit-тесты предметной логики, где I/O не является договором, на внедряемые моки

**Interfaces:**
- Produces: `forbiddenUnitDependency(name): (...args: unknown[]) => never` с сообщением `В unit-тесте запрещена внешняя зависимость <name>; передайте mock/порт`.
- Vitest setup запрещает реальные `fs`, `fs/promises`, HTTP/HTTPS/net/dns/tls/dgram, `fetch`, WebSocket, LMDB, `node:sqlite`, `child_process`, `worker_threads.Worker`, Piscina и настоящий SSH client.

- [ ] **Step 1: Написать падающие тесты guard**

Проверить фабрику ошибки и разрешённый чистый mock:

```ts
it("указывает запрещённую зависимость и способ замены", () => {
  expect(() => forbiddenUnitDependency("node:fs.readFileSync")()).toThrow(
    "В unit-тесте запрещена внешняя зависимость node:fs.readFileSync; передайте mock/порт",
  )
})

it("не запрещает переданный вызывающим кодом порт", async () => {
  const read = vi.fn(async () => "данные")
  await expect(read()).resolves.toBe("данные")
})
```

- [ ] **Step 2: Подтвердить RED**

Run: `pnpm --filter @nkdk/rules exec vitest run packages/rules/scripts/forbid-unit-external-dependencies.test.ts`

Expected: FAIL — setup-модуль отсутствует.

- [ ] **Step 3: Реализовать общий guard**

Сохранить безопасные константы/типы модулей, но заменить I/O-функции throwing stubs. Для built-ins синхронизировать именованные ESM exports через `syncBuiltinESMExports`; для LMDB/Piscina/ssh2 использовать `vi.mock`. Существующие `ForbiddenPiscina` и символы `Piscina.move` перенести в общий модуль без изменения договора.

- [ ] **Step 4: Подключить guard только к unit-проектам**

В rules подключить его к `unit`, `bundle-contract`, `core-metadata`, но не к `integration`, `native-lmdb`, `native-lmdb-integration`. В остальных пакетах разделить Vitest projects `unit`/`integration`, чтобы setup применялся только к unit.

- [ ] **Step 5: Переклассифицировать реальные адаптерные проверки**

Применить механическое правило ко всему результату `pnpm test:unit-boundaries`:

- тесты `configurationIndex/store`, `partialSyncToXml/{deliveryState,pendingStore}`, project/file operations, fixture scanners/copiers, XML/YAML file adapters и MCP service filesystem adapters переименовать в `.integration.test.ts`;
- тесты преобразований, использующие `readFixtureXML`/`readAndParseXMLFile`, также сделать integration, поскольку они читают реальные XML-файлы;
- архитектурные сканеры вынести из Vitest unit в файловый CLI либо integration;
- тесты координаторов с уже существующими зависимостями (`SyncToInfobaseDependencies`, `FullXmlSyncCoordinatorDependencies`, worker pool factories) оставить/вернуть в unit и передавать `vi.fn`/in-memory fake вместо I/O.

Использовать `git mv`; XML-файлы не менять.

- [ ] **Step 6: Устранить нарушения, найденные только runtime guard**

Run: `pnpm test:isolated`

Для каждого падения сформулировать один из двух выводов: внешний адаптер является договором → integration; внешний вызов лишь setup → мок ближайшего нейтрального порта. Не добавлять allowlist.

- [ ] **Step 7: Подтвердить границу**

Run: `pnpm test:unit-boundaries`

Expected: PASS, 0 нарушений.

Run: `pnpm test:isolated`

Expected: PASS; ни один unit-тест не сообщает ошибку runtime guard.

- [ ] **Step 8: Зафиксировать слой**

```bash
pnpm duplicates -- --base a2156676f
git add scripts/vitest packages
git commit -m "test: :white_check_mark: изолировать unit-тесты от внешнего окружения"
```

---

### Task 4: Уложить LMDB configuration index в 50 мс

**Files:**
- Rename: `packages/runtime/metadata/configurationIndex/store.test.ts` → `store.integration.test.ts`
- Modify: `packages/runtime/metadata/configurationIndex/store.integration.test.ts`
- Create: `packages/runtime/metadata/configurationIndex/storeContract.test.ts`
- Modify: `packages/runtime/metadata/configurationIndex/store.ts` только если профиль докажет повторный дорогой flush/open в production-границе

**Interfaces:**
- Unit contract использует `ConfigurationIndexStore`/`ConfigurationIndexCandidateStore` fake и не импортирует LMDB/fs.
- Integration сохраняет только договоры реальной схемы, MVCC, атомарной публикации и совместимости.

- [ ] **Step 1: Трижды воспроизвести превышение через обязательный runner**

Run три раза: `node ../../scripts/run-test-duration-check.mjs --integration -- metadata/configurationIndex/store.integration.test.ts`

Expected before fix: стабильное превышение сценария publication около 111 мс.

- [ ] **Step 2: Выделить чистые договоры путей и валидации в unit**

Перенести проверки invalid project path и descriptor в `storeContract.test.ts`, вызывая чистые `configurationIndexStoreDescriptor`/валидацию без открытия LMDB. Тест, который изменится при неверной проверке `a/../b`, должен оставаться предметным.

- [ ] **Step 3: Сократить реальные LMDB-сценарии без потери договоров**

Объединить setup одной временной базы на `describe`, выполнять очистку named DB в транзакции между сценариями, не повторять open/close для каждой строки `it.each`. Сохранить отдельные наблюдаемые договоры: schema version/tables, selective reads, MVCC reader, pending apply, atomic candidate publication, повреждённая версия.

- [ ] **Step 4: Подтвердить GREEN три раза**

Run три раза через ту же команду.

Expected: каждый test case `<= 50ms`, file `<= 1_000ms`.

- [ ] **Step 5: Зафиксировать слой**

```bash
pnpm duplicates -- --base a2156676f
git add packages/runtime/metadata/configurationIndex
git commit -m "perf: :zap: ускорить интеграционные проверки LMDB"
```

---

### Task 5: Устранить превышения native rules и тяжёлого import setup

**Files:**
- Modify/Rename: `packages/rules/metadata/fullSyncToXml/worker.integration.test.ts`
- Modify/Rename: `packages/rules/metadata/appliedObjects/configuration/convertFromXML.test.ts`
- Modify/Rename: `packages/rules/metadata/partialSyncToXml/deliveryState.test.ts`
- Modify/Rename: `packages/rules/metadata/partialSyncToXml/pendingStore.test.ts`
- Modify: `packages/rules/metadata/importFromXml/russianMetadataReferences.integration.test.ts`
- Create or extend: `packages/rules/metadata/fullSyncToXml/worker.test.ts`
- Reuse: `packages/rules/metadata/fullSyncToXml/testHelpers.ts`

**Interfaces:**
- Unit worker tests use injected `FullXmlSyncWorkerDependencies` and fake `ConfigurationIndexStore`.
- Native integration covers only LMDB/file publication boundaries.
- Russian reference integration imports a minimal fixture tree, not the complete `e2e/fixtures/xml/cf`.

- [ ] **Step 1: Зафиксировать RED для шести worker cases и lifecycle import**

Run три раза:

```bash
node ../../scripts/run-test-duration-check.mjs --integration -- --no-isolate --project native-lmdb --project native-lmdb-integration
node ../../scripts/run-test-duration-check.mjs --integration -- --no-isolate --project integration metadata/importFromXml/russianMetadataReferences.integration.test.ts
```

Expected: worker cases 100–394 мс и Russian metadata file около 5,4 с.

- [ ] **Step 2: Перенести координационные worker-договоры на fake stores**

Использовать `createFakeConfigurationIndexStore`, `createFakeConfigurationIndexCandidateStore`, `emptyProjectStateReadSession` и memory output. Сценарии initialize/execute/dispose, batching, policy propagation и ошибки сессии становятся unit; assertions проверяют XML bytes/результат команды, а не вызовы моков.

- [ ] **Step 3: Оставить узкую native-интеграцию**

В integration сохранить по одному сценарию реальной публикации индекса, чтения опубликованного блока и восстановления XML из него. Общий setup LMDB создать один раз, очистку выполнять между тестами.

- [ ] **Step 4: Уменьшить Russian metadata fixture**

Добавить новый минимальный fixture-каталог только с общей формой, задачей, справочником, планом обмена и требуемым предопределённым значением. Не менять существующие XML. Выполнять тот же `importConfigurationFromXml` и сохранять проверки русских ссылок и распределения по разным worker.

- [ ] **Step 5: Подтвердить GREEN три раза**

Run: команды Step 1 трижды.

Expected: test cases `<= 50ms`, lifecycle files `<= 1_000ms`.

- [ ] **Step 6: Зафиксировать слой**

```bash
pnpm duplicates -- --base a2156676f
git add packages/rules/metadata/fullSyncToXml packages/rules/metadata/partialSyncToXml packages/rules/metadata/appliedObjects/configuration packages/rules/metadata/importFromXml
git commit -m "perf: :zap: ускорить native и import integration-тесты"
```

---

### Task 6: Заменить полный MCP runtime в тестах координатора управляемым портом

**Files:**
- Rename: `packages/mcp/src/services/syncToInfobase.integration.test.ts` → `syncToInfobase.test.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.test.ts`
- Modify: `packages/mcp/src/services/syncToInfobase.ts` только если существующего `SyncToInfobaseDependencies` недостаточно
- Create: `packages/mcp/src/services/syncToInfobaseTestDependencies.ts` либо локальный test builder в тесте, если он остаётся компактным

**Interfaces:**
- Reuse: `SyncToInfobaseDependencies`.
- Fake core хранит in-memory pending state и реализует `prepare/readPending/markTransferring/markPrepared/markApplied/finalize/forceClear`.
- Fake fs реализует только `mkdir`/`rm`; fake platform управляет success/rejected/unknown outcome.

- [ ] **Step 1: Написать быстрый падающий сценарий на fake dependencies**

Сначала перенести один договор «успешная передача → finalize → unchanged» на stateful fake:

```ts
const fixture = syncDependencies({ prepare: [preparedPackage(), unchanged()] })
const first = await syncToInfobase(input("/project"), fixture.dependencies)
const second = await syncToInfobase(input("/project"), fixture.dependencies)
expect(first).toMatchObject({ ok: true, status: "synchronized", finalizeStatus: "published" })
expect(second).toMatchObject({ ok: true, status: "unchanged" })
expect(fixture.state.platformLoads).toBe(1)
```

- [ ] **Step 2: Подтвердить RED против неполного fake**

Run: `pnpm --filter @nkdk/mcp exec vitest run src/services/syncToInfobase.test.ts -t "передаёт пакет"`

Expected: FAIL на первой ещё не реализованной фазе fake state machine.

- [ ] **Step 3: Реализовать минимальный stateful fake**

Fake должен проверять `packageId`/`attemptId`, хранить delivery status и возвращать ошибки при неверном порядке. Assertions остаются на payload/состоянии координатора, не на наличии мока.

- [ ] **Step 4: Перенести остальные пять договоров**

Перенести finalize retry, confirmed rejection, unknown outcome, serialization queue и extension name. Для очереди использовать управляемые Promise `started`/`release`; никаких timers или файлов.

- [ ] **Step 5: Удалить тяжёлый runtime setup**

Удалить imports `fs`, LMDB store, `createMetadataRuntime`, `metadataRules`, ZIP reader и временные каталоги из unit-теста. Реальные договоры ZIP/LMDB остаются в rules integration (`archiveWriter`, partial pending store, configuration index publication).

- [ ] **Step 6: Подтвердить GREEN и лимит три раза**

Run три раза: `node ../../scripts/run-test-duration-check.mjs -- --exclude '**/*.integration.test.ts' src/services/syncToInfobase.test.ts`

Expected: 6 tests PASS, каждый `<= 50ms`, внешние зависимости не вызываются.

- [ ] **Step 7: Зафиксировать слой**

```bash
pnpm duplicates -- --base a2156676f
git add packages/mcp/src/services/syncToInfobase.test.ts packages/mcp/src/services/syncToInfobase.integration.test.ts packages/mcp/src/services/syncToInfobase.ts
git commit -m "test: :white_check_mark: изолировать syncToInfobase от runtime"
```

---

### Task 7: Полная проверка и отчёт о тестах

**Files:**
- Create: `docs/superpowers/results/2026-08-15-unit-test-dependency-boundaries.md`
- Modify: только файлы, для которых финальная проверка воспроизводит конкретное нарушение

**Interfaces:**
- Produces: воспроизводимый отчёт с командами, длительностями, переклассифицированными/изменёнными/добавленными/удалёнными тестами и сохранёнными договорами.

- [ ] **Step 1: Запустить статическую и изолированную проверки**

```bash
pnpm test:unit-boundaries
pnpm test:isolated
```

Expected: PASS; 0 запрещённых unit-зависимостей.

- [ ] **Step 2: Запустить типы и полный unit/integration набор вне песочницы**

```bash
pnpm type-check
pnpm test
```

Expected: PASS; ни одного `Лимит превышен`, lifecycle file/setup также в пределах.

- [ ] **Step 3: Повторить профилируемые группы ещё два раза**

Повторить `pnpm test` ещё два раза либо запустить все затронутые package runners с тремя seed. В отчёт записать медиану трёх прогонов и максимум только как показатель нестабильности.

- [ ] **Step 4: Запустить проверки архитектуры**

```bash
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: PASS без изменения baseline.

- [ ] **Step 5: Проверить новые дубли**

Run: `pnpm duplicates -- --base a2156676f`

Expected: новых дублей нет.

- [ ] **Step 6: Составить итоговый отчёт**

Для каждого нового теста назвать уникальный договор; для переименованного — причину integration-классификации; для удалённого — оставшуюся защиту. Отдельно привести максимумы исходной диагностики: runtime 111.33 мс, rules native 394.47 мс, MCP 11 836.80 мс, Russian metadata lifecycle 5 411.65 мс, и итоговые медианы.

- [ ] **Step 7: Финальный коммит отчёта**

```bash
git add docs/superpowers/results/2026-08-15-unit-test-dependency-boundaries.md
git commit -m "docs: :memo: зафиксировать результат изоляции тестов"
```
