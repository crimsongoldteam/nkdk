# Rust ProjectState Query Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить повторные вызовы `napi-rs` и копирование строк из ответов поиска целей, чтобы Rust достиг паритета времени и RSS с TypeScript на повторяющейся нагрузке.

**Architecture:** TypeScript-переходник хранит кэш на время неизменяемой read session, объединяет одинаковые отсутствующие в кэше ключи и вызывает Rust только для уникальных новых запросов. Rust возвращает фиксированные строки только с идентификаторами общего снимка; TypeScript разрешает их через `ProjectStateSnapshotView` и сохраняет публичный `ProjectStateQueryPort` без изменений.

**Tech Stack:** TypeScript 7, Vitest 4, Rust 1.97.1 edition 2024, napi-rs 3.12.1, `SharedArrayBuffer`, внутренний little-endian протокол ProjectState ABI 1.0.

## Global Constraints

- Формат `project-state.bin 0.5.0`, `ProjectStateReadToken` и публичный `ProjectStateQueryPort` не меняются.
- Ошибка Rust не вызывает скрытого перехода на TypeScript.
- `missing`, `ambiguous` и найденные результаты кэшируются без `requestId` на время одной read session.
- Повторяющаяся нагрузка считается успешной, если Rust не медленнее TypeScript и не увеличивает пиковую RSS.
- Уникальная нагрузка измеряется отдельно и не является условием остановки этого этапа.
- Разработка каждого изменения поведения идёт через RED–GREEN; существующие XML-фикстуры не изменяются.

---

### Task 1: Числовой ответ Rust для поиска целей

**Files:**
- Modify: `packages/project-state-native/tests/reader.test.ts`
- Modify: `packages/rules/metadata/projectState/rust/protocol.ts`
- Modify: `packages/project-state-native/src/queries/targets.rs`

**Interfaces:**
- Consumes: `encodeRustTargetRequest(requests): Uint8Array<ArrayBuffer>` и идентификаторы `TargetEntry` существующего снимка.
- Produces: `decodeRustTargetResponse(bytes): readonly RustTargetLookupResult[]`, где найденная цель содержит `kind`, `sourceFileId`, `canonicalId`, `componentPathId`, `itemProjectPathId?`, `ownerProjectPathId?`.

- [ ] **Step 1: Изменить тест протокола так, чтобы он требовал числовые идентификаторы**

В `reader.test.ts` заменить строковые ожидания найденных целей на значения из соответствующего `ProjectStateTargetEntryRecord`:

```ts
const snapshot = snapshotView(buffers)
const expected = snapshot.lookupTarget("cf", "Catalog.Один")[0]!

expect(actual).toEqual([{
  status: "found",
  target: {
    kind: expected.kind,
    sourceFileId: expected.sourceFileId,
    canonicalId: expected.canonicalId,
    componentPathId: expected.componentPathId,
  },
}, { status: "missing" }, { status: "ambiguous" }])
```

Для файловой цели ожидать также `itemProjectPathId` и `ownerProjectPathId`.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/project-state-native test -- reader.test.ts
```

Expected: FAIL — текущий декодер возвращает строки `canonical`, `projectPath`, `componentPath`, `itemProjectPath`, `ownerProjectPath`, а не идентификаторы.

- [ ] **Step 3: Свести ответ операции TARGET к одной фиксированной строке на запрос**

В `protocol.ts` заменить строковый тип результата:

```ts
export interface RustResolvedTargetIds {
  readonly kind: "object" | "member" | "value"
  readonly sourceFileId: number
  readonly canonicalId: number
  readonly componentPathId: number
  readonly itemProjectPathId?: number
  readonly ownerProjectPathId?: number
}
```

Задать `TARGET_RESULT_BYTES = 28`. Декодер должен требовать:

```ts
envelope.stringsOffset === envelope.rowsOffset + envelope.requestCount * TARGET_RESULT_BYTES
&& envelope.stringsOffset === bytes.byteLength
```

Строка ответа содержит семь `u32`: status, kind, source file, canonical, component, item и owner. Значение `0xffff_ffff` преобразуется в отсутствие необязательного идентификатора.

В `targets.rs` заменить `ResolvedTarget` на копируемый `TargetEntry`, удалить построение `String`, таблицу entries и раздел строк. Для найденной цели писать непосредственно в её строку ответа:

```rust
write_u32(&mut response, row, FOUND)?;
write_u32(&mut response, row + 4, u32::from(target.kind))?;
write_u32(&mut response, row + 8, u32_from_usize(target.source_file_id)?)?;
write_u32(&mut response, row + 12, u32_from_usize(target.canonical_id)?)?;
write_u32(&mut response, row + 16, u32_from_usize(target.component_path_id)?)?;
write_u32(&mut response, row + 20, u32_from_usize(target.item_project_path_id)?)?;
write_u32(&mut response, row + 24, u32_from_usize(target.owner_project_path_id)?)?;
```

- [ ] **Step 4: Собрать дополнение и подтвердить GREEN**

Run:

```bash
pnpm --filter @nkdk/project-state-native build
pnpm --filter @nkdk/project-state-native test -- reader.test.ts
cargo fmt --check --manifest-path packages/project-state-native/Cargo.toml
cargo clippy --manifest-path packages/project-state-native/Cargo.toml --all-targets -- -D warnings
```

Expected: native build успешен, `reader.test.ts` зелёный, fmt и clippy без замечаний.

- [ ] **Step 5: Проверить новые дубли и создать коммит**

Run:

```bash
pnpm duplicates -- --base 4392598c4
git add packages/project-state-native/tests/reader.test.ts packages/rules/metadata/projectState/rust/protocol.ts packages/project-state-native/src/queries/targets.rs packages/project-state-native/index.js
git commit -m "perf: :zap: возвращать идентификаторы целей из Rust"
```

Expected: новых дублей нет; один самостоятельный коммит протокола.

### Task 2: Кэш и объединение повторных запросов

**Files:**
- Modify: `packages/rules/metadata/projectState/rust/readSession.test.ts`
- Modify: `packages/rules/metadata/projectState/rust/readSession.ts`

**Interfaces:**
- Consumes: числовой `RustTargetLookupResult` из Task 1 и `ProjectStateSnapshotView.stringValue/filePath`.
- Produces: прежний `ProjectStateQueryPort.resolveTargets`, но один native-запрос на каждый уникальный ключ за время read session.

- [ ] **Step 1: Написать тест повторной пачки и объединения ключей**

Добавить в `readSession.test.ts` тест с реальным native reader, обёрнутым счётчиком:

```ts
let executeCalls = 0
const requestCounts: number[] = []
const session = openRustProjectStateReadSession(store.createReadToken(), validator, {
  openReader(sections) {
    const reader = openRustProjectStateReader(sections)
    return {
      stats: () => reader.stats(),
      filePaths: () => reader.filePaths(),
      execute(request) {
        executeCalls += 1
        requestCounts.push(new DataView(request.buffer, request.byteOffset).getUint32(12, true))
        return reader.execute(request)
      },
      close: () => reader.close(),
    }
  },
})
```

Первая пачка содержит один ключ дважды с разными `requestId`, вторая — тот же ключ ещё раз. Ожидать три одинаковых смысловых результата, `executeCalls === 1` и `requestCounts === [1]`.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/readSession.test.ts
```

Expected: FAIL — текущая функция игнорирует внедрённый `openReader`, не объединяет ключи и не хранит кэш.

- [ ] **Step 3: Реализовать минимальный кэш переходника**

Добавить внутреннюю зависимость:

```ts
type CachedTargetLookupResult = Omit<ProjectTargetLookupResult, "requestId">

interface RustReadSessionDependencies {
  readonly openReader: typeof openRustProjectStateReader
}
```

Третий параметр `openRustProjectStateReadSession` получает `Partial<RustReadSessionDependencies>`, по умолчанию используется настоящий reader. При создании query port создать:

```ts
const targetCache = new Map<string, CachedTargetLookupResult>()
```

В `resolveTargets`:

1. построить ключ `${componentPath}\u0000${canonicalTarget}`;
2. собрать `Map` уникальных отсутствующих ключей;
3. одним вызовом Rust разрешить только значения этой карты;
4. преобразовать числовые идентификаторы через `snapshot.stringValue` и `snapshot.filePath`;
5. вычислить `referenceDetails` один раз и сохранить результат без `requestId`;
6. собрать ответы в исходном порядке, добавляя исходный `requestId`.

Необязательные пути читать только при наличии соответствующего идентификатора. `missing` и `ambiguous` также записывать в кэш.

- [ ] **Step 4: Подтвердить GREEN и отсутствие регрессий read session**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/projectState/rust/readSession.test.ts metadata/projectState/binary/readSession.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: оба набора тестов и проверка типов проходят.

- [ ] **Step 5: Проверить новые дубли и создать коммит**

Run:

```bash
pnpm duplicates -- --base 4392598c4
git add packages/rules/metadata/projectState/rust/readSession.test.ts packages/rules/metadata/projectState/rust/readSession.ts
git commit -m "perf: :zap: кэшировать поиск целей Rust"
```

Expected: новых дублей нет; кэш изолирован одним коммитом.

### Task 3: Раздельное измерение повторяющихся и уникальных запросов

**Files:**
- Modify: `packages/rules/scripts/measure-project-state-backends.test.ts`
- Modify: `packages/rules/scripts/measure-project-state-backends.ts`
- Modify: `packages/rules/scripts/measure-project-state-backend-worker.ts`
- Modify: `packages/rules/scripts/measure-binary-project-state.ts`
- Modify: `packages/rules/scripts/measure-binary-project-state-worker.ts`

**Interfaces:**
- Consumes: существующий измеритель с `lookups`, `workers` и двумя реализациями.
- Produces: параметр `queryPattern: "repeated" | "unique"` во всех параметрах и JSON каждого запуска.

- [ ] **Step 1: Написать тест разбора двух режимов**

Расширить тесты аргументов ожиданием `queryPattern: "repeated"` по умолчанию и добавить:

```ts
expect(parseProjectStateBackendMeasureArgs([
  "/project", "--query-pattern", "unique",
])).toMatchObject({ queryPattern: "unique" })
```

Добавить чистый тест построения запросов: повторяющийся режим использует диапазон по модулю, уникальный — каждый существующий диапазон не более одного раза, а остаток превращает в уникальные отсутствующие ключи.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run scripts/measure-project-state-backends.test.ts
```

Expected: FAIL — параметр `--query-pattern` и функция построения запроса ещё отсутствуют.

- [ ] **Step 3: Провести параметр через процессы и worker**

Добавить тип:

```ts
export type ProjectStateQueryPattern = "repeated" | "unique"
```

Передать `queryPattern` из главного CLI через `ProjectStateBackendWorkerOptions`, `measureBinaryProjectState` и `BinaryProjectStateLookupTask`. В JSON запуска сохранить выбранный режим.

Вынести из worker чистую функцию `createProjectStateLookupRequest`. Для `repeated` сохранить текущие 90% найденных запросов с `queryIndex % targetRangeCount`. Для `unique` использовать найденную цель только пока `queryIndex < min(floor(total * 0.9), targetRangeCount)`; остальные запросы получают уникальную отсутствующую пару с `queryIndex`.

Неверное значение `--query-pattern` должно приводить к явной ошибке с допустимыми вариантами.

- [ ] **Step 4: Подтвердить GREEN и проверить CLI измерителя**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run scripts/measure-project-state-backends.test.ts
pnpm --filter @nkdk/rules type-check
```

Expected: тесты и проверка типов проходят; JSON содержит режим нагрузки.

- [ ] **Step 5: Проверить новые дубли и создать коммит**

Run:

```bash
pnpm duplicates -- --base 4392598c4
git add packages/rules/scripts/measure-project-state-backends.test.ts packages/rules/scripts/measure-project-state-backends.ts packages/rules/scripts/measure-project-state-backend-worker.ts packages/rules/scripts/measure-binary-project-state.ts packages/rules/scripts/measure-binary-project-state-worker.ts
git commit -m "perf: :zap: разделить режимы измерения ProjectState"
```

Expected: новых дублей нет; измеритель зафиксирован отдельным коммитом.

### Task 4: Сравнительные замеры и решение

**Files:**
- Create: `/private/tmp/nkdk-rust-query-import.json` (не коммитить)
- Create: `/private/tmp/nkdk-project-state-repeated.json` (не коммитить)
- Create: `/private/tmp/nkdk-project-state-unique.json` (не коммитить)

**Interfaces:**
- Consumes: собранный MCP-путь, существующий снимок реального проекта и CLI Task 3.
- Produces: медианы пяти изолированных запусков TypeScript/Rust для elapsed time, CPU и RSS в двух режимах.

- [ ] **Step 1: Пересобрать используемые пакеты**

Run:

```bash
pnpm --filter @nkdk/project-state-native build
pnpm --filter @nkdk/mcp build
```

Expected: обе сборки успешны.

- [ ] **Step 2: Подготовить реальный проект с сохранённым снимком**

Создать через `apply_patch` файл `/private/tmp/nkdk-rust-query-import.json`:

```json
{
  "xmlDir": "/Users/nikita/git/round-trip/cf/all",
  "projectDir": "/private/tmp/nkdk-rust-query-project",
  "componentPath": "cf",
  "concurrency": 4,
  "allowWrite": true
}
```

Run:

```bash
node .agents/tools/mcp/call.mjs nkdk.import_from_xml --compiled --input /private/tmp/nkdk-rust-query-import.json --output /private/tmp/nkdk-rust-query-import-result.json
```

Expected: импорт успешен, `/private/tmp/nkdk-rust-query-project/.nkdk/project-state.bin` существует. Каталог создаётся впервые в этом цикле; при его неожиданном наличии остановиться и выбрать новый явный путь, не удаляя чужие данные.

- [ ] **Step 3: Выполнить пять запусков повторяющейся нагрузки**

Run:

```bash
node --import tsx packages/rules/scripts/measure-project-state-backends.ts /private/tmp/nkdk-rust-query-project --runs 5 --concurrency 4 --lookups 200000 --query-pattern repeated > /private/tmp/nkdk-project-state-repeated.json
```

- [ ] **Step 4: Выполнить пять запусков уникальной нагрузки**

Run:

```bash
node --import tsx packages/rules/scripts/measure-project-state-backends.ts /private/tmp/nkdk-rust-query-project --runs 5 --concurrency 4 --lookups 200000 --query-pattern unique > /private/tmp/nkdk-project-state-unique.json
```

Expected: все запуски каждой реализации дают одинаковые количества found/missing и одинаковый `diagnosticsDigest` внутри одного режима.

- [ ] **Step 5: Рассчитать медианы и применить критерий этапа**

Для каждого режима рассчитать медианы `elapsedMs`, `cpuUserMicros + cpuSystemMicros` и `rssPeakBytes`. Повторяющийся режим проходит, если:

```text
rust.elapsedMs <= typescript.elapsedMs
rust.rssPeakBytes <= typescript.rssPeakBytes
```

Уникальный режим описать отдельно как стоимость границы. Если повторяющийся режим не проходит, не расширять Rust query engine в этом цикле.

### Task 5: Полная проверка ветки

**Files:**
- Verify only: весь worktree

**Interfaces:**
- Consumes: изменения Tasks 1–3 и результаты Task 4.
- Produces: проверенная чистая ветка и решение о следующем слое.

- [ ] **Step 1: Выполнить проверки Rust и native-пакета**

Run:

```bash
cargo fmt --check --manifest-path packages/project-state-native/Cargo.toml
cargo clippy --manifest-path packages/project-state-native/Cargo.toml --all-targets -- -D warnings
pnpm --filter @nkdk/project-state-native test
```

Expected: все команды успешны, 16 или больше native-тестов проходят.

- [ ] **Step 2: Выполнить проверки всего проекта**

Run:

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 4392598c4
```

Expected: все команды успешны; новых дублей нет. Известные предупреждения о длительности e2e допустимы согласно решению пользователя, но падения тестов недопустимы.

- [ ] **Step 3: Проверить чистоту дерева и зафиксировать решение**

Run:

```bash
git status --short
git log --oneline 4392598c4..HEAD
```

Expected: рабочее дерево чистое; история содержит отдельные коммиты протокола, кэша и измерителя. Результат сообщается с обеими таблицами и явным решением, продолжать ли следующий слой переноса.
