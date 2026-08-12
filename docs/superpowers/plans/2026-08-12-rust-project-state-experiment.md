# Rust ProjectState Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать экспериментальную реализацию двоичного `ProjectState` на Rust через `napi-rs` и доказательно сравнить её с TypeScript по корректности, времени и пиковой RSS.

**Architecture:** Публичные `ProjectStateStore`, `ProjectStateQueryPort`, `ProjectStateService`, `ProjectStateReadToken` и `project-state.bin 0.5.0` сохраняются. Rust-дополнение строит неизменяемые снимки и выполняет чистые пакетные запросы; TypeScript сохраняет транзакции, orchestration, `ProjectStateDependencyValidator`, файловый ввод-вывод и эталонную реализацию.

**Tech Stack:** Node.js 26, TypeScript 7, pnpm 10, Rust 1.97.1 stable, edition 2024, `napi` 3.12.1, `napi-derive` 3.6.3, `napi-build` 2.4.1, `@napi-rs/cli` 3.8.6, Vitest 4.

## Global Constraints

- Работать только в `/Users/nikita/git/nkdk/.worktrees/rust-migration-spike` на ветке `codex/rust-migration-spike`.
- До каждой новой серии изменений убедиться, что ветка основана на актуальном `origin/develop`; не изменять `develop` или `main`.
- Не изменять существующие XML-фикстуры.
- Не изменять `.agents/architecture.md` без отдельного явного разрешения пользователя. Если реализация расходится с утверждённым проектом, остановиться и сообщить об этом.
- Не менять публичные `ProjectStateStore`, `ProjectStateQueryPort`, `ProjectStateService`, форму token `{ claim, buffers }` и формат `project-state.bin 0.5.0`.
- Rust остаётся явно выбираемым экспериментом; TypeScript — реализация по умолчанию до прохождения порогов.
- Переключение на TypeScript допускается только при загрузке дополнения до открытия ProjectState; после `beginUpdate` скрытое переключение запрещено.
- Первый эксперимент поддерживает только текущую `darwin-arm64`; публикация npm-пакетов и сборки Linux/Windows не входят в план.
- Закрепить Rust `1.97.1` в `rust-toolchain.toml`; использовать edition `2024` и только стабильные выпуски зависимостей.
- Закрепить `napi = 3.12.1`, `napi-derive = 3.6.3`, `napi-build = 2.4.1`, `@napi-rs/cli = 3.8.6`; коммитить `Cargo.lock` и `pnpm-lock.yaml`.
- Внешний XML-набор `/Users/nikita/git/sed_xml/cf` считать только для чтения. Не копировать его в репозиторий, не изменять и не делать обязательным для обычных тестов.
- Критерии успеха на большом наборе: пиковая RSS ниже минимум на 25%, целевой этап быстрее минимум на 20%, неизменившийся проект медленнее не более чем на 5%, поведение контрактов совпадает.
- После каждого законченного слоя запускать `pnpm duplicates -- --base e53cb778b`.
- Перед завершением всей реализации запускать `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture` и `pnpm duplicates -- --base e53cb778b`. Известную нестабильность лимитов длительности `platform` фиксировать отдельно; сами падения тестов не игнорировать.

---

## File Map

### Новый пакет `packages/project-state-native`

- `package.json` — локальная сборка дополнения и JavaScript-точка входа.
- `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`, `build.rs` — воспроизводимая Rust-сборка.
- `src/lib.rs` — только экспорт функций Node-API и преобразование ошибок.
- `src/buffers.rs` — безопасные представления шести секций снимка и пяти секций фрагмента.
- `src/format.rs` — версия, заголовки, смещения, контроль границ и служебные значения.
- `src/reader.rs` — неизменяемый reader снимка без полной второй копии индексов.
- `src/query_protocol.rs` — внутренний версионированный двоичный протокол запросов и ответов.
- `src/queries/*.rs` — отдельный модуль на семейство пакетных запросов.
- `src/snapshot_plan.rs` — слияние опубликованного снимка, фрагментов и удалений.
- `src/snapshot_writer.rs` — детерминированная запись шести секций в предоставленные `SharedArrayBuffer`.
- `index.js`, `index.d.ts` — загрузчик сгенерированного `.node` и узкие TypeScript-типы.
- `tests/*.test.ts` — проверка границы Node.js/Rust, включая worker и `SharedArrayBuffer`.

### Адаптер внутри `packages/rules`

- `metadata/projectState/backend.ts` — нейтральные внутренние интерфейсы реализации.
- `metadata/projectState/rust/addon.ts` — ленивая загрузка `@nkdk/project-state-native`.
- `metadata/projectState/rust/protocol.ts` — кодирование запросов и чтение ответов.
- `metadata/projectState/rust/readSession.ts` — адаптер Rust-reader к `ProjectStateReadSession`.
- `metadata/projectState/rust/store.ts` — адаптер Rust-плана к `ProjectStateStore`.
- `metadata/projectState/rust/backend.ts` — сборка Rust store/read session без предметных зависимостей.
- `metadata/composition/projectStateBackend.ts` — единственная точка выбора `typescript`/`rust`.
- `metadata/composition/projectState.ts` и `metadata/composition/workers/generic.ts` — внедрение выбранной реализации в основной процесс и worker.
- `metadata/workerPool/workerState.ts` — получение фабрики read session через composition, без импорта native-пакета в нейтральный слой.

### Измерения

- `packages/rules/scripts/measure-project-state-backends.ts` — сравнение двух реализаций в отдельных процессах.
- `packages/rules/scripts/measure-project-state-backend-worker.ts` — один процесс одного варианта с машинным JSON-результатом.
- `packages/rules/scripts/measure-binary-project-state.ts` — делегирование существующего набора поисковых запросов новому runner.
- `reports/` — только локальные игнорируемые результаты; ничего из замеров не коммитить.

---

### Task 1: Зафиксировать исходные показатели и набор данных

**Files:**
- Modify: `packages/rules/scripts/measure-binary-project-state.ts`
- Create: `packages/rules/scripts/measure-project-state-backend-worker.ts`
- Create: `packages/rules/scripts/measure-project-state-backends.ts`
- Test: `packages/rules/scripts/measure-project-state-backends.test.ts`
- Modify: `packages/rules/package.json`

**Interfaces:**
- Consumes: существующие `loadBinaryProjectState`, `measureBinaryProjectState`, `ProjectStateService` и профильные события.
- Produces: `measureProjectStateBackends(options): Promise<ProjectStateBackendComparison>` и команда `pnpm --filter @nkdk/rules measure:project-state-backends -- <projectDir>`.

```ts
export interface ProjectStateBackendComparison {
  readonly projectDir: string
  readonly runs: readonly ProjectStateBackendRun[]
  readonly summary: {
    readonly rssPassed: boolean
    readonly targetTimePassed: boolean
    readonly unchangedPassed: boolean
    readonly correctnessPassed: boolean
    readonly passed: boolean
  }
}
```

- [ ] **Step 1: Добавить падающие тесты разбора параметров и запуска отдельных процессов**

```ts
expect(parseProjectStateBackendMeasureArgs([
  "/project",
  "--runs", "5",
  "--concurrency", "4",
])).toEqual({
  projectDir: "/project",
  runs: 5,
  concurrency: 4,
  backends: ["typescript", "rust"],
})

expect(buildBackendProcessEnv("rust")).toMatchObject({
  NKDK_PROJECT_STATE_BACKEND: "rust",
  NKDK_PROFILE: "1",
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit scripts/measure-project-state-backends.test.ts`

Expected: FAIL — модуль и экспортируемые функции отсутствуют.

- [ ] **Step 3: Реализовать минимальный runner без Rust-зависимости**

Один дочерний процесс должен запускать ровно один вариант, возвращать JSON и собирать по каждому прогону:

```ts
interface ProjectStateBackendRun {
  backend: "typescript" | "rust"
  run: number
  elapsedMs: number
  cpuUserMicros: number
  cpuSystemMicros: number
  rssPeakBytes: number
  heapUsedPeakBytes: number
  externalPeakBytes: number
  arrayBuffersPeakBytes: number
  snapshotBytes: number
  diagnosticsDigest: string
}
```

До появления Rust реализация должна позволять запуск `--backends typescript` и выдавать ошибку `RUST_BACKEND_UNAVAILABLE` для явного `rust`, а не тихо продолжать на TypeScript.

- [ ] **Step 4: Запустить целевые тесты и TypeScript-замер на штатном e2e-проекте**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit scripts/measure-project-state-backends.test.ts
pnpm --filter @nkdk/rules measure:project-state-backends -- e2e/fixtures/nkdk --runs 1 --backends typescript
```

Expected: тест PASS; JSON содержит один TypeScript-прогон и непустой digest.

- [ ] **Step 5: Подготовить внешний большой YAML-проект без изменения источника XML**

Создать отдельный временный каталог через `mktemp -d`, внутри него каталог `yaml`, затем выполнить один import:

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/sed_xml/cf \
  <temporary-dir>/yaml \
  --runs 1 \
  --concurrency 4 \
  --json
```

Expected: исходный `/Users/nikita/git/sed_xml/cf` остаётся неизменным; временный YAML-проект содержит `project-state.bin`. Сохранить только команду и сводные числа в локальном отчёте, не коммитить YAML или отчёт.

- [ ] **Step 6: Зафиксировать исходный TypeScript baseline**

Run: `pnpm --filter @nkdk/rules measure:project-state-backends -- <temporary-project-dir> --runs 5 --concurrency 4 --backends typescript`

Expected: пять успешных прогонов, одинаковый `diagnosticsDigest`, зафиксированы медиана времени и максимальная RSS.

- [ ] **Step 7: Проверить дубли и создать коммит**

```bash
pnpm duplicates -- --base e53cb778b
git add packages/rules/scripts packages/rules/package.json
git commit -m "perf: :zap: добавить baseline ProjectState"
```

---

### Task 2: Проверить осуществимость `napi-rs` и прямой работы с SharedArrayBuffer

**Files:**
- Create: `packages/project-state-native/package.json`
- Create: `packages/project-state-native/Cargo.toml`
- Create: `packages/project-state-native/Cargo.lock`
- Create: `packages/project-state-native/rust-toolchain.toml`
- Create: `packages/project-state-native/build.rs`
- Create: `packages/project-state-native/src/lib.rs`
- Create: `packages/project-state-native/index.js`
- Create: `packages/project-state-native/index.d.ts`
- Create: `packages/project-state-native/tests/shared-buffer.test.ts`
- Create: `packages/project-state-native/tests/shared-buffer-worker.mjs`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: Node.js `Uint8Array<SharedArrayBuffer>`.
- Produces: `probeSharedBuffer(bytes: Uint8Array): { byteLength: number; first: number }` и `fillSharedBuffer(bytes: Uint8Array, value: number): void`.

- [ ] **Step 1: Установить актуальный stable toolchain после пользовательского разрешения**

В окружении сейчас отсутствуют `rustc` и `cargo`. Установить `rustup`, затем строго выбранный toolchain:

```bash
rustup toolchain install 1.97.1 --profile minimal --component rustfmt --component clippy
rustup default 1.97.1
rustc --version
cargo --version
```

Expected: `rustc 1.97.1`; установка выполняется только после отдельного разрешения, так как пишет вне worktree и скачивает файлы.

- [ ] **Step 2: Создать тест, который сначала не может загрузить дополнение**

```ts
it("читает и изменяет SharedArrayBuffer без замены backing store", () => {
  const shared = new SharedArrayBuffer(8)
  const bytes = new Uint8Array(shared)
  bytes[0] = 7
  expect(probeSharedBuffer(bytes)).toEqual({ byteLength: 8, first: 7 })
  fillSharedBuffer(bytes, 0x2a)
  expect(bytes).toEqual(new Uint8Array(8).fill(0x2a))
  expect(bytes.buffer).toBe(shared)
})
```

- [ ] **Step 3: Запустить тест и подтвердить ожидаемое падение загрузки**

Run: `pnpm --filter @nkdk/project-state-native test`

Expected: FAIL — `.node` ещё не собран или функции не экспортированы.

- [ ] **Step 4: Добавить воспроизводимую сборку napi-rs**

`Cargo.toml` должен содержать точные версии:

```toml
[package]
name = "nkdk_project_state_native"
version = "0.0.0"
edition = "2024"
rust-version = "1.97.1"

[lib]
crate-type = ["cdylib"]

[dependencies]
napi = { version = "=3.12.1", default-features = false, features = ["napi8"] }
napi-derive = "=3.6.3"
thiserror = "=2.0.20"

[build-dependencies]
napi-build = "=2.4.1"
```

`napi 3.12.1` требует `napi-build ^2.4.0`, поэтому используется совместимая актуальная
версия `2.4.1`. `package.json` закрепляет `@napi-rs/cli` ровно `3.8.6` и команды
`build`, `test`, `type-check`.

- [ ] **Step 5: Реализовать только две пробные функции и собрать дополнение**

```rust
#[napi]
pub fn probe_shared_buffer(bytes: Uint8Array) -> ProbeResult { /* длина и первый байт */ }

#[napi]
pub fn fill_shared_buffer(mut bytes: Uint8Array, value: u8) {
    bytes.as_mut().fill(value);
}
```

Run: `pnpm --filter @nkdk/project-state-native build`

Expected: создан локальный `nkdk_project_state_native.darwin-arm64.node`.

- [ ] **Step 6: Проверить основной поток и worker_threads**

Run: `pnpm --filter @nkdk/project-state-native test`

Expected: основной тест и отдельный worker читают и изменяют один `SharedArrayBuffer`; backing store не заменяется. Если `Uint8Array<SharedArrayBuffer>` копируется или отклоняется, остановить реализацию прямой записи и зафиксировать результат до выбора запасного варианта из проекта.

- [ ] **Step 7: Проверить Rust-код и создать коммит**

```bash
pnpm --filter @nkdk/project-state-native exec cargo fmt --check
pnpm --filter @nkdk/project-state-native exec cargo clippy --all-targets -- -D warnings
pnpm duplicates -- --base e53cb778b
git add packages/project-state-native pnpm-lock.yaml
git commit -m "feat: :sparkles: добавить napi-rs границу ProjectState"
```

---

### Task 3: Открыть существующий снимок Rust-reader и реализовать первые запросы

**Files:**
- Create: `packages/project-state-native/src/buffers.rs`
- Create: `packages/project-state-native/src/format.rs`
- Create: `packages/project-state-native/src/reader.rs`
- Create: `packages/project-state-native/src/query_protocol.rs`
- Create: `packages/project-state-native/src/queries/mod.rs`
- Create: `packages/project-state-native/src/queries/baseline.rs`
- Create: `packages/project-state-native/src/queries/targets.rs`
- Create: `packages/project-state-native/tests/reader.test.ts`
- Modify: `packages/project-state-native/src/lib.rs`
- Modify: `packages/project-state-native/index.d.ts`
- Create: `packages/rules/metadata/projectState/rust/protocol.ts`
- Test: `packages/rules/metadata/projectState/rust/protocol.test.ts`

**Interfaces:**
- Consumes: текущие шесть `ProjectStateSharedBuffers` формата `0.5.0`.
- Produces: `openProjectStateReader(sections): NativeProjectStateReader`; операции `READ_FILE_BASELINE`, `COMPARE_FILES`, `RESOLVE_TARGETS`.

- [ ] **Step 1: Добавить эталонные тесты заголовка, строк и сортировки**

Построить небольшой снимок текущим `buildProjectStateSnapshot`, передать секции Rust и проверить:

```ts
expect(reader.stats()).toMatchObject({
  format: "0.5.0",
  files: 3,
  copiedSnapshotBytes: 0,
})
expect(decodeBaseline(reader.execute(READ_FILE_BASELINE, request))).toEqual(tsBaseline)
expect(decodeTargets(reader.execute(RESOLVE_TARGETS, requests))).toEqual(tsTargets)
```

Добавить строки `Я`, `ё`, `e\u0301`, `😀`, `\u{10437}` и проверить тот же порядок, который фактически создаёт TypeScript.

- [ ] **Step 2: Запустить тесты и подтвердить падение на отсутствующем reader**

Run: `pnpm --filter @nkdk/project-state-native test`

Expected: FAIL — `openProjectStateReader` отсутствует.

- [ ] **Step 3: Реализовать безопасный декодер формата 0.5.0**

`format.rs` проверяет magic, точную версию, число и порядок секций, смещения, длины, умножения без переполнения и `NONE = 0xffff_ffff`. Все обращения к байтам выполняются после проверки диапазона; `unsafe` не используется без отдельного обоснования и теста.

- [ ] **Step 4: Реализовать reader без полной копии индексов**

Reader удерживает ссылки Node-API на секции, выполняет двоичный поиск файлов и существующий поиск по хэш-таблицам непосредственно в буферах. Разрешается ограниченный кэш декодированных строк; `stats()` обязан показывать его размер.

- [ ] **Step 5: Реализовать версионированный пакетный протокол первых запросов**

Заголовок запроса:

```ts
interface QueryEnvelopeV1 {
  magic: 0x51534b4e
  abiMajor: 1
  abiMinor: 0
  operation: number
  requestCount: number
  rowsOffset: number
  stringsOffset: number
}
```

Не использовать JSON. Неизвестная операция возвращает ошибку с кодом `PROJECT_STATE_UNKNOWN_OPERATION`; повреждённый пакет — `PROJECT_STATE_INVALID_QUERY`.

- [ ] **Step 6: Выполнить дифференциальные тесты TypeScript ↔ Rust**

Run:

```bash
pnpm --filter @nkdk/project-state-native test
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/projectState/rust/protocol.test.ts
```

Expected: одинаковые baseline/compare/targets, включая `found`, `missing`, `ambiguous` и file-backed пути.

- [ ] **Step 7: Проверить повреждённые входы и panic boundary**

Добавить таблицу случаев: короткий заголовок, неправильная версия, пересечение секций, переполнение числа записей, неправильная ёмкость hash index. Каждый случай возвращает ожидаемый код ошибки и не завершает Node.js процесс.

- [ ] **Step 8: Проверить дубли и создать коммит**

```bash
pnpm --filter @nkdk/project-state-native exec cargo fmt --check
pnpm --filter @nkdk/project-state-native exec cargo clippy --all-targets -- -D warnings
pnpm duplicates -- --base e53cb778b
git add packages/project-state-native packages/rules/metadata/projectState/rust
git commit -m "feat: :sparkles: читать ProjectState в Rust"
```

---

### Task 4: Подключить выбираемый Rust-reader в composition и worker

**Files:**
- Create: `packages/rules/metadata/projectState/backend.ts`
- Create: `packages/rules/metadata/projectState/rust/addon.ts`
- Create: `packages/rules/metadata/projectState/rust/readSession.ts`
- Create: `packages/rules/metadata/projectState/rust/backend.ts`
- Create: `packages/rules/metadata/composition/projectStateBackend.ts`
- Test: `packages/rules/metadata/composition/projectStateBackend.test.ts`
- Test: `packages/rules/metadata/projectState/rust/readSession.test.ts`
- Modify: `packages/rules/metadata/composition/projectState.ts`
- Modify: `packages/rules/metadata/composition/workers/generic.ts`
- Modify: `packages/rules/metadata/workerPool/workerState.ts`
- Modify: `packages/rules/package.json`
- Modify: `packages/rules/scripts/build.mjs`
- Modify: `packages/mcp/package.json`
- Modify: `packages/mcp/scripts/build.mjs`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `openProjectStateReader`, текущий `ProjectStateReadToken` и `ProjectStateDependencyValidator`.
- Produces: `createProjectStateBackend("typescript" | "rust")` и переменную `NKDK_PROJECT_STATE_BACKEND` только в composition.

```ts
export interface OpenProjectStateStoreParams {
  readonly projectDir: string
  readonly initial?: ProjectStateSharedBuffers
  readonly dependencyValidator: ProjectStateDependencyValidator
}
```

- [ ] **Step 1: Добавить падающие тесты выбора реализации**

```ts
expect(resolveProjectStateBackend({ NKDK_PROJECT_STATE_BACKEND: undefined })).toBe("typescript")
expect(resolveProjectStateBackend({ NKDK_PROJECT_STATE_BACKEND: "rust" })).toBe("rust")
expect(() => resolveProjectStateBackend({ NKDK_PROJECT_STATE_BACKEND: "other" }))
  .toThrow(/typescript.*rust/u)
```

Явный `rust` при отсутствии дополнения должен бросать `RUST_BACKEND_UNAVAILABLE`; только новый режим `auto`, если он действительно понадобится, может выбрать TypeScript до открытия store.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/composition/projectStateBackend.test.ts`

Expected: FAIL — фабрика отсутствует.

- [ ] **Step 3: Ввести нейтральный внутренний интерфейс**

```ts
export interface ProjectStateBackend {
  readonly kind: "typescript" | "rust"
  openStore(params: OpenProjectStateStoreParams): Promise<ProjectStateStore>
  openReadSession(
    token: ProjectStateReadToken,
    dependencyValidator: ProjectStateDependencyValidator,
  ): ProjectStateReadSession
}
```

Не добавлять backend-поле в общие правила, metadata contracts или `ProjectStateReadToken`.

- [ ] **Step 4: Реализовать Rust read session для первых трёх операций**

`readFileBaseline` и `compareFiles` используются store-адаптером; `resolveTargets` используется QueryPort. Остальные методы временно делегируются текущему TypeScript-reader над теми же буферами. Делегирование должно быть явным в адаптере и покрыто тестом, а не происходить после native-ошибки.

- [ ] **Step 5: Внедрить одну и ту же фабрику в main и generic worker**

`metadata/composition/projectState.ts` выбирает backend один раз при создании runtime. `metadata/composition/workers/generic.ts` создаёт persistent state с той же конфигурацией окружения. `workerState.ts` получает `openReadSession` как зависимость и больше не выбирает реализацию самостоятельно.

- [ ] **Step 6: Сделать native package внешней runtime-зависимостью сборки**

Добавить `@nkdk/project-state-native` в workspace dependencies и в `external` обеих esbuild-сборок. Локальный compiled MCP должен разрешать `.node` через workspace `node_modules`; публикацию platform packages не добавлять.

- [ ] **Step 7: Проверить source и compiled worker**

Run:

```bash
NKDK_PROJECT_STATE_BACKEND=typescript pnpm --filter @nkdk/rules test
NKDK_PROJECT_STATE_BACKEND=rust pnpm --filter @nkdk/rules exec vitest run --project integration metadata/projectState/service.test.ts
pnpm --filter @nkdk/mcp build
```

Expected: TypeScript остаётся default; Rust явно загружается в main и worker; отсутствующий addon не маскируется.

- [ ] **Step 8: Проверить архитектуру, дубли и создать коммит**

```bash
pnpm test:architecture
pnpm duplicates -- --base e53cb778b
git add packages/rules packages/mcp packages/project-state-native pnpm-lock.yaml
git commit -m "feat: :sparkles: выбирать Rust ProjectState"
```

---

### Task 5: Построить побайтово совместимый снимок в Rust

**Files:**
- Create: `packages/project-state-native/src/fragment.rs`
- Create: `packages/project-state-native/src/snapshot_plan.rs`
- Create: `packages/project-state-native/src/snapshot_writer.rs`
- Create: `packages/project-state-native/src/string_pool.rs`
- Create: `packages/project-state-native/src/fact_tables.rs`
- Create: `packages/project-state-native/src/lookups.rs`
- Create: `packages/project-state-native/src/value_codec.rs`
- Create: `packages/project-state-native/tests/snapshot-plan.test.ts`
- Modify: `packages/project-state-native/src/lib.rs`
- Modify: `packages/project-state-native/index.d.ts`
- Create: `packages/rules/metadata/projectState/rust/store.ts`
- Test: `packages/rules/metadata/projectState/rust/store.test.ts`
- Modify: `packages/rules/metadata/projectState/rust/backend.ts`

**Interfaces:**
- Consumes: base `ProjectStateSharedBuffers`, `ProjectStateFragment[]`, deletions, component clears и unseen bitset.
- Produces: `planProjectStateSnapshot(input): NativeSnapshotPlan`, `layout()`, `writeInto(output)`, `close()` и полный Rust `ProjectStateStore` adapter.

```ts
export interface ProjectStateSectionSizes {
  readonly header: number
  readonly strings: number
  readonly files: number
  readonly facts: number
  readonly lookups: number
  readonly diagnostics: number
}

export interface NativeSnapshotInput {
  readonly base?: ProjectStateSharedBuffers
  readonly fragments: readonly ProjectStateFragmentBuffers[]
  readonly deletedProjectPaths: Uint8Array
  readonly clearedComponentPaths: Uint8Array
  readonly unseenFileIds?: Uint8Array
}

export interface NativeSnapshotStats {
  readonly files: number
  readonly strings: number
  readonly temporaryBytes: bigint
  readonly readerCacheBytes: bigint
  readonly planMs: number
  readonly writeMs: number
}

export interface NativeSnapshotPlan {
  layout(): ProjectStateSectionSizes
  writeInto(output: ProjectStateSharedBuffers): NativeSnapshotStats
  close(): void
}
```

- [ ] **Step 1: Запустить существующий store contract против пустой Rust-фабрики**

Добавить второй вызов общего договора:

```ts
describe("Rust ProjectStateStore", () => {
  runProjectStateStoreContract(() => createRustProjectStateTestFixture())
})
```

Run: `pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/projectState/rust/store.test.ts`

Expected: FAIL на первой операции построения.

- [ ] **Step 2: Реализовать проверку и чтение пяти секций fragment**

Повторить текущие magic/version/range checks из `binary/fragment.ts`. Rust не получает `ProjectStateFileUpdate` в виде JS-объектов; входом служат только существующие ArrayBuffer-секции.

- [ ] **Step 3: Реализовать семантику транзакции в TypeScript-адаптере**

Адаптер хранит `published`, список fragment и deletions; `beginUpdate` запрещает вложенную транзакцию, `rollback` освобождает plan, `commit` публикует только полностью записанный и повторно открытый reader-ом снимок.

- [ ] **Step 4: Реализовать сначала строки и файлы**

Портировать детерминированную дедупликацию строк, file identity, каскадное удаление и сортировку файлов. Проверить побайтовое совпадение `header`, `strings`, `files` на testData и Unicode corpus.

- [ ] **Step 5: Реализовать typed fact tables и diagnostics**

Портировать таблицы в порядке `PROJECT_STATE_FACT_TABLE_ORDER`, точные размеры записей, `valueCodec`, constraint codec и диагностические диапазоны. Для каждого вида таблицы использовать уже существующие `richYamlUpdate`/`testData`, не создавать копии XML-фикстур.

- [ ] **Step 6: Реализовать target/owner lookups и хэш-таблицы**

Повторить XXH64/XXH3, capacity/load factor, probing, диапазоны и `NONE`. До использования стороннего Rust xxhash-пакета добавить эталонные векторы, полученные существующим `@node-rs/xxhash`, затем закрепить точную версию crate в `Cargo.lock`.

- [ ] **Step 7: Реализовать двухстадийную прямую запись в SAB**

`layout()` возвращает точные шесть размеров. TypeScript выделяет `SharedArrayBuffer`; `writeInto()` один раз заполняет их. `NativeSnapshotStats` возвращает `temporaryBytes`, `readerCacheBytes`, counts и длительность стадий. После `writeInto` повторный вызов даёт `PROJECT_STATE_PLAN_CONSUMED`.

- [ ] **Step 8: Довести весь `runProjectStateStoreContract` до зелёного**

Run:

```bash
pnpm --filter @nkdk/project-state-native test
pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/projectState/rust/store.test.ts
```

Expected: весь общий contract проходит для обеих реализаций; Rust-снимок читается текущим `ProjectStateSnapshotView`.

- [ ] **Step 9: Проверить побайтовую совместимость и старые tokens**

Для одинаковых fragment/deletions сравнить все шесть секций TypeScript и Rust. Отдельный тест открывает token до commit, публикует новый снимок и подтверждает, что старый session читает прежние данные.

- [ ] **Step 10: Проверить Rust, дубли и создать коммит**

```bash
pnpm --filter @nkdk/project-state-native exec cargo fmt --check
pnpm --filter @nkdk/project-state-native exec cargo clippy --all-targets -- -D warnings
pnpm duplicates -- --base e53cb778b
git add packages/project-state-native packages/rules/metadata/projectState/rust
git commit -m "feat: :sparkles: строить ProjectState в Rust"
```

---

### Task 6: Перенести все чистые запросы ProjectStateQueryPort

**Files:**
- Create: `packages/project-state-native/src/queries/owners.rs`
- Create: `packages/project-state-native/src/queries/references.rs`
- Create: `packages/project-state-native/src/queries/dependencies.rs`
- Create: `packages/project-state-native/src/queries/pages.rs`
- Create: `packages/project-state-native/src/queries/validation.rs`
- Modify: `packages/project-state-native/src/queries/mod.rs`
- Modify: `packages/project-state-native/src/query_protocol.rs`
- Modify: `packages/rules/metadata/projectState/rust/protocol.ts`
- Modify: `packages/rules/metadata/projectState/rust/readSession.ts`
- Test: `packages/rules/metadata/projectState/rust/readSession.test.ts`
- Test: `packages/rules/metadata/projectState/binary/readSession.test.ts`

**Interfaces:**
- Consumes: Rust-reader и ABI v1.
- Produces: полная реализация существующего `ProjectStateQueryPort`; `ProjectStateDependencyValidator` остаётся TypeScript-клиентом.

- [ ] **Step 1: Параметризовать существующие readSession-тесты двумя реализациями**

Не копировать весь набор. Вынести фабрику `typescript`/`rust` и применить существующие случаи к обеим. Добавить самостоятельные случаи только для ABI corruption и lifetime native-reader.

- [ ] **Step 2: Запустить Rust-вариант и сохранить список непокрытых методов**

Run: `NKDK_PROJECT_STATE_BACKEND=rust pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/projectState/binary/readSession.test.ts`

Expected: FAIL на `readOwners`, `findReferences`, dependency inputs, pages, validation status, file references и structured documents.

- [ ] **Step 3: Реализовать owners и dependency inputs пакетами**

Один переход N-API обрабатывает весь входной массив. Ответы сохраняют порядок `requestId` и статусы `found`/`missing`/`ambiguous`. Не вызывать JavaScript callback из Rust.

- [ ] **Step 4: Реализовать storage-часть поиска ссылок**

Rust сканирует сохранённые ссылки и DataPath occurrences. TypeScript после получения пачки вызывает существующий `dependencyValidator.resolveDataPaths`; предметную часть не переносить.

- [ ] **Step 5: Реализовать страницы и validation status**

Cursor остаётся непрозрачной строкой текущего договора. Reader отклоняет cursor другого поколения/компонента устойчивым кодом; размер страницы совпадает с `PAGE_SIZE = 2_000`.

- [ ] **Step 6: Реализовать file references и structured documents**

Проверить отсутствующий файл, несколько компонентов и сохранение порядка записей. Ответы большого размера проходят через один двоичный буфер, а не массив N-API объектов.

- [ ] **Step 7: Удалить временное делегирование чистых запросов TypeScript-reader**

В Rust backend допускается TypeScript только для `ProjectStateDependencyValidator` и композиции `findReferences`; storage-запросы не должны создавать параллельный `ProjectStateSnapshotView`.

- [ ] **Step 8: Запустить contract, integration и worker lifetime**

```bash
pnpm --filter @nkdk/project-state-native test
NKDK_PROJECT_STATE_BACKEND=rust pnpm --filter @nkdk/rules exec vitest run --project core-metadata metadata/projectState
NKDK_PROJECT_STATE_BACKEND=rust pnpm --filter @nkdk/rules run test:integration
```

Expected: одинаковые diagnostics и query results; несколько workers используют общие SAB, но отдельные reader handles; `close()` освобождает native cache.

- [ ] **Step 9: Проверить дубли и создать коммит**

```bash
pnpm duplicates -- --base e53cb778b
git add packages/project-state-native packages/rules/metadata/projectState
git commit -m "feat: :sparkles: выполнять запросы ProjectState в Rust"
```

---

### Task 7: Провести сравнительные измерения на большом наборе

**Files:**
- Modify: `packages/rules/scripts/measure-project-state-backend-worker.ts`
- Modify: `packages/rules/scripts/measure-project-state-backends.ts`
- Modify: `packages/rules/scripts/measure-project-state-backends.test.ts`
- Modify: `packages/rules/package.json`
- No commit: `reports/**`, временный YAML-проект и JSON результатов.

**Interfaces:**
- Consumes: полностью рабочие `typescript` и `rust` backends, внешний `/Users/nikita/git/sed_xml/cf` и созданный из него временный YAML-проект.
- Produces: машинное сравнение сценариев `load`, `full-rebuild`, `unchanged`, `one-percent`, `validation`, `export-query-mix` и итоговое решение по порогам.

- [ ] **Step 1: Добавить тест расчёта порогов**

```ts
expect(evaluateRustExperiment({
  typescript: { rssPeak: 100, targetMs: 100, unchangedMs: 100 },
  rust: { rssPeak: 75, targetMs: 80, unchangedMs: 105 },
})).toEqual({
  rssPassed: true,
  targetTimePassed: true,
  unchangedPassed: true,
  passed: true,
})
```

Границы включительны: ровно −25%, −20% и +5% проходят.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run: `pnpm --filter @nkdk/rules exec vitest run --project unit scripts/measure-project-state-backends.test.ts`

Expected: FAIL — оценка порогов отсутствует.

- [ ] **Step 3: Дополнить runner фазами и native stats**

Каждый вариант запускается отдельным процессом. Добавить прогрев и пять измерений, median, max RSS, CPU, `heapUsed`, `external`, `arrayBuffers`, размеры шести SAB, `temporaryBytes` и `readerCacheBytes`. Не включать shadow-mode в измеряемый процесс.

- [ ] **Step 4: Проверить runner на e2e**

Run: `pnpm --filter @nkdk/rules measure:project-state-backends -- e2e/fixtures/nkdk --runs 2 --concurrency 2`

Expected: digest и результаты обеих реализаций совпадают; вывод содержит оценку порогов, даже если маленький набор их не проходит.

- [ ] **Step 5: Создать свежий временный YAML-проект из большого XML**

Использовать `/Users/nikita/git/sed_xml/cf` только как `xmlDir`. Целевой YAML должен находиться в новом `mktemp -d`; перед запуском убедиться, что target пуст. Не запускать команды удаления по исходному XML-каталогу.

- [ ] **Step 6: Выполнить полный import profile отдельно для каждого backend**

Run по пять раз в отдельных процессах с одинаковой `concurrency=4`, сохраняя JSON локально. Сравнить `finalBuildMs`, `dependencyValidationMs`, полное время и RSS. Если import не помещается в согласованный лимит времени или памяти, зафиксировать сбой как результат, не уменьшать набор без отдельного решения.

- [ ] **Step 7: Выполнить validation profile**

На временном YAML-проекте выполнить cold rebuild, unchanged и 1% изменений. Для 1% использовать отдельную временную копию проекта и изменять только копию YAML; исходный XML и исходный временный baseline не менять.

- [ ] **Step 8: Выполнить export query mix**

Использовать существующий `measure-binary-project-state` с одинаковым числом запросов и workers. Сверить `found`/`missing` и digest ответов до сравнения времени.

- [ ] **Step 9: Сформировать локальную сводку решения**

Сводка должна показывать по каждому сценарию TypeScript/Rust, абсолютные значения, проценты и три флага порогов. Результаты не коммитить. Если хотя бы один correctness digest расходится, итог автоматически `passed: false` независимо от производительности.

- [ ] **Step 10: Проверить тест runner и создать коммит только кода измерения**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit scripts/measure-project-state-backends.test.ts
pnpm duplicates -- --base e53cb778b
git add packages/rules/scripts packages/rules/package.json
git commit -m "perf: :zap: сравнить реализации ProjectState"
```

---

### Task 8: Итоговая проверка и решение о продолжении

**Files:**
- Modify only if explicitly approved: `.agents/architecture.md`
- No commit: measurement reports.

**Interfaces:**
- Consumes: зелёные contract/integration tests и сводку Task 7.
- Produces: доказательное решение «продолжать Rust backend» или «оставить эксперимент выключенным».

- [ ] **Step 1: Выполнить свежую полную проверку Rust-пакета**

```bash
pnpm --filter @nkdk/project-state-native build
pnpm --filter @nkdk/project-state-native test
pnpm --filter @nkdk/project-state-native exec cargo fmt --check
pnpm --filter @nkdk/project-state-native exec cargo clippy --all-targets -- -D warnings
```

Expected: все команды exit 0.

- [ ] **Step 2: Выполнить полную проверку репозитория**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base e53cb778b
```

Expected: все функциональные проверки проходят. Если `pnpm test` падает только на ранее согласованном лимите длительности `platform`, отдельно повторить пакет трижды через профиль длительности и сообщить фактический результат; не объявлять весь набор зелёным при иных сбоях.

- [ ] **Step 3: Проверить compiled MCP в обоих режимах**

```bash
pnpm --filter @nkdk/mcp build
NKDK_PROJECT_STATE_BACKEND=typescript pnpm --filter @nkdk/mcp smoke:packed
NKDK_PROJECT_STATE_BACKEND=rust pnpm --filter @nkdk/mcp smoke:packed
```

Expected: оба режима загружаются; Rust `.node` разрешается из упакованной локальной структуры эксперимента.

- [ ] **Step 4: Сопоставить реализацию с утверждённым проектом**

Проверить каждый раздел `docs/superpowers/specs/2026-08-12-rust-project-state-experiment-design.md`: граница, lifetime, ошибки, совместимость, тесты и методика измерения. Любое расхождение перечислить пользователю; не исправлять `.agents/architecture.md` самостоятельно.

- [ ] **Step 5: Принять решение по числам**

- Если correctness совпадает и все три порога выполнены — предложить следующий отдельный план промышленных сборок и возможного переноса dependency validation.
- Если пороги не выполнены — оставить `typescript` значением по умолчанию, Rust только явным экспериментом и не расширять перенос.
- Если прямой SAB оказался невозможен — явно отделить результат с копированием и не засчитывать его как подтверждение целевого расхода памяти.

- [ ] **Step 6: Запросить разрешение на актуализацию архитектурного документа при необходимости**

Если Rust backend останется в кодовой базе после опыта, показать пользователю предлагаемое изменение `.agents/architecture.md` и получить явное согласование до редактирования. Если эксперимент удаляется или остаётся только в ветке, архитектурный документ не менять.

- [ ] **Step 7: Создать финальный коммит только при наличии проверенных изменений после предыдущих задач**

Сообщение формируется навыком `commit`. Не создавать пустой коммит; не включать отчёты, временный YAML или внешний XML.
