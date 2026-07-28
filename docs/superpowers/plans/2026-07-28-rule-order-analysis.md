# Rule Order Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать фактический порядок свойств `MetadataItemRule` из всех XML-конфигураций `/Users/nikita/git/round-trip/cf` и сформировать отчёт о противоположных попарных ограничениях без изменения `rules.ts`, XML-фикстур и формата снимка.

**Architecture:** Необязательный приёмник наблюдений подключается к существующему rule-guided обходу `fromXMLToYAML` и вызывается только для порядка свойств одного `MetadataItemRule`. Отдельная worker-команда выполняет первый разбор заданий без сохранения подготовленного YAML, после чего главный процесс сопоставляет устойчивые отпечатки правил с экспортами `rules.ts`, агрегирует попарные ограничения и пишет JSONL, JSON и Markdown.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, Piscina, существующие discovery/XML-import worker NKDK.

## Global Constraints

- Анализируются все фактически выбранные при импорте `MetadataItemRule` из `rules.ts`, включая вложенные правила и элементы форм.
- Порядок элементов коллекций не анализируется; частные вызовы `ConfigurationIndexCollector.setOrder` не подключаются к приёмнику.
- `fields` содержит ключи свойств `rules.ts`, а не XML-теги.
- Конфигурации берутся из непосредственных подкаталогов переданного `--xml-root` и сортируются побайтово.
- `rules.ts`, существующие XML-фикстуры и формат снимка конфигурации не изменяются.
- Анализатор не пишет YAML, не копирует внешние файлы, не вычисляет хэши проекта и не пишет снимок.
- Каталог результата должен отсутствовать либо быть пустым.
- Любая ошибка discovery, XML-разбора, идентификации правила или записи результата завершает команду с ненулевым кодом.
- Полный внешний прогон не входит в `pnpm test`; он выполняется вручную после успешного `pnpm test`.

---

### Task 1: Устойчивый отпечаток и каталог правил

**Files:**

- Create: `packages/core/metadata/ruleOrderAnalysis/types.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/fingerprint.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/fingerprint.test.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/catalog.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/catalog.test.ts`

**Interfaces:**

- Consumes: `MetadataItemRule`, `PropertyRule` и `getTypeRule(type, "nestedItemRule")`.
- Produces:

```ts
export interface RuleOrderObservation {
  configuration: string
  sourceXmlPath: string
  logicalAddress: string
  xmlNodeLogicalAddress: string
  ruleId: string
  ruleCandidates: readonly string[]
  itemType: string
  fields: readonly string[]
}

export interface RawRuleOrderObservation extends Omit<RuleOrderObservation, "ruleCandidates"> {}

export function fingerprintMetadataItemRule(rule: MetadataItemRule): string

export interface RuleOrderCatalog {
  candidates(ruleId: string): readonly string[]
  assertKnown(observation: RawRuleOrderObservation): RuleOrderObservation
  ambiguities(): readonly { ruleId: string; candidates: readonly string[] }[]
}

export async function buildRuleOrderCatalog(params: { metadataDir: string }): Promise<RuleOrderCatalog>
```

- [ ] **Step 1: Write failing fingerprint tests**

Create `fingerprint.test.ts` with tests that prove:

```ts
it("ignores order recursively", () => {
  expect(
    fingerprintMetadataItemRule({
      itemType: "TestItem" as never,
      properties: { name: { type: "string", order: 1 } },
    })
  ).toBe(
    fingerprintMetadataItemRule({
      itemType: "TestItem" as never,
      properties: { name: { type: "string", order: 99 } },
    })
  )
})

it("distinguishes equal itemType with different XML mapping", () => {
  const canonical = {
    itemType: "TestItem" as never,
    properties: { name: { type: "string", xml: "Name" } },
  }
  const alias = {
    itemType: "TestItem" as never,
    properties: { name: { type: "string", xml: "LegacyName" } },
  }
  expect(fingerprintMetadataItemRule(canonical)).not.toBe(fingerprintMetadataItemRule(alias))
})

it("is stable when object key insertion order differs", () => {
  const left = {
    itemType: "TestItem" as never,
    properties: {
      name: { type: "string", xml: "Name" },
      value: { type: "string", xml: "Value" },
    },
  }
  const right = {
    properties: {
      value: { xml: "Value", type: "string" },
      name: { xml: "Name", type: "string" },
    },
    itemType: "TestItem" as never,
  }
  expect(fingerprintMetadataItemRule(left)).toBe(fingerprintMetadataItemRule(right))
})
```

Add a test for a nested rule registered through `nestedItemRule` and a test proving normalized function source participates in the fingerprint.

- [ ] **Step 2: Run fingerprint tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleOrderAnalysis/fingerprint.test.ts
```

Expected: FAIL because `fingerprintMetadataItemRule` does not exist.

- [ ] **Step 3: Implement canonical serialization and hashing**

In `fingerprint.ts`:

- recursively sort plain-object keys;
- omit every key named `order`;
- encode `undefined`, arrays, primitives and functions explicitly;
- normalize function source with `Function.prototype.toString.call(value).replace(/\s+/g, " ").trim()`;
- reject symbol, bigint, cyclic values and unsupported object prototypes with a message containing the rule `itemType`;
- include the reachable static `nestedItemRule.itemRule` in the property representation;
- encode `{ resolveItemRule }` by normalized resolver source without calling it;
- hash the canonical UTF-8 representation with `createHash("sha256").update(...).digest("hex")`;
- cache completed rule fingerprints in a `WeakMap<MetadataItemRule, string>`.

Use a recursion stack distinct from the completed cache so a real cycle is rejected instead of returning an incomplete fingerprint.

- [ ] **Step 4: Run fingerprint tests**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 5: Write failing catalog tests**

Create temporary `rules.ts` modules under a per-test temporary directory and verify:

```ts
it("indexes exported rules by file and export name", async () => {
  const catalog = await buildRuleOrderCatalog({ metadataDir })
  const observation = catalog.assertKnown({
    configuration: "all",
    sourceXmlPath: "/xml/Test.xml",
    logicalAddress: "Тест.Объект",
    xmlNodeLogicalAddress: "Тест.Объект",
    ruleId: fingerprintMetadataItemRule(rule),
    itemType: "TestItem",
    fields: ["name"],
  })
  expect(observation.ruleCandidates).toEqual([expect.stringMatching(/rules\.ts#TestRules$/)])
})
```

Also test two exports with the same fingerprint, an unknown fingerprint, deterministic bytewise ordering of candidates and recursive discovery of a nested static rule.

- [ ] **Step 6: Run catalog tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleOrderAnalysis/catalog.test.ts
```

Expected: FAIL because `buildRuleOrderCatalog` does not exist.

- [ ] **Step 7: Implement the catalog**

In `catalog.ts`:

- recursively enumerate files named exactly `rules.ts` below `metadataDir` using `fs.promises.readdir({ withFileTypes: true })`;
- sort directory entries with `Buffer.compare(Buffer.from(left.name), Buffer.from(right.name))`;
- import every module through `pathToFileURL(filePath).href`;
- treat an exported value as `MetadataItemRule` only when it is a non-array object with string `itemType` and a non-array object `properties`;
- index the export as `<relative-posix-path>#<exportName>`;
- recursively index static `nestedItemRule.itemRule` as `<parent-candidate>.<propertyKey>`;
- map every fingerprint to a sorted, de-duplicated candidate array;
- make `assertKnown` throw `Не найдено исходное rules.ts для ruleId ...` for an unknown ID;
- return only IDs with more than one candidate from `ambiguities()`.

Do not call `resolveItemRule`: dynamically selected rules must also be exported by their own `rules.ts` to enter the catalog.

- [ ] **Step 8: Run Task 1 tests and type-check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/ruleOrderAnalysis/fingerprint.test.ts \
  metadata/ruleOrderAnalysis/catalog.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add packages/core/metadata/ruleOrderAnalysis
git commit -m "feat: :sparkles: идентифицировать правила анализа порядка"
```

---

### Task 2: Попарные ограничения, конфликты и циклы

**Files:**

- Create: `packages/core/metadata/ruleOrderAnalysis/aggregate.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/aggregate.test.ts`

**Interfaces:**

- Consumes: `RuleOrderObservation` from Task 1.
- Produces:

```ts
export interface RuleOrderWitness {
  configuration: string
  sourceXmlPath: string
  logicalAddress: string
  xmlNodeLogicalAddress: string
  fields: readonly string[]
}

export interface RuleOrderDirection {
  before: string
  after: string
  count: number
  witnesses: readonly RuleOrderWitness[]
}

export interface RuleOrderConflict {
  leftBeforeRight: RuleOrderDirection
  rightBeforeLeft: RuleOrderDirection
}

export interface RuleOrderRuleReport {
  ruleId: string
  ruleCandidates: readonly string[]
  itemType: string
  observationCount: number
  uniqueOrders: number
  conflicts: readonly RuleOrderConflict[]
  cycles: readonly (readonly string[])[]
}

export interface RuleOrderAggregate {
  accept(observation: RuleOrderObservation): void
  finish(): readonly RuleOrderRuleReport[]
}

export function createRuleOrderAggregate(params?: { witnessLimit?: number }): RuleOrderAggregate
```

- [ ] **Step 1: Write failing aggregation tests**

Cover the agreed rule:

```ts
it("reports opposite order for the same pair", () => {
  const aggregate = createRuleOrderAggregate({ witnessLimit: 2 })
  aggregate.accept(observation(["name", "use", "indexing"], "all"))
  aggregate.accept(observation(["name", "indexing", "use"], "erp"))

  const [report] = aggregate.finish()
  expect(report?.conflicts).toEqual([
    expect.objectContaining({
      leftBeforeRight: expect.objectContaining({ before: "indexing", after: "use", count: 1 }),
      rightBeforeLeft: expect.objectContaining({ before: "use", after: "indexing", count: 1 }),
    }),
  ])
})
```

Add tests for:

- all `n * (n - 1) / 2` pairs from one order;
- missing fields producing no edge;
- repeated observations incrementing counts;
- `witnessLimit` retaining the first bytewise-sorted witnesses;
- duplicate fields throwing an error;
- a three-node cycle;
- deterministic sorting by rule ID, pair and witness fields.

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleOrderAnalysis/aggregate.test.ts
```

Expected: FAIL because `createRuleOrderAggregate` does not exist.

- [ ] **Step 3: Implement pair aggregation**

Implement `aggregate.ts` with:

- one state map per `ruleId`;
- a canonical unordered pair key using bytewise comparison;
- a direction counter for every ordered pair;
- a de-duplicated set of full field sequences for `uniqueOrders`;
- a bounded witness map sorted by `configuration`, `sourceXmlPath`, `logicalAddress`, `xmlNodeLogicalAddress`;
- conflict output only when both directions have count greater than zero.

Before accepting an observation, assert:

- `fields` contains no duplicates;
- `ruleCandidates` and `itemType` match prior observations of the same `ruleId`;
- `sourceXmlPath` is non-empty.

- [ ] **Step 4: Implement cycle detection**

Build an adjacency map from all observed directed edges. Use Tarjan strongly connected components:

- ignore components with one vertex unless a self-edge exists;
- sort fields inside a component bytewise;
- sort components by their JSON representation;
- emit each component as one cycle diagnostic.

Opposite pairs remain in `conflicts`; cycles are additional information.

- [ ] **Step 5: Run Task 2 tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleOrderAnalysis/aggregate.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add packages/core/metadata/ruleOrderAnalysis/aggregate.ts \
  packages/core/metadata/ruleOrderAnalysis/aggregate.test.ts
git commit -m "feat: :sparkles: находить конфликты порядка свойств"
```

---

### Task 3: Наблюдение порядка в общем XML-обходе

**Files:**

- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.test.ts`

**Interfaces:**

- Consumes: `fingerprintMetadataItemRule` from Task 1.
- Produces:

```ts
export interface RulePropertyOrderFact {
  rule: MetadataItemRule
  rulePath: readonly DeferredRulePathSegment[]
  sourceXmlPath: string
  logicalAddress: string
  xmlNodeLogicalAddress: string
  fields: readonly string[]
}

export interface RulePropertyOrderCollector {
  accept(fact: RulePropertyOrderFact): void
}
```

Add to `DirectImportTraversal`:

```ts
ruleOrderCollector?: RulePropertyOrderCollector
sourceXmlPath?: string
```

Add to `DirectImportXMLSource`:

```ts
sourceXmlPath?: string
```

- [ ] **Step 1: Write a failing common traversal test**

In `fromXMLToYAML.test.ts`, pass a recording `ruleOrderCollector` and two XML sources for one rule:

```ts
expect(facts).toEqual([
  expect.objectContaining({
    rule,
    sourceXmlPath: "/xml/Test.xml",
    fields: ["name", "legacyValue"],
  }),
])
```

Use `xmlAliases: ["LegacyValue"]` and assert the field is `legacyValue`, not `LegacyValue`.

- [ ] **Step 2: Write a failing exclusion test**

Use a nested collection property whose importer calls `ConfigurationIndexCollector.setOrder` for item names. Assert that the rule collector receives property orders for the owner and items, but never receives a `fields` array containing the collection item names.

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: FAIL because the collector fields are not supported.

- [ ] **Step 4: Add the collector contracts and propagate traversal state**

Define the interfaces in `importYamlTypes.ts`. Propagate `ruleOrderCollector` and fallback `sourceXmlPath` through:

- `importMetadataItemFromXMLToYAML`;
- recursive `importPropertiesFromXMLToYAML` calls;
- direct nested property traversals;
- `importClientApplicationFormFromXMLToYAML`;
- `prepareImportYaml`.

For form assignments, add `sourceXmlPath` to both sources created by `createClientApplicationFormImportSources`: the body source uses the `body` input path and the metadata source uses the `metadata` input path.

For ordinary metadata assignments, set the root traversal `sourceXmlPath` to the metadata input path. A nested source without its own path inherits the traversal path.

- [ ] **Step 5: Emit facts beside the existing snapshot order**

Extend the entries in `observedOrderByXmlNode` to retain:

```ts
{
  collector: ConfigurationIndexCollector
  keys: string[]
  seen: Set<string>
  sourceXmlPath: string
  logicalAddress: string
}
```

At the existing loop that calls `observation.collector.setOrder(...)`, also call `params.ruleOrderCollector?.accept(...)`.

Use the exact same `observation.keys`; do not read order back from the snapshot collector. Throw if the source path is still missing when analysis is enabled.

Do not add calls at any other `setOrder` location.

- [ ] **Step 6: Add prepareYaml and form propagation tests**

In `prepareYaml.test.ts`, verify a collector receives assignment paths for a normal metadata file.

In `fromXMLToYAML.test.ts` for forms, verify:

- `Form.xml` observations use the body path;
- metadata wrapper observations use the metadata path;
- nested element observations inherit `Form.xml`.

- [ ] **Step 7: Run Task 3 tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts \
  metadata/importFromXml/prepareYaml.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

```bash
git add packages/core/metadata/orchestration/property/importYamlTypes.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts \
  packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts \
  packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts \
  packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts \
  packages/core/metadata/importFromXml/prepareYaml.ts \
  packages/core/metadata/importFromXml/prepareYaml.test.ts
git commit -m "feat: :sparkles: наблюдать порядок свойств при XML-импорте"
```

---

### Task 4: Read-only worker-команда и координатор конфигураций

**Files:**

- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/analyze.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/analyze.test.ts`

**Interfaces:**

- Consumes: discovery, worker pool, fingerprint and catalog from prior tasks.
- Produces:

```ts
export interface RuleOrderAnalysisWorkerResult {
  kind: "ruleOrderAnalysisResult"
  diagnostics: ImportDiagnostic[]
  observations: RawRuleOrderObservation[]
}

export interface AnalyzeRuleOrderParams {
  xmlRoot: string
  metadataDir: string
  concurrency?: number
  witnessLimit?: number
  onObservation?(observation: RuleOrderObservation): void | Promise<void>
}

export interface AnalyzeRuleOrderResult {
  configurations: readonly string[]
  configurationStats: readonly {
    configuration: string
    assignmentCount: number
    xmlFileCount: number
    observationCount: number
  }[]
  assignmentCount: number
  xmlFileCount: number
  observationCount: number
  rules: readonly RuleOrderRuleReport[]
  ambiguities: readonly { ruleId: string; candidates: readonly string[] }[]
}

export async function analyzeRuleOrder(params: AnalyzeRuleOrderParams): Promise<AnalyzeRuleOrderResult>
```

Add to `XmlImportWorkerPool`:

```ts
analyzeRuleOrder(params: {
  configuration: string
  assignments: readonly ImportAssignment[]
}): Promise<{
  diagnostics: ImportDiagnostic[]
  observations: RawRuleOrderObservation[]
}>
```

- [ ] **Step 1: Write failing worker tests**

In `worker.test.ts`, initialize a worker and send:

```ts
{
  kind: "analyzeRuleOrder",
  configuration: "all",
  assignments: [assignment],
}
```

Assert:

- result kind is `ruleOrderAnalysisResult`;
- observations contain `configuration: "all"`;
- the rule ID equals `fingerprintMetadataItemRule(prepared.rule)`;
- `workerStateForTests().preparedCount` remains `0`;
- no output file exists.

Add an invalid XML case that returns an error diagnostic and no successful observation for that assignment.

- [ ] **Step 2: Run worker tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/worker.test.ts
```

Expected: FAIL because `analyzeRuleOrder` is not a worker command.

- [ ] **Step 3: Implement the worker command**

Extend `ImportWorkerCommand` and `ImportWorkerCommandResult`. In the worker:

- create a fresh configuration-index collector per assignment;
- create a local `RulePropertyOrderCollector`;
- call `prepareImportYaml` with the collector;
- immediately discard the returned `PreparedImportYaml`;
- convert facts to `RawRuleOrderObservation` using `fingerprintMetadataItemRule`;
- use the assignment metadata path as the final fallback source;
- never add prepared YAML to `preparedYaml`;
- return ordinary `ImportDiagnostic` entries for assignment failures.

The command must not extract owner facts or encode configuration-index fragments.

- [ ] **Step 4: Write and implement worker-pool tests**

In `workerPool.test.ts`, first add a failing test that two partitions return one combined, deterministically sorted observation array. Then implement `XmlImportWorkerPool.analyzeRuleOrder`:

- permit it only after `initialize`;
- use the existing round-robin partitioning;
- send `initialize`, then `analyzeRuleOrder` to active workers;
- combine diagnostics and observations;
- transition directly to a completed phase;
- support both destroy and reusable-handle dispose closing modes.

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/workerPool.test.ts
```

Expected: PASS after implementation.

- [ ] **Step 5: Write failing coordinator tests**

In `analyze.test.ts`, inject dependencies for filesystem listing, discovery, catalog and pool creation. Verify:

- only immediate directories are selected;
- names are sorted bytewise;
- configurations run sequentially;
- each operation pool is closed in `finally`;
- observations are passed through `catalog.assertKnown`, then `onObservation`, then aggregate;
- any error diagnostic throws with configuration and source path;
- a directory with zero assignments is still listed as processed.
- per-configuration statistics contain assignment, XML-file and observation counts.

Use exact expected order `["acc", "all", "clean", "doc", "erp", "small", "trade"]`.

- [ ] **Step 6: Implement the coordinator**

`analyzeRuleOrder` must:

1. validate `xmlRoot`;
2. build the rule catalog once;
3. list and sort direct child directories;
4. create one reusable worker-pool handle;
5. for each configuration, create an operation pool, initialize it with standard context `{ defaultLanguage: "ru", version: "2.20", exportToYAML: { toTyped: false }, fromXML: { forReference: false } }`, discover assignments and call `pool.analyzeRuleOrder`;
6. close each operation pool in `finally`;
7. close the handle in the outer `finally`;
8. decorate observations through the catalog and send them to the callback and aggregate;
9. return per-configuration and total assignment, XML-file and observation counts, reports and catalog ambiguities.

Use a harmless `outputDir` below `tmpdir()` only to satisfy the shared initialize contract; the analysis command must never create it.

- [ ] **Step 7: Run Task 4 tests and type-check**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts \
  metadata/ruleOrderAnalysis/analyze.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add packages/core/metadata/importFromXml/types.ts \
  packages/core/metadata/importFromXml/worker.ts \
  packages/core/metadata/importFromXml/worker.test.ts \
  packages/core/metadata/importFromXml/workerPool.ts \
  packages/core/metadata/importFromXml/workerPool.test.ts \
  packages/core/metadata/ruleOrderAnalysis/analyze.ts \
  packages/core/metadata/ruleOrderAnalysis/analyze.test.ts
git commit -m "feat: :sparkles: анализировать XML без записи YAML"
```

---

### Task 5: Стабильные файлы отчёта и временная команда

**Files:**

- Create: `packages/core/scripts/rule-order-analysis/render.ts`
- Create: `packages/core/scripts/rule-order-analysis/render.test.ts`
- Create: `packages/core/scripts/rule-order-analysis/output.ts`
- Create: `packages/core/scripts/rule-order-analysis/output.test.ts`
- Create: `packages/core/scripts/rule-order-analysis/index.ts`
- Modify: `packages/core/package.json`

**Interfaces:**

- Consumes: `analyzeRuleOrder` and `AnalyzeRuleOrderResult`.
- Produces:

```ts
export function renderRuleOrderConflictsJson(result: AnalyzeRuleOrderResult): string

export function renderRuleOrderReportMarkdown(result: AnalyzeRuleOrderResult): string

export interface RuleOrderOutput {
  accept(observation: RuleOrderObservation): Promise<void>
  complete(result: AnalyzeRuleOrderResult): Promise<void>
  fail(cause: unknown): Promise<void>
}

export async function createRuleOrderOutput(outputDir: string): Promise<RuleOrderOutput>
```

Package script:

```json
"analyze-rule-order": "tsx scripts/rule-order-analysis/index.ts"
```

- [ ] **Step 1: Write failing renderer tests**

Use a fixed result with one `use/indexing` conflict and one three-node cycle. Assert:

- JSON ends with one newline;
- all object keys and arrays are stable between two renders;
- Markdown begins with processed configuration, XML-file, assignment, observation, rule, conflict, cycle and ambiguity counts;
- both directions include counts and witness paths;
- an empty result says `Конфликты порядка не найдены.`;
- candidates and conflicts are bytewise sorted.

- [ ] **Step 2: Run renderer tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/rule-order-analysis/render.test.ts
```

Expected: FAIL because renderers do not exist.

- [ ] **Step 3: Implement renderers**

Render `conflicts.json` through a recursively stable object builder rather than relying on insertion order from mutable maps. Markdown must contain:

```markdown
# Анализ порядка свойств rules.ts

## Итог

- Конфигурации: 7
- XML-файлы: ...
- Задания: ...
- Наблюдения: ...
- Правила: ...
- Конфликты пар: ...
- Циклы: ...
- Неоднозначные правила: ...
```

For each conflict, print the candidate paths, `before → after`, counts and at most the witnesses already bounded by the aggregate.

- [ ] **Step 4: Write failing output lifecycle tests**

In `output.test.ts`, verify:

- a non-empty output directory is rejected before opening `observations.jsonl`;
- each accepted observation is one compact JSON line;
- `complete` closes JSONL, writes `conflicts.json`, then `report.md`;
- `fail` closes JSONL, writes `incomplete.json`, and never creates `report.md`;
- write errors propagate.

- [ ] **Step 5: Implement output lifecycle**

Use `fs.createWriteStream` for JSONL and await backpressure with `once(stream, "drain")`. Serialize observations with fixed field order.

Before writing:

- create the directory only if absent;
- if present, require `readdir` to return `[]`;
- never delete or overwrite an existing file.

On success, write JSON and Markdown with `fs.promises.writeFile(..., { flag: "wx" })`. On failure, write:

```json
{ "status": "incomplete", "message": "<errorMessage>" }
```

with a trailing newline.

- [ ] **Step 6: Write and implement argument parsing**

In `index.ts`, accept exactly:

```text
--xml-root <absolute path>
--output <absolute path>
--concurrency <positive integer>   # optional
--witness-limit <positive integer> # optional, default 3
```

Reject unknown, missing, relative or duplicate arguments. Resolve `metadataDir` as `packages/core/metadata` relative to `import.meta.url`.

Execution order:

1. create output;
2. call `analyzeRuleOrder`, forwarding `output.accept`;
3. call `output.complete`;
4. print the absolute `report.md` path and summary counts;
5. on error call `output.fail`, print the error to stderr and set `process.exitCode = 1`.

- [ ] **Step 7: Add package script and run Task 5 tests**

Add the package script, then run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  scripts/rule-order-analysis/render.test.ts \
  scripts/rule-order-analysis/output.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add packages/core/scripts/rule-order-analysis packages/core/package.json
git commit -m "feat: :sparkles: добавить отчёт о порядке свойств"
```

---

### Task 6: Сквозная проверка и полный анализ конфигураций

**Files:**

- Create: `packages/core/scripts/rule-order-analysis/index.test.ts`
- Do not modify: `/Users/nikita/git/round-trip/cf/**`
- Generate outside Git: `/private/tmp/nkdk-rule-order-report/**`

**Interfaces:**

- Consumes: package command from Task 5.
- Produces: verified `observations.jsonl`, `conflicts.json`, `report.md` for the supplied configurations.

- [ ] **Step 1: Write a failing command integration test**

Build two minimal XML configurations in temporary directories using existing import fixtures:

- `first` contains one object with `use` before `indexing`;
- `second` contains the same rule with `indexing` before `use`.

Spawn the package command with absolute `--xml-root` and `--output`. Assert exit code `0`, no YAML files, and:

```ts
expect(JSON.parse(conflictsJson)).toMatchObject({
  configurations: ["first", "second"],
  rules: [
    {
      conflicts: [
        {
          leftBeforeRight: { before: "indexing", after: "use", count: 1 },
          rightBeforeLeft: { before: "use", after: "indexing", count: 1 },
        },
      ],
    },
  ],
})
```

Also spawn with malformed XML and assert exit code `1`, `incomplete.json` exists and `report.md` does not.

- [ ] **Step 2: Run the integration test and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run scripts/rule-order-analysis/index.test.ts
```

Expected: FAIL until fixture construction and command integration are complete.

- [ ] **Step 3: Complete only the missing integration wiring**

Adjust the command or dependency injection needed by the test. Do not change the aggregation rule or add fallback inference from configuration-index addresses.

- [ ] **Step 4: Run focused and full repository verification**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/ruleOrderAnalysis \
  scripts/rule-order-analysis \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts \
  metadata/importFromXml/prepareYaml.test.ts \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts
pnpm --filter @nkdk/core type-check
pnpm test
```

Expected:

- all focused tests pass;
- type-check passes;
- all repository tests pass with zero failures.

- [ ] **Step 5: Commit integration coverage**

```bash
git add packages/core/scripts/rule-order-analysis/index.test.ts
git commit -m "test: :white_check_mark: проверить анализ порядка XML"
```

- [ ] **Step 6: Run the complete external analysis**

Ensure the target does not exist:

```bash
test ! -e /private/tmp/nkdk-rule-order-report
```

Then run:

```bash
pnpm --filter @nkdk/core analyze-rule-order -- \
  --xml-root /Users/nikita/git/round-trip/cf \
  --output /private/tmp/nkdk-rule-order-report
```

Expected: exit code `0` and a printed summary for exactly the sorted configurations `acc`, `all`, `clean`, `doc`, `erp`, `small`, `trade`.

- [ ] **Step 7: Validate the generated result**

Run:

```bash
test -s /private/tmp/nkdk-rule-order-report/observations.jsonl
test -s /private/tmp/nkdk-rule-order-report/conflicts.json
test -s /private/tmp/nkdk-rule-order-report/report.md
test ! -e /private/tmp/nkdk-rule-order-report/incomplete.json
node -e '
const fs = require("node:fs");
const report = JSON.parse(fs.readFileSync("/private/tmp/nkdk-rule-order-report/conflicts.json", "utf8"));
const expected = ["acc", "all", "clean", "doc", "erp", "small", "trade"];
if (JSON.stringify(report.configurations) !== JSON.stringify(expected)) process.exit(1);
if (!Number.isInteger(report.xmlFileCount) || report.xmlFileCount <= 0) process.exit(1);
if (!Number.isInteger(report.observationCount) || report.observationCount <= 0) process.exit(1);
if (!Array.isArray(report.rules)) process.exit(1);
'
```

Expected: all commands exit `0`.

- [ ] **Step 8: Review the report without changing rules**

Read:

```bash
sed -n '1,240p' /private/tmp/nkdk-rule-order-report/report.md
```

Summarize:

- number of observed rules;
- number of opposite pairs;
- number of cycles;
- number of ambiguous rule IDs;
- the candidate `rules.ts` and witnesses for every conflict.

Do not add `order`, remove snapshot fields or modify XML fixtures in this plan.

- [ ] **Step 9: Confirm final branch state**

Run:

```bash
git status --short
git log --oneline origin/develop..HEAD
```

Expected: clean worktree and only the specification, plan and temporary analyzer commits on `codex/rule-order-analysis`.
