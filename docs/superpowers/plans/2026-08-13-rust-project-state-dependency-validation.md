# Rust ProjectState Dependency Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести универсальный пакетный обход проверки зависимостей ProjectState в Rust, ограничить объём одновременно раскрытых TypeScript-проверок и измерить время и RSS.

**Architecture:** `NativeProjectStateReader` выдаёт страницы готовых двоичных диагностик и компактных идентификаторов отложенных строк. TypeScript обрабатывает только текущую страницу подключаемых правил и возвращает несколько `DiagnosticBatchView` без объединения буферов.

**Tech Stack:** Rust 1.97.1, napi-rs 3.12.1, TypeScript 7, Vitest 4, SharedArrayBuffer, существующий формат `EncodedDiagnosticBatch` v1.

## Global Constraints

- Публичные интерфейсы `ProjectStateStore`, `ProjectStateDependencyValidator` и формат `project-state.bin` не меняются.
- Выбор реализации выполняется до проверки; скрытый переход на TypeScript после первого native-вызова запрещён.
- Размер страницы по умолчанию равен 2 000 проверок.
- Состав, порядок и все поля диагностик TypeScript/Rust должны совпадать.
- Порог успеха: не менее 20% по времени `dependencyValidation` и пиковому RSS на `/Users/nikita/git/sed_xml/cf`; регрессия малого проекта не более 5%.
- Существующие XML-фикстуры не изменяются.
- Реализация выполняется без субагентов по явному требованию пользователя.

---

### Task 1: Двоичный формат native-диагностик

**Files:**
- Create: `packages/project-state-native/src/diagnostic_batch.rs`
- Modify: `packages/project-state-native/src/lib.rs`
- Test: `packages/project-state-native/tests/dependency-validation.test.ts`
- Modify: `packages/project-state-native/index.d.ts`

**Interfaces:**
- Consumes: поля `MetadataDiagnostic` и формат `EncodedDiagnosticBatch` v1 из `packages/runtime/metadata/diagnostics/binaryBatch.ts`.
- Produces: `DiagnosticBatchWriter::push(DiagnosticRecord)` и `DiagnosticBatchWriter::finish() -> Result<Vec<u8>>`.

- [ ] **Step 1: Write the failing compatibility test**

Добавить тест, который получает пачку из Rust и открывает её существующим `openDiagnosticBatch`:

```ts
const batch = nativeTestDiagnosticBatch()
const view = openDiagnosticBatch({ bytes: batch })
expect(Array.from({ length: view.count }, (_, index) => view.diagnostic(index))).toEqual([
  {
    filePath: "/project/cf/Конфигурация.yaml",
    line: 1,
    col: 1,
    severity: "error",
    source: "structure",
    message: "Базовая конфигурация cf не найдена",
  },
])
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @nkdk/project-state-native test -- dependency-validation.test.ts`

Expected: FAIL because `nativeTestDiagnosticBatch` is not exported.

- [ ] **Step 3: Implement the exact v1 writer**

Создать структуры:

```rust
pub struct DiagnosticRecord<'a> {
    pub file_path: &'a str,
    pub line: u32,
    pub col: u32,
    pub message: &'a str,
    pub path: Option<&'a str>,
    pub severity: u8,
    pub source: u8,
}

pub struct DiagnosticBatchWriter {
    rows: Vec<OwnedDiagnosticRecord>,
    strings: Vec<String>,
    string_ids: HashMap<String, u32>,
    file_ids: HashMap<String, u32>,
}
```

Повторить magic `0x4444_4b4e`, версию `1`, 32-байтный header, 24-байтную запись и таблицы `code/value` из runtime. Экспортировать только тестовую фабрику с одной диагностикой; production API появится в Task 2.

- [ ] **Step 4: Run Rust and compatibility tests**

Run: `cargo test --manifest-path packages/project-state-native/Cargo.toml && pnpm --filter @nkdk/project-state-native test -- dependency-validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/project-state-native/src/diagnostic_batch.rs packages/project-state-native/src/lib.rs packages/project-state-native/index.d.ts packages/project-state-native/tests/dependency-validation.test.ts
git commit -m "feat: :sparkles: кодировать диагностики ProjectState в Rust"
```

### Task 2: Страница native-проверки и готовность компонентов

**Files:**
- Create: `packages/project-state-native/src/dependency_validation.rs`
- Modify: `packages/project-state-native/src/reader.rs`
- Modify: `packages/project-state-native/src/format.rs`
- Modify: `packages/project-state-native/src/lib.rs`
- Modify: `packages/project-state-native/index.d.ts`
- Test: `packages/project-state-native/tests/dependency-validation.test.ts`

**Interfaces:**
- Consumes: `SnapshotLayout`, `ProjectStateSections`, `DiagnosticBatchWriter`.
- Produces: `NativeProjectStateReader.validateDependencyPage(input): NativeDependencyValidationPage`.

- [ ] **Step 1: Add failing readiness tests**

Проверить два снимка: без `cf` и с неготовой базовой конфигурацией плюс `cfe/demo`. Ожидать те же диагностики и те же заблокированные файлы, что возвращает TypeScript `readProjectStateDependencyReadiness`.

```ts
const page = reader.validateDependencyPage({ projectDir: "/project", cursor: 0, batchSize: 2_000 })
expect(decodeDiagnostics(page.diagnostics)).toEqual(expectedReadinessDiagnostics)
expect(decodeDeferred(page.deferred).every((row) => row.fileId !== extensionFileId)).toBe(true)
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @nkdk/project-state-native test -- dependency-validation.test.ts`

Expected: FAIL because `validateDependencyPage` does not exist.

- [ ] **Step 3: Expose checked fact-table access**

В `SnapshotLayout` добавить внутренние методы:

```rust
pub(crate) fn fact_table(&self, facts: &[u8], kind: u16) -> Result<Option<FactTableRange>>;
pub(crate) fn file_component_path<'a>(&self, sections: &'a ProjectStateSections, file_id: usize) -> Result<&'a str>;
pub(crate) fn file_project_path<'a>(&self, sections: &'a ProjectStateSections, file_id: usize) -> Result<&'a str>;
```

Каждый метод проверяет сложение, умножение, границы и размер записи до создания диапазона.

- [ ] **Step 4: Implement readiness and page envelope**

Добавить N-API-типы:

```rust
#[napi(object)]
pub struct DependencyValidationPageInput {
    pub project_dir: String,
    pub cursor: u32,
    pub batch_size: u32,
}

#[napi(object)]
pub struct NativeDependencyValidationPage {
    pub diagnostics: Uint8Array,
    pub deferred: Uint8Array,
    pub next_cursor: Option<u32>,
    pub stats: NativeDependencyValidationStats,
}
```

На `cursor == 0` вычислить готовность `cf`, исключить заблокированные `cfe/*` и записать деградационные диагностики. Нулевой `batchSize`, курсор за концом и закрытый reader должны вернуть typed `Error`.

- [ ] **Step 5: Run targeted tests**

Run: `cargo test --manifest-path packages/project-state-native/Cargo.toml && pnpm --filter @nkdk/project-state-native test -- dependency-validation.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/project-state-native/src/dependency_validation.rs packages/project-state-native/src/reader.rs packages/project-state-native/src/format.rs packages/project-state-native/src/lib.rs packages/project-state-native/index.d.ts packages/project-state-native/tests/dependency-validation.test.ts
git commit -m "feat: :sparkles: планировать проверку зависимостей в Rust"
```

### Task 3: Версионированный формат отложенных строк

**Files:**
- Create: `packages/rules/metadata/projectState/rust/dependencyProtocol.ts`
- Test: `packages/rules/metadata/projectState/rust/dependencyProtocol.test.ts`
- Modify: `packages/project-state-native/src/dependency_validation.rs`
- Test: `packages/project-state-native/tests/dependency-validation.test.ts`

**Interfaces:**
- Consumes: native `deferred: Uint8Array`.
- Produces: `decodeRustDeferredValidationPage(bytes): readonly RustDeferredValidationRow[]`.

- [ ] **Step 1: Write failing decoder tests**

Закрепить header и строки:

```ts
interface RustDeferredValidationRow {
  readonly kind: "pendingReference" | "pendingCheck" | "structuredDocument"
  readonly fileId: number
  readonly rowId: number
}

expect(decodeRustDeferredValidationPage(encoded)).toEqual([
  { kind: "pendingReference", fileId: 3, rowId: 7 },
])
```

Проверить неверные magic/version, оборванную строку, неизвестный kind и лишние байты.

- [ ] **Step 2: Run decoder tests and verify RED**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/dependencyProtocol.test.ts`

Expected: FAIL because the decoder is missing.

- [ ] **Step 3: Implement protocol in TypeScript and Rust**

Формат:

```text
header: magic u32 = 0x56444b4e, major u16 = 1, minor u16 = 0,
        count u32, rowsOffset u32, byteLength u32
row:    kind u16, reserved u16, fileId u32, rowId u32
```

Rust записывает строки только для незаблокированных YAML-файлов в детерминированном порядке: fileId, затем `pendingReferences`, `pendingChecks`, `structuredDocuments`, затем rowId.

- [ ] **Step 4: Run protocol and native tests**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/dependencyProtocol.test.ts && pnpm --filter @nkdk/project-state-native test -- dependency-validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/projectState/rust/dependencyProtocol.ts packages/rules/metadata/projectState/rust/dependencyProtocol.test.ts packages/project-state-native/src/dependency_validation.rs packages/project-state-native/tests/dependency-validation.test.ts
git commit -m "feat: :sparkles: передавать отложенные проверки из Rust"
```

### Task 4: Постраничная TypeScript-обработка без общего массива

**Files:**
- Modify: `packages/rules/metadata/projectState/binary/typedReader.ts`
- Modify: `packages/rules/metadata/projectState/binary/diagnosticBatches.ts`
- Create: `packages/rules/metadata/projectState/rust/dependencyValidation.ts`
- Test: `packages/rules/metadata/projectState/rust/dependencyValidation.test.ts`

**Interfaces:**
- Consumes: `RustDeferredValidationRow[]`, `ProjectStateSnapshotView`, `ProjectStateDependencyValidator`.
- Produces: `validateRustDependencyDiagnosticBatches(params): readonly EncodedDiagnosticBatch[]`.

- [ ] **Step 1: Write a failing bounded-memory behavior test**

Создать снимок с пятью проверками и native-страницами по две строки. Внедрить счётчик раскрытых строк и проверить порядок вызовов:

```ts
expect(maximumRowsDecodedAtOnce).toBe(2)
expect(diagnostics).toEqual(validateSnapshotDependencyDiagnostics(snapshot, "/project", validator))
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/dependencyValidation.test.ts`

Expected: FAIL because `validateRustDependencyDiagnosticBatches` is missing.

- [ ] **Step 3: Add row-level typed reader methods**

Добавить внутренние методы без изменения публичных контрактов:

```ts
pendingReferenceRow(rowId: number): { readonly fileId: number; readonly value: ProjectStatePendingMetadataTargetReference }
pendingCheckRow(rowId: number): { readonly fileId: number; readonly value: ProjectStatePendingDependencyCheck }
structuredDocumentRow(rowId: number): { readonly fileId: number; readonly value: ProjectStateStructuredDocumentEntry }
```

Они используют существующие декодеры строк и проверяют соответствие `sourceFileId` идентификатору из native-страницы.

- [ ] **Step 4: Implement page orchestration**

Для каждой страницы:

```ts
const page = native.validateDependencyPage({ projectDir, cursor, batchSize: 2_000 })
batches.push({ bytes: page.diagnostics })
const deferred = decodeRustDeferredValidationPage(page.deferred)
batches.push(validateDeferredPage(snapshot, typedReader, deferred, projectDir, dependencyValidator))
cursor = page.nextCursor
```

`validateDeferredPage` группирует только текущую страницу в существующие категории и вызывает validator через Rust query port, который переиспользует `native.execute` для `resolveTargets`. Пачки накапливаются отдельно по категориям и возвращаются в прежнем порядке: references, owners, dependencies, addressable required, structured documents, readiness. `seenOwners` сохраняется между страницами. Structured-document row IDs накапливаются компактно и раскрываются один раз после последней страницы, потому что подключаемый validator получает весь набор facts. Пустые пачки не добавляются. Ошибка native после первой страницы пробрасывается без fallback.

- [ ] **Step 5: Run focused and contract tests**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/dependencyValidation.test.ts metadata/projectState/binary/readSession.test.ts`

Expected: PASS.

- [ ] **Step 6: Run duplicate check and commit**

Run: `pnpm duplicates -- --base 316aeea26`

```bash
git add packages/rules/metadata/projectState/binary/typedReader.ts packages/rules/metadata/projectState/binary/diagnosticBatches.ts packages/rules/metadata/projectState/rust/dependencyValidation.ts packages/rules/metadata/projectState/rust/dependencyValidation.test.ts
git commit -m "perf: :zap: обрабатывать зависимости ProjectState страницами"
```

### Task 5: Подключение Rust store и дифференциальная проверка

**Files:**
- Modify: `packages/rules/metadata/projectState/rust/store.ts`
- Modify: `packages/rules/metadata/projectState/rust/store.test.ts`
- Modify: `packages/rules/metadata/projectState/contracts.test.ts`

**Interfaces:**
- Consumes: `validateRustDependencyDiagnosticBatches`.
- Produces: Rust-реализация `ProjectStateStore.validateDependencyDiagnosticBatches`.

- [ ] **Step 1: Add failing store parity tests**

Параметризовать сценарии:

```ts
for (const pageSize of [1, 2_000, 100_000]) {
  expect(readAllDiagnostics(rustStore, pageSize)).toEqual(readAllDiagnostics(tsStore))
}
```

Включить готовую `cf`, заблокированное расширение, reference, addressableRequired, DataPath, fill value и structured document validator.

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/store.test.ts metadata/projectState/contracts.test.ts`

Expected: FAIL because Rust store still inherits TypeScript batch validation.

- [ ] **Step 3: Wire the Rust implementation**

В `createRustProjectStateStore` переопределить только метод пачек:

```ts
return {
  ...store,
  validateDependencyDiagnosticBatches() {
    return withReader(store, ({ native, snapshot }) =>
      validateRustDependencyDiagnosticBatches({
        native,
        snapshot,
        projectDir: params.projectDir ?? "",
        dependencyValidator: params.dependencyValidator,
      }).map(openDiagnosticBatch))
  },
}
```

Не менять `validateDependencies`: он остаётся эталонным TypeScript-путём для тестов.

- [ ] **Step 4: Run contracts and type-check**

Run: `pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/store.test.ts metadata/projectState/contracts.test.ts && pnpm --filter @nkdk/rules type-check`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/rules/metadata/projectState/rust/store.ts packages/rules/metadata/projectState/rust/store.test.ts packages/rules/metadata/projectState/contracts.test.ts
git commit -m "feat: :sparkles: проверять зависимости через Rust backend"
```

### Task 6: Изолированный сравнительный замер

**Files:**
- Create: `packages/rules/scripts/measure-project-state-validation-backends.ts`
- Create: `packages/rules/scripts/measure-project-state-validation-worker.ts`
- Create: `packages/rules/scripts/measure-project-state-validation-backends.test.ts`
- Modify: `packages/rules/package.json`

**Interfaces:**
- Consumes: готовый `project-state.bin`, backend `typescript | rust`.
- Produces: JSON с `elapsedMs`, CPU, `rssPeakBytes`, `diagnosticsDigest`, `diagnostics`, `nativeDiagnostics`, `deferredChecks`.

- [ ] **Step 1: Write failing argument and aggregation tests**

Закрепить `--runs`, `--backends`, `--page-size`, медиану и ошибку при несовпадении digest:

```ts
expect(parseValidationMeasureArgs([project, "--runs", "5", "--backends", "typescript,rust"]))
  .toMatchObject({ runs: 5, backends: ["typescript", "rust"], pageSize: 2_000 })
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `pnpm --filter @nkdk/rules exec vitest run scripts/measure-project-state-validation-backends.test.ts`

Expected: FAIL because the measurement module is missing.

- [ ] **Step 3: Implement separate-process measurement**

Каждый worker загружает снимок, создаёт один store, выполняет одну проверку и опрашивает `process.memoryUsage().rss` каждые 10 ms. Диагностики хэшируются в стабильном порядке; полный массив не включается в JSON.

- [ ] **Step 4: Run measurement tests and both backends**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run scripts/measure-project-state-validation-backends.test.ts
pnpm --filter @nkdk/rules measure:project-state-validation-backends /private/tmp/nkdk-rust-query-project --runs 5 --backends typescript,rust
```

Expected: tests PASS; оба backend возвращают одинаковые count/digest.

- [ ] **Step 5: Measure the larger fixture**

Подготовить временную копию `/Users/nikita/git/sed_xml/cf` без `.nkdk`, построить снимок штатным production-путём и выполнить пять отдельных прогонов каждого backend. Не изменять пользовательский каталог.

Expected: отчёт содержит медианы времени/RSS и показывает, достигнут ли порог 20%.

- [ ] **Step 6: Commit**

```bash
git add packages/rules/scripts/measure-project-state-validation-backends.ts packages/rules/scripts/measure-project-state-validation-worker.ts packages/rules/scripts/measure-project-state-validation-backends.test.ts packages/rules/package.json
git commit -m "perf: :zap: измерять проверку зависимостей ProjectState"
```

### Task 7: Полная проверка результата

**Files:**
- Modify only if verification exposes a defect in files already listed above.

**Interfaces:**
- Consumes: completed Tasks 1–6.
- Produces: verified branch and benchmark conclusion.

- [ ] **Step 1: Verify Rust**

Run:

```bash
cargo fmt --manifest-path packages/project-state-native/Cargo.toml -- --check
cargo clippy --manifest-path packages/project-state-native/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path packages/project-state-native/Cargo.toml
pnpm --filter @nkdk/project-state-native test
```

Expected: all PASS.

- [ ] **Step 2: Verify TypeScript and architecture**

Run:

```bash
pnpm type-check
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 316aeea26
```

Expected: all PASS and no new duplicates.

- [ ] **Step 3: Run the full suite**

Run: `pnpm test`

Expected: all workspace tests PASS.

- [ ] **Step 4: Check the final tree**

Run:

```bash
git diff --check 316aeea26..HEAD
git status --short --branch
```

Expected: no whitespace errors and a clean worktree.

- [ ] **Step 5: Report the gate**

Сообщить отдельно корректность, медиану времени, медиану/максимум RSS, долю native/deferred и решение: продолжать перенос, оставить экспериментальным или сначала перенести наиболее массовую отложенную категорию.
