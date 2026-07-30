# Early YAML Release During XML Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Записывать и освобождать на первом проходе XML-import все данные, которым не нужна финализация с общим индексом, удерживая только YAML с потенциально переводимыми `DataPath`.

**Architecture:** Общий orchestration-слой получает нейтральную type-rule возможность, которая фильтрует значения перед добавлением в deferred-список. `DataPath` реализует её быстрым предикатом по единому реестру стандартных имён. Worker немедленно пишет независимые связанные файлы и готовые YAML, возвращает координатору компактные описания файлов, а для второго прохода хранит минимальное состояние.

**Tech Stack:** TypeScript 7, Node.js `fs/promises`, Vitest 4, Piscina, существующие NKDK type-rule registry и import profiler.

## Global Constraints

- `DataPath` определяется только по `rule.type === "DataPath"`; имена YAML- и XML-полей не используются.
- Ложное срабатывание предиката допустимо; ложный пропуск потенциально переводимого стандартного реквизита недопустим.
- Пути, первый символ которых `~`, не преобразуются, не валидируются и не передаются resolver.
- Обычные `importFromXML`/`exportToYAML` преобразования завершаются до решения о ранней записи.
- Все generated files записываются и освобождаются на первом проходе независимо от судьбы основного YAML.
- Исходные external files переносятся координатором только после успешного завершения обоих проходов.
- Worker выполняет не более одной записи задания одновременно; отдельная внутренняя очередь записи не создаётся.
- Ранние файлы при ошибке не удаляются; транзакционная очистка не входит в задачу.
- Итоговый Project, диагностики и snapshot сохраняются без изменений, кроме намеренно неизменённых путей с `~`.
- Контрольный профиль: `/Users/nikita/git/round-trip/cf/doc`, один worker, `NODE_OPTIONS=--max-old-space-size=8192`.
- Baseline: `9 937` заданий, cold `70,05 с`, Peak RSS worker `2 377,8 МиБ`, warnings/errors `0/0`.
- Cold после изменения не превышает `77,06 с`; Peak RSS worker должен снизиться.
- Проверка памяти не становится пороговым CI-тестом.

---

## File Structure

- `packages/core/metadata/orchestration/property/importYamlTypes.ts` — тип нейтрального предиката финализации.
- `packages/core/metadata/orchestration/property/fn.ts` — включение новой операции в type-rule contract.
- `packages/core/metadata/orchestration/property/typeRuleRegistry.ts` — типобезопасная регистрация и чтение предиката.
- `packages/core/metadata/orchestration/property/fromXMLToYAML.ts` — решение, добавлять ли конкретное YAML-значение в deferred.
- `packages/core/metadata/validation/dataPath/standardMembers.ts` — плоская проекция всех стандартных имён и revision реестра.
- `packages/core/metadata/validation/dataPath/registry.ts` — публичный re-export проекции и revision.
- `packages/core/metadata/validation/dataPath/finalizationPredicate.ts` — кэшированные matcher'ы двух направлений.
- `packages/core/metadata/validation/dataPath/finalizationPredicate.test.ts` — семантика границ сегмента и обновления кэша.
- `packages/core/metadata/validation/dataPath/finalizationPredicate.bench.ts` — сравнение regex и `split + Set`.
- `packages/core/metadata/validation/dataPath/formatter.ts` — общий ранний выход до resolver и диагностики.
- `packages/core/metadata/commonObjects/metadataPath/toYAML.ts` — регистрация import-finalization predicate для `DataPath`.
- `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts` и `fromYAML.test.ts` — неизменность отключённых путей.
- `packages/core/metadata/importFromXml/writeOutput.ts` — последовательная запись основного YAML и generated files.
- `packages/core/metadata/importFromXml/writeOutput.test.ts` — изолированные тесты файловой записи.
- `packages/core/metadata/importFromXml/types.ts` — файлы первого прохода в worker contract.
- `packages/core/metadata/importFromXml/worker.ts` — ранняя запись, минимальное deferred-состояние и профильные счётчики.
- `packages/core/metadata/importFromXml/worker.test.ts` — mixed first/second pass, ошибки и освобождение памяти.
- `packages/core/metadata/importFromXml/workerPool.ts` и `workerPool.test.ts` — агрегация файлов первого прохода.
- `packages/core/metadata/importFromXml/importConfiguration.ts` и `importConfiguration.test.ts` — объединение файлов двух проходов.
- `.agents/skills/import-profile/import-profile.mjs` — читаемые строки новых профильных счётчиков.

---

### Task 1: Нейтральный договор отбора deferred-значений

**Files:**
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Test: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`

**Interfaces:**
- Produces: `RequiresImportedYAMLFinalizationFunction = (params: { value: unknown }) => boolean`.
- Produces: type-rule operation `"requiresImportedYAMLFinalization"`.
- Preserves: finalizer without predicate still defers every exported value.
- Consumes: existing `FinalizeImportedYAMLFunction` and `DeferredValuePathCollector`.

- [ ] **Step 1: Write failing orchestration tests for the three contract branches**

Add unique test property types and reuse `createDeferredValuePathCollector()`:

```ts
it("filters imported YAML finalization through the optional type predicate", () => {
  const alwaysType = "TestFinalizeAlways" as PropertyRuleType
  const filteredType = "TestFinalizeFiltered" as PropertyRuleType
  const predicateOnlyType = "TestPredicateWithoutFinalizer" as PropertyRuleType
  registerTypeRule(alwaysType, "finalizeImportedYAML", ({ value }) => value)
  registerTypeRule(filteredType, "finalizeImportedYAML", ({ value }) => value)
  registerTypeRule(filteredType, "requiresImportedYAMLFinalization", ({ value }) => value === "defer")
  registerTypeRule(predicateOnlyType, "requiresImportedYAMLFinalization", () => true)

  const deferred = createDeferredValuePathCollector()
  importPropertiesWithSources({
    context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
    rule: {
      itemType: "TestFinalizationFilter",
      properties: {
        always: { type: alwaysType, xml: "Always", yaml: "Всегда" },
        skipped: { type: filteredType, xml: "Skipped", yaml: "Пропущено" },
        selected: { type: filteredType, xml: "Selected", yaml: "Отложено" },
        predicateOnly: { type: predicateOnlyType, xml: "PredicateOnly", yaml: "БезФинализатора" },
      },
    } as MetadataItemRule,
    xml: { Always: "value", Skipped: "ready", Selected: "defer", PredicateOnly: "value" },
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    deferred,
  })

  expect(deferred.finish().map(({ valuePath }) => valuePath)).toEqual([["Всегда"], ["Отложено"]])
})
```

- [ ] **Step 2: Run the focused test and verify the new operation is rejected**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: FAIL because `"requiresImportedYAMLFinalization"` is not part of `TypeRulesOperations`.

- [ ] **Step 3: Add the type-rule function and registry mappings**

In `importYamlTypes.ts`:

```ts
export type RequiresImportedYAMLFinalizationFunction = (params: { value: unknown }) => boolean
```

Add the function to `TypeRule`, `TypeRulesOperations`, `importExportFunction<O>`, the registry union, imports, and `getTypeRule()` conditional return type:

```ts
requiresImportedYAMLFinalization?: RequiresImportedYAMLFinalizationFunction
```

- [ ] **Step 4: Apply the safe default in XML-to-YAML orchestration**

Replace unconditional deferred collection with:

```ts
const finalize = getTypeRule(propertyRule.type, "finalizeImportedYAML")
const requiresFinalization = getTypeRule(propertyRule.type, "requiresImportedYAMLFinalization")
if (
  finalize !== undefined &&
  (requiresFinalization === undefined || requiresFinalization({ value: yamlValue }))
) {
  deferred?.accept({ valuePath: propertyYamlPath, rulePath: propertyRulePath })
}
```

Do not pass `propertyRule`, YAML key, or XML key to the predicate.

- [ ] **Step 5: Run orchestration tests and type-check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 6: Commit the neutral contract**

```bash
git add packages/core/metadata/orchestration/property/importYamlTypes.ts \
  packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/orchestration/property/typeRuleRegistry.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts
git commit -m "refactor: :recycle: фильтровать финализацию импортированного YAML"
```

---

### Task 2: Быстрый предикат стандартных сегментов `DataPath`

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/standardMembers.ts`
- Modify: `packages/core/metadata/validation/dataPath/registry.ts`
- Create: `packages/core/metadata/validation/dataPath/finalizationPredicate.ts`
- Create: `packages/core/metadata/validation/dataPath/finalizationPredicate.test.ts`
- Create: `packages/core/metadata/validation/dataPath/finalizationPredicate.bench.ts`
- Modify: `packages/core/metadata/validation/dataPath/formatter.ts`
- Modify: `packages/core/metadata/validation/dataPath/formatter.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`

**Interfaces:**
- Produces: `requiresDataPathStandardMemberFormatting(value, direction): boolean`.
- Produces: `standardMemberNamePairs(): readonly StandardMemberNames[]`.
- Produces: `standardMembersRegistryRevision(): number`.
- Consumes: Task 1 operation `"requiresImportedYAMLFinalization"`.

- [ ] **Step 1: Write failing predicate tests**

Cover exact boundaries and both directions:

```ts
describe("requiresDataPathStandardMemberFormatting", () => {
  it.each([
    [undefined, "internal-to-yaml", false],
    ["LineNumber", "internal-to-yaml", false],
    ["~Список.LineNumber", "internal-to-yaml", false],
    ["Объект.Товары.LineNumber", "internal-to-yaml", true],
    ["Объект.Товары.LineNumber[0]", "internal-to-yaml", true],
    ["Объект.Товары.MyLineNumber", "internal-to-yaml", false],
    ["Объект.Товары.НомерСтроки", "internal-to-yaml", false],
    ["Объект.Товары.НомерСтроки", "yaml-to-internal", true],
    ["Объект.Товары.LineNumber", "yaml-to-internal", false],
  ] as const)("checks %j in %s", (value, direction, expected) => {
    expect(requiresDataPathStandardMemberFormatting(value, direction)).toBe(expected)
  })
})
```

Add a cache-refresh test that snapshots the registry, calls the predicate once, registers a unique standard member, observes the new match, and restores the snapshot in `finally`.

- [ ] **Step 2: Run the predicate test and verify the module is missing**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/dataPath/finalizationPredicate.test.ts
```

Expected: FAIL because `finalizationPredicate.ts` does not exist.

- [ ] **Step 3: Flatten the canonical standard-member registry**

Maintain a revision incremented by `registerStandardMembers`, `clearStandardMembersForTests`, and restore. Return deduplicated top-level names and nested `standardTable.columns` names:

```ts
let standardMembersRevision = 0

export function standardMemberNamePairs(): readonly StandardMemberNames[] {
  const pairs = new Map<string, StandardMemberNames>()
  for (const members of membersByOwnerKind.values()) {
    for (const member of members) {
      addPair(pairs, member.names)
      if (member.memberKind === "standardTabularSection") {
        for (const column of member.columns) addPair(pairs, column.names)
      }
    }
  }
  return [...pairs.values()]
}

export function standardMembersRegistryRevision(): number {
  return standardMembersRevision
}
```

Use `${names.internal}\u0000${names.yaml}` as the deduplication key. Re-export both functions from `registry.ts`.

- [ ] **Step 4: Implement the revision-aware matcher**

Compile one matcher per direction and rebuild only when the standard-member revision changes:

```ts
export function requiresDataPathStandardMemberFormatting(
  value: unknown,
  direction: DataPathFormatDirection
): boolean {
  if (typeof value !== "string" || value.startsWith("~") || !value.includes(".")) return false
  return matcher(direction)?.test(value) ?? false
}
```

Build candidates only from pairs where `internal !== yaml`, escape every name, sort longest first, and compile:

```ts
new RegExp(`(?:^|\\.)(?:${names.join("|")})(?=\\.|\\[|$)`)
```

Do not use the global `g` flag.

- [ ] **Step 5: Benchmark regex against `split + Set` on representative real fixture paths**

In `finalizationPredicate.bench.ts`, use the same name set and paths copied from existing form/DataPath fixtures, including matching, non-matching, indexed, substring, and disabled examples. Keep the split implementation local to the benchmark.

Run:

```bash
pnpm --filter @nkdk/core exec vitest bench metadata/validation/dataPath/finalizationPredicate.bench.ts --run
```

Expected: both implementations complete with identical boolean results. Keep the faster implementation behind the public interface; if `split + Set` wins, replace only matcher internals without changing semantics or consumers.

- [ ] **Step 6: Put the predicate before resolver and diagnostics**

At the first line of `formatDataPathStandardMembers()`:

```ts
if (!requiresDataPathStandardMemberFormatting(params.value, params.direction)) return params.value
```

Remove `splitDisabledPrefix()` and `containsStandardMemberToFormat()`. Resolver errors can emit `unresolved_data_path` directly because the early predicate already proved the presence of a candidate. Preserve indexed suffix replacement.

- [ ] **Step 7: Register the import-finalization predicate for `DataPath`**

In `toYAML.ts`:

```ts
registerTypeRule("DataPath", "requiresImportedYAMLFinalization", ({ value }) =>
  requiresDataPathStandardMemberFormatting(value, "internal-to-yaml")
)
```

Keep `finalizeImportedYAML` unchanged.

- [ ] **Step 8: Update formatter and direction tests**

Change disabled-path expectations:

```ts
expect(exportDataPathStandardMembersToYAML(catalogContext(), "~Список.Owner")).toBe("~Список.Owner")
expect(importDataPathStandardMembersFromYAML(catalogContext(), "~Список.Владелец")).toBe("~Список.Владелец")
```

Add formatter tests whose `ownerCache` throws on access, proving that disabled paths and paths without candidates return before resolver. Also assert no diagnostic is appended.

- [ ] **Step 9: Run all focused DataPath tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/validation/dataPath/finalizationPredicate.test.ts \
  metadata/validation/dataPath/formatter.test.ts \
  metadata/commonObjects/metadataPath/toYAML.test.ts \
  metadata/commonObjects/metadataPath/fromYAML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 10: Commit the DataPath predicate**

```bash
git add packages/core/metadata/validation/dataPath \
  packages/core/metadata/commonObjects/metadataPath/toYAML.ts \
  packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts \
  packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts
git commit -m "perf: :zap: пропускать неизменяемые пути к данным"
```

---

### Task 3: Изолированные последовательные операции записи

**Files:**
- Create: `packages/core/metadata/importFromXml/writeOutput.ts`
- Create: `packages/core/metadata/importFromXml/writeOutput.test.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`

**Interfaces:**
- Produces: `writeMainImportYaml(params): Promise<{ file: ImportResultFile; bytes: number }>`.
- Produces: `writeGeneratedImportFiles(params): Promise<ImportResultFile[]>`.
- Produces: `xmlExternalImportFiles(assignment): ImportResultFile[]`.
- Consumes: `ValidationProfiler`, `ExternalFileEntry`, `ImportAssignment`.

- [ ] **Step 1: Write failing isolated output tests**

Create a temporary output directory and assert:

```ts
const generated = await writeGeneratedImportFiles({
  outputDir,
  targetProjectPath: "Справочник/Товары/Формы/Форма/Форма.yaml",
  generatedFiles: [
    { relativePath: "ДинамическийСписок/Список.query", content: "ВЫБРАТЬ 1" },
    { relativePath: "Модуль.bsl", content: "Процедура Тест() КонецПроцедуры" },
  ],
  profiler,
})

expect(generated.map(({ targetProjectPath }) => targetProjectPath)).toEqual([
  "Справочник/Товары/Формы/Форма/ДинамическийСписок/Список.query",
  "Справочник/Товары/Формы/Форма/Модуль.bsl",
])
```

Also test that `writeMainImportYaml()` serializes one YAML tree, returns its UTF-8 byte count, and writes exactly the expected target.

- [ ] **Step 2: Run the output test and verify the module is missing**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/writeOutput.test.ts
```

Expected: FAIL because `writeOutput.ts` does not exist.

- [ ] **Step 3: Extract focused write helpers from `worker.ts`**

Implement sequential loops only:

```ts
export async function writeMainImportYaml(params: {
  outputDir: string
  targetProjectPath: string
  yaml: unknown
  profiler: ValidationProfiler
}): Promise<{ file: ImportResultFile; bytes: number }>
```

Serialize with `exportToYAML`, compute `Buffer.byteLength(exported, "utf-8")`, `mkdir(dirname(path), { recursive: true })`, then `writeFile`. Return `sourceKind: "worker"`.

```ts
export async function writeGeneratedImportFiles(params: {
  outputDir: string
  targetProjectPath: string
  generatedFiles: readonly ExternalFileEntry[]
  profiler: ValidationProfiler
}): Promise<ImportResultFile[]>
```

Join every `relativePath` against `posix.dirname(targetProjectPath)` and await each write before starting the next.

```ts
export function xmlExternalImportFiles(assignment: ImportAssignment): ImportResultFile[] {
  return assignment.externalFiles.map((file) => ({
    sourceKind: "xml",
    sourcePath: file.sourcePath,
    targetProjectPath: file.targetProjectPath,
  }))
}
```

- [ ] **Step 4: Reuse `writeMainImportYaml()` in the current second pass**

Replace only the serialization/main-file section of `writePreparedYamlToOutput()`; keep finalization behavior and generated-file timing unchanged until Task 4. This makes Task 3 behavior-preserving.

- [ ] **Step 5: Run output and worker tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/writeOutput.test.ts \
  metadata/importFromXml/worker.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit output primitives**

```bash
git add packages/core/metadata/importFromXml/writeOutput.ts \
  packages/core/metadata/importFromXml/writeOutput.test.ts \
  packages/core/metadata/importFromXml/worker.ts
git commit -m "refactor: :recycle: выделить запись файлов XML-import"
```

---

### Task 4: Ранняя запись и минимальное deferred-состояние worker

**Files:**
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`

**Interfaces:**
- Produces: `ImportFirstPassResult.files: ImportResultFile[]`.
- Produces: `XmlImportFirstPassPoolResult.files: ImportResultFile[]`.
- Consumes: Task 3 output helpers.
- Preserves: second pass result shape and coordinator transfer/hash/snapshot ordering.

- [ ] **Step 1: Change worker tests to describe mixed ownership**

Replace the first-pass expectation that every catalog is retained. Assert a DataPath-free catalog is already written:

```ts
expect(first.files).toContainEqual({
  sourceKind: "worker",
  sourcePath: join(outputDir, assignment.targetProjectPath),
  targetProjectPath: assignment.targetProjectPath,
})
expect(workerStateForTests().preparedYamlIds).toEqual([])
```

Add a mixed catalog/form test:

```ts
const assignments = createCatalogAndFormAssignments("Объект.Товары.LineNumber")
const first = expectFirstPass(await runImportWorkerCommand({
  kind: "firstPass",
  assignments: [assignments.catalog, assignments.form],
}))

expect(first.files.map(({ targetProjectPath }) => targetProjectPath))
  .toContain(assignments.catalog.targetProjectPath)
expect(first.files.map(({ targetProjectPath }) => targetProjectPath))
  .not.toContain(assignments.form.targetProjectPath)
expect(workerStateForTests().preparedYamlIds).toEqual([assignments.form.id])
```

Add cases for:

- unknown and already-Russian `DataPath` write in first pass;
- exact English standard member remains for second pass;
- generated files of a retained form are written in first pass;
- `assignment.externalFiles` descriptors appear only in first-pass files;
- one early write error produces `xml_import_yaml_failed`, processing continues, and the failed assignment is not retained.

- [ ] **Step 2: Run worker tests and verify old retention behavior fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/worker.test.ts
```

Expected: FAIL because `ImportFirstPassResult` has no `files` and the worker retains every prepared YAML.

- [ ] **Step 3: Add files to first-pass contracts**

In `types.ts`:

```ts
export interface ImportFirstPassResult {
  kind: "firstPassResult"
  ownerFacts: ValidationOwnerFacts[]
  validationContribution: ValidationIndexContribution
  diagnostics: ImportDiagnostic[]
  files: ImportResultFile[]
  fragmentBuffer: ArrayBuffer
}
```

Mirror `files` in `XmlImportFirstPassPoolResult`.

- [ ] **Step 4: Replace retained `PreparedImportYaml` with a minimal worker-only state**

In `worker.ts` define:

```ts
interface DeferredImportYaml {
  diagnosticAssignment: Pick<ImportAssignment, "targetProjectPath" | "xmlFiles">
  targetProjectPath: string
  yaml: unknown
  rule: PreparedImportYaml["rule"]
  ownerContext: PreparedImportYaml["ownerContext"]
  formDataPathIndex: PreparedImportYaml["localIndexes"]["metadata"]["formDataPathIndex"]
  deferred: PreparedImportYaml["deferred"]
}
```

Change `preparedYaml` to `Map<string, DeferredImportYaml>`. Do not retain `generatedFiles`, all local indexes, external file descriptors, owner facts, validation contribution, or the complete assignment.

- [ ] **Step 5: Write independent outputs during each first-pass assignment**

After preparation and fact extraction:

1. Await `writeGeneratedImportFiles()` for every assignment.
2. Append `xmlExternalImportFiles(assignment)`.
3. If `prepared.deferred.length === 0`, await `writeMainImportYaml()` and do not store state.
4. Otherwise store the minimal `DeferredImportYaml`.
5. Only then append owner facts, fragment, and validation contribution to successful aggregates.

Use a nested output `try/catch` so serialization/write failures use:

```ts
importAssignmentDiagnostic(assignment, caught, "xml_import_yaml_failed")
```

Continue with subsequent assignments. Already-written partial files remain on disk.

- [ ] **Step 6: Make second pass operate only on deferred main YAML**

Use `prepared.formDataPathIndex` directly during finalization. Write only the main YAML with `writeMainImportYaml()`. Remove generated-file and XML external-file handling from `runSecondPass()`.

- [ ] **Step 7: Aggregate first-pass files through pool and coordinator**

In `workerPool.ts`:

```ts
files: results.flatMap((result) => result.files)
```

In `importConfiguration.ts`:

```ts
const allFiles = [...first.files, ...second.files]
const files = profiler.measure(
  "Подготовка импорта конфигурации",
  "Обобщение списка файлов результата импорта",
  { items: allFiles.length },
  () => deps.mergeFiles(allFiles)
)
```

Keep transfer, hashing, and snapshot writing after a successful second pass. On first-pass errors, return before second pass and leave early files untouched.

- [ ] **Step 8: Update pool/coordinator fakes and assertions**

Every fake `firstPassResult` returns `files: []`. Add a pool aggregation test with distinct files from two workers. Change coordinator tests so `runFirstPass()` and `runSecondPass()` return disjoint file lists and assert `mergeFiles()` receives both in first-then-second order without duplicates.

- [ ] **Step 9: Run import tests and type-check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/writeOutput.test.ts \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts \
  metadata/importFromXml/importConfiguration.test.ts \
  metadata/importFromXml/transfer.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 10: Commit early release**

```bash
git add packages/core/metadata/importFromXml
git commit -m "perf: :zap: освобождать готовый YAML на первом проходе"
```

---

### Task 5: Наблюдаемость ранней записи

**Files:**
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `.agents/skills/import-profile/import-profile.mjs`

**Interfaces:**
- Produces profile substeps:
  - `"Досрочно записанные YAML"` with `items` and UTF-8 `bytes`.
  - `"YAML, оставленные до второго прохода"` with `items`.
  - `"Отложенные значения YAML"` with `items`.
- Consumes: `writeMainImportYaml()` byte count from Task 3.

- [ ] **Step 1: Write failing worker profile assertions**

Run a mixed first pass with `NKDK_PROFILE=1`, capture `console.error`, and assert:

```ts
expect(lines).toContainEqual(expect.stringContaining('substep="Досрочно записанные YAML"'))
expect(lines).toContainEqual(expect.stringMatching(/substep="Досрочно записанные YAML".*items=1.*bytes=[1-9]/))
expect(lines).toContainEqual(expect.stringContaining('substep="YAML, оставленные до второго прохода"'))
expect(lines).toContainEqual(expect.stringContaining('substep="Отложенные значения YAML"'))
```

Parse or match the exact expected item counts for the test fixture.

- [ ] **Step 2: Run the profile test and verify counters are absent**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/worker.test.ts
```

Expected: FAIL on the three missing substeps.

- [ ] **Step 3: Aggregate counters without retaining per-assignment details**

Use scalar counters in `runFirstPass()`:

```ts
let earlyYamlCount = 0
let earlyYamlBytes = 0
let retainedYamlCount = 0
let deferredValueCount = 0
```

Update them immediately after each successful decision. Before `profiler.flush()`:

```ts
profiler.record("Подготовка импорта конфигурации", "Досрочно записанные YAML", {
  items: earlyYamlCount,
  bytes: earlyYamlBytes,
  timeMs: 0,
})
profiler.record("Подготовка импорта конфигурации", "YAML, оставленные до второго прохода", {
  items: retainedYamlCount,
  timeMs: 0,
})
profiler.record("Подготовка импорта конфигурации", "Отложенные значения YAML", {
  items: deferredValueCount,
  timeMs: 0,
})
```

- [ ] **Step 4: Add counters to the profiler's preferred display order**

Place the three labels after `"Первый проход worker"` in `orderedSubstepRows()` so they appear before low-level parsing/conversion rows.

- [ ] **Step 5: Run profile tests and verify the script entry point**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/worker.test.ts
node .agents/skills/import-profile/import-profile.mjs --help
```

Expected: worker tests PASS; help prints usage and exits `0`.

- [ ] **Step 6: Commit profile counters**

```bash
git add packages/core/metadata/importFromXml/worker.ts \
  packages/core/metadata/importFromXml/worker.test.ts \
  .agents/skills/import-profile/import-profile.mjs
git commit -m "perf: :zap: измерять раннюю запись YAML"
```

---

### Task 6: Полная функциональная и производительная проверка

**Files:**
- Verify only: all files changed in Tasks 1–5
- Update if measured numbers differ: `docs/superpowers/specs/2026-07-29-early-yaml-release-during-xml-import-design.md`

**Interfaces:**
- Consumes: complete early-release implementation and import profiler.
- Produces: evidence for semantic equivalence, memory reduction, cold-time guard, and zero errors/warnings.

- [ ] **Step 1: Run the complete core test suite**

Run:

```bash
pnpm --filter @nkdk/core test
```

Expected: PASS with no failed tests and no test-budget violations.

- [ ] **Step 2: Run core type-check**

Run:

```bash
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 3: Run a clean `doc` cold profile**

Run:

```bash
mkdir -p /private/tmp/nkdk-import-profile-doc-after
mkdir -p /private/tmp/nkdk-import-profile-doc-after-runs
env TMPDIR=/private/tmp/nkdk-import-profile-doc-after-runs \
  NODE_OPTIONS=--max-old-space-size=8192 \
  node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip/cf/doc \
  /private/tmp/nkdk-import-profile-doc-after \
  --runs 1
```

Expected:

- mode `mcp stdio source tsx`;
- workers `1`;
- succeeded `9 937`;
- warnings/errors `0/0`;
- cold at most `77,06 с`;
- Peak RSS worker below `2 377,8 МиБ`;
- non-zero early YAML count and lower retained YAML count than `9 937`.

- [ ] **Step 4: Verify output behavior**

Inspect profile counters and run focused import integration tests once more:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/importConfiguration.test.ts \
  metadata/importFromXml/importConfigurationExtension.test.ts
```

Expected: Project files, diagnostics, references, and snapshot assertions PASS. The only updated expectations are disabled `~` paths remaining byte-for-byte unchanged.

- [ ] **Step 5: Record after numbers and remove benchmark temporaries**

Update the spec's profiling section with actual after cold time, Peak RSS main/worker, first/second-pass time, early/retained counts, and deferred-value count.

Then remove only the two exact directories created by Step 3:

```bash
rm -rf /private/tmp/nkdk-import-profile-doc-after
rm -rf /private/tmp/nkdk-import-profile-doc-after-runs
```

- [ ] **Step 6: Commit benchmark evidence**

```bash
git add docs/superpowers/specs/2026-07-29-early-yaml-release-during-xml-import-design.md
git commit -m "docs: :memo: зафиксировать эффект ранней записи YAML"
```
