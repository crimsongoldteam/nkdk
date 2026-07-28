# Rule Declaration Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать порядок объявления `MetadataItemRule.properties` единственным порядком обычных XML-свойств, удалить числовой `PropertyRule.order` и перестать сохранять объектный порядок в снимке конфигурации.

**Architecture:** Временный анализатор точно связывает runtime-правила с экспортами `rules.ts`, строит устойчивый топологический порядок и транзакционно переставляет исходные объявления. Общий XML-import сохраняет присутствие каждого свойства через `present`, а XML-export следует декларативному порядку и больше не читает объектный порядок из снимка; специальные порядки коллекций и интерфейсов остаются без изменений.

**Tech Stack:** TypeScript 6, Node.js 26, TypeScript Compiler API, Vitest 4, Piscina, существующие XML-import/XML-export и configuration index NKDK.

## Global Constraints

- Изменения выполняются в `/Users/nikita/git/nkdk/.worktrees/rule-order-analysis` на ветке `codex/rule-order-analysis`.
- Источником наблюдений служат непосредственные подкаталоги `/Users/nikita/git/round-trip/cf`: `acc`, `all`, `clean`, `doc`, `erp`, `small`, `trade`.
- Порядок элементов коллекций, интерфейсов, событий, команд и других специальных структур не изменяется.
- `ConfigurationXmlNode.order` остаётся в формате снимка для специальных потребителей.
- Обычный `MetadataItemRule` не читает, не копирует и не записывает `ConfigurationXmlNode.order`.
- `MetadataItemRule.properties` задаёт порядок XML через `Object.keys(rule.properties)`.
- Новое свойство сразу занимает декларативное место, даже если отсутствовало в reference XML.
- YAML продолжает сортироваться через `sortYamlRuleProperties`.
- Каждое найденное обычное XML-свойство явно сохраняется в `ConfigurationXmlNode.present`.
- `BasePropertyRule.order` и `configurationIndexPresenceFromOrder` удаляются.
- XML-фикстуры и `/Users/nikita/git/round-trip/cf` не изменяются.
- Любая неоднозначность сопоставления или недоказуемая spread-композиция прекращает миграцию без частичной записи.
- Перед завершением обязательно выполнить `pnpm test` из корня worktree.

---

### Task 1: Точная идентификация runtime-правил

**Files:**

- Modify: `packages/core/metadata/ruleOrderAnalysis/types.ts`
- Modify: `packages/core/metadata/ruleOrderAnalysis/catalog.ts`
- Modify: `packages/core/metadata/ruleOrderAnalysis/catalog.test.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/ruleOrderAnalysis/analyze.ts`

**Interfaces:**

- Consumes: экспортированные `MetadataItemRule` из файлов с точным именем `rules.ts`.
- Produces:

```ts
export interface RuleOrderSource {
  candidate: string
  filePath: string
  exportName: string
  propertyPath: readonly string[]
  declarationOrder: readonly string[]
  numericOrder: Readonly<Record<string, number>>
}

export interface RuntimeRuleOrderCatalog {
  sourceOf(rule: MetadataItemRule): RuleOrderSource | undefined
  ambiguities(): readonly { candidate: string; reason: string }[]
}

export async function buildRuntimeRuleOrderCatalog(params: { metadataDir: string }): Promise<RuntimeRuleOrderCatalog>
```

`RawRuleOrderObservation` получает обязательное поле `source: RuleOrderSource`; `ruleId` остаётся диагностическим отпечатком, но не выбирает изменяемый файл.

- [ ] **Step 1: Write failing object-identity catalog tests**

Добавить в `catalog.test.ts`:

```ts
it("distinguishes structurally equal exports by runtime identity", async () => {
  const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })

  expect(catalog.sourceOf(MetadataAttributesWithAllowedTypesRules)?.candidate).toBe(
    "commonObjects/metadataAttribute/rules.ts#MetadataAttributesWithAllowedTypesRules"
  )
  expect(catalog.sourceOf(MetadataCatalogAttributeRules)?.candidate).toBe(
    "commonObjects/metadataAttribute/rules.ts#MetadataCatalogAttributeRules"
  )
})

it("does not fall back to itemType for an unexported object", async () => {
  const catalog = await buildRuntimeRuleOrderCatalog({ metadataDir })
  const copy = {
    ...MetadataCatalogAttributeRules,
    properties: { ...MetadataCatalogAttributeRules.properties },
  }

  expect(catalog.sourceOf(copy)).toBeUndefined()
})
```

Добавить проверку статического вложенного `itemRule`: его `propertyPath` содержит путь от экспортированного родителя, а `filePath` указывает на тот же `rules.ts`.

- [ ] **Step 2: Run the catalog tests and verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/ruleOrderAnalysis/catalog.test.ts
```

Expected: FAIL because `buildRuntimeRuleOrderCatalog` and `sourceOf` do not exist.

- [ ] **Step 3: Implement the identity catalog**

В `catalog.ts`:

- импортировать каждый `rules.ts` один раз через канонический `pathToFileURL(filePath).href`;
- хранить `WeakMap<MetadataItemRule, RuleOrderSource>`;
- рекурсивно индексировать статические `nestedItemRule.itemRule` без вызова `resolveItemRule`;
- фиксировать два разных source для одного object identity как ambiguity;
- извлекать `declarationOrder` через `Object.keys(rule.properties)`;
- извлекать существующие числовые значения в `numericOrder`;
- не использовать `itemType` как запасной ключ.

- [ ] **Step 4: Add a failing worker identity test**

В `worker.test.ts` передать `metadataDir` команде анализа и проверить:

```ts
expect(result).toMatchObject({
  kind: "ruleOrderAnalysisResult",
  observations: [
    expect.objectContaining({
      source: {
        candidate: "appliedObjects/metadataCatalog/rules.ts#MetadataCatalogRules",
        declarationOrder: expect.arrayContaining(["name"]),
      },
    }),
  ],
})
```

Expected before implementation: FAIL because worker returns only `ruleId`.

- [ ] **Step 5: Resolve identity inside each worker**

Расширить команду:

```ts
{
  kind: "analyzeRuleOrder"
  configuration: string
  metadataDir: string
  assignments: ImportAssignment[]
}
```

Worker лениво строит один `RuntimeRuleOrderCatalog` на `metadataDir`, получает source непосредственно из `fact.rule` и:

- добавляет source в наблюдение;
- пропускает объект без source с отдельным счётчиком `unmatched`;
- возвращает diagnostic при ambiguity;
- очищает кэш каталога при `dispose`.

`workerPool.analyzeRuleOrder` и `analyzeRuleOrder` передают `metadataDir` без структурного fallback в главном процессе.

- [ ] **Step 6: Run focused tests and type-check**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/ruleOrderAnalysis/catalog.test.ts \
  metadata/importFromXml/worker.test.ts \
  metadata/importFromXml/workerPool.test.ts
pnpm --dir packages/core type-check
```

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/ruleOrderAnalysis packages/core/metadata/importFromXml
git commit -m "refactor: :recycle: точно связывать наблюдения с rules.ts"
```

---

### Task 2: Канонический порядок и доказательство наблюдений

**Files:**

- Create: `packages/core/metadata/ruleOrderAnalysis/canonicalOrder.ts`
- Create: `packages/core/metadata/ruleOrderAnalysis/canonicalOrder.test.ts`
- Modify: `packages/core/metadata/ruleOrderAnalysis/analyze.ts`
- Modify: `packages/core/metadata/ruleOrderAnalysis/aggregate.ts`

**Interfaces:**

- Consumes: точные `RuleOrderObservation` из Task 1.
- Produces:

```ts
export interface CanonicalRuleOrder {
  source: RuleOrderSource
  propertyKeys: readonly string[]
  observationCount: number
}

export function deriveCanonicalRuleOrders(observations: readonly RuleOrderObservation[]): readonly CanonicalRuleOrder[]

export function assertObservationSubsequence(params: {
  order: readonly string[]
  observation: RuleOrderObservation
}): void
```

- [ ] **Step 1: Write failing topological-order tests**

Создать `canonicalOrder.test.ts` с тестами:

```ts
it("uses observed constraints and declaration order as a stable tie-break", () => {
  const result = deriveCanonicalRuleOrders([
    observation({
      declarationOrder: ["name", "comment", "use", "indexing", "unseen"],
      fields: ["name", "use", "indexing"],
    }),
    observation({
      declarationOrder: ["name", "comment", "use", "indexing", "unseen"],
      fields: ["name", "comment", "indexing"],
    }),
  ])

  expect(result[0]?.propertyKeys).toEqual(["name", "comment", "use", "indexing", "unseen"])
})

it("rejects an opposite pair before producing an order", () => {
  expect(() =>
    deriveCanonicalRuleOrders([
      observation({ fields: ["use", "indexing"] }),
      observation({ fields: ["indexing", "use"] }),
    ])
  ).toThrow(/use.*indexing/)
})

it("rejects a three-node cycle", () => {
  expect(() =>
    deriveCanonicalRuleOrders([
      observation({ fields: ["a", "b"] }),
      observation({ fields: ["b", "c"] }),
      observation({ fields: ["c", "a"] }),
    ])
  ).toThrow(/cycle|цикл/i)
})
```

Также покрыть:

- отсутствующее свойство не создаёт ограничение;
- числовой `order` разрешает ничью только после declaration order;
- неизвестный observation key вызывает ошибку;
- результат сортируется побайтово по `source.candidate`;
- `assertObservationSubsequence` сообщает candidate, configuration и XML-путь.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/ruleOrderAnalysis/canonicalOrder.test.ts
```

Expected: FAIL because `canonicalOrder.ts` does not exist.

- [ ] **Step 3: Implement stable Kahn topological sorting**

Реализовать:

- все парные рёбра наблюдения;
- один adjacency set и indegree на candidate;
- очередь нулевой степени, отсортированную по позиции declaration order, затем numeric order, затем UTF-8 имени;
- явную диагностику цикла с оставшимися ключами;
- включение ненаблюдаемых declaration keys;
- финальную проверку каждого наблюдения через `assertObservationSubsequence`.

Не использовать полный порядок одного observation как готовый результат: только объединённый граф является источником истины.

- [ ] **Step 4: Expose canonical orders from analysis**

Добавить в `AnalyzeRuleOrderResult`:

```ts
canonicalOrders: readonly CanonicalRuleOrder[]
```

`analyzeRuleOrder` накапливает точные наблюдения, строит canonical orders после завершения всех конфигураций и проверяет каждое наблюдение.

- [ ] **Step 5: Run focused tests and type-check**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/ruleOrderAnalysis
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/ruleOrderAnalysis
git commit -m "feat: :sparkles: вычислять декларативный порядок правил"
```

---

### Task 3: Транзакционный переписчик `rules.ts`

**Files:**

- Create: `packages/core/scripts/rule-order-analysis/rewrite.ts`
- Create: `packages/core/scripts/rule-order-analysis/rewrite.test.ts`
- Create: `packages/core/scripts/rule-order-analysis/sourceModel.ts`
- Create: `packages/core/scripts/rule-order-analysis/sourceModel.test.ts`
- Modify: `packages/core/scripts/rule-order-analysis/index.ts`
- Modify: `packages/core/package.json`

**Interfaces:**

- Consumes: `CanonicalRuleOrder[]` from Task 2.
- Produces:

```ts
export interface RuleSourceEdit {
  filePath: string
  originalText: string
  updatedText: string
  candidates: readonly string[]
}

export function buildRuleSourceEdits(params: {
  orders: readonly CanonicalRuleOrder[]
  readFile(path: string): Promise<string>
}): Promise<readonly RuleSourceEdit[]>

export async function applyRuleSourceEdits(params: {
  edits: readonly RuleSourceEdit[]
  readFile(path: string): Promise<string>
  writeFile(path: string, text: string): Promise<void>
  verify(): Promise<void>
}): Promise<void>
```

Package command:

```json
"rewrite-rule-order": "tsx scripts/rule-order-analysis/index.ts --apply"
```

- [ ] **Step 1: Write failing source-model tests**

В `sourceModel.test.ts` использовать временные `rules.ts` и проверить:

```ts
it("reorders properties and removes numeric order without changing values", async () => {
  const source = `
export const Rules = {
  itemType: "Test",
  properties: {
    use: { type: "boolean", order: 2 },
    name: { type: "string", order: 1 },
    unseen: { type: "string" },
  },
}
`
  const [edit] = await editsFor(source, ["name", "use", "unseen"])

  expect(edit?.updatedText).toContain(`properties: {
    name: { type: "string" },
    use: { type: "boolean" },
    unseen: { type: "string" },
  }`)
})
```

Добавить тесты:

- комментарий перемещается вместе со свойством;
- spread моделируется как упорядоченная группа;
- override после spread сохраняет insertion position исходного ключа;
- совместимый общий fragment получает единый порядок;
- несовместимые потребители общего fragment вызывают ошибку;
- computed property вызывает ошибку;
- никакой файл не записывается при ошибке построения edits.

- [ ] **Step 2: Run source-model tests and verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run scripts/rule-order-analysis/sourceModel.test.ts
```

Expected: FAIL because `sourceModel.ts` does not exist.

- [ ] **Step 3: Implement the TypeScript source model**

Через `typescript` Compiler API:

- разобрать все source files из `orders[].source.filePath`;
- индексировать variable declarations, object literals, imports и spread identifiers;
- моделировать стандартную семантику object spread: override меняет значение, но не insertion position;
- проецировать canonical order на локальные объявления каждого литерала;
- строить ограничения между AST-элементами, включая spread как упорядоченную группу;
- переставлять полные диапазоны property nodes вместе с leading comments;
- удалять только property assignment с именем `order` внутри `PropertyRule`;
- печатать изменённый литерал, сохраняя остальной текст файла побайтно.

После построения каждого edit повторно распарсить `updatedText`; syntax diagnostics должны быть пустыми.

- [ ] **Step 4: Write failing transaction tests**

В `rewrite.test.ts`:

```ts
it("restores only its own files when verification fails", async () => {
  const files = new Map([
    ["/rules/a.ts", "original-a"],
    ["/rules/b.ts", "original-b"],
  ])

  await expect(
    applyRuleSourceEdits({
      edits: edits(files),
      readFile: async (path) => files.get(path)!,
      writeFile: async (path, text) => void files.set(path, text),
      verify: async () => {
        throw new Error("verification failed")
      },
    })
  ).rejects.toThrow("verification failed")

  expect(files).toEqual(
    new Map([
      ["/rules/a.ts", "original-a"],
      ["/rules/b.ts", "original-b"],
    ])
  )
})
```

Добавить проверку успешной записи в UTF-8 и отказ, если файл изменился между чтением и записью.

- [ ] **Step 5: Implement transactional application**

`applyRuleSourceEdits`:

1. перед первой записью повторно читает файл и сравнивает с `originalText`;
2. записывает edits в побайтовом порядке `filePath`;
3. вызывает `verify`;
4. при исключении восстанавливает только записанные файлы их `originalText`;
5. если восстановление не удалось, включает оба сообщения в итоговую ошибку.

- [ ] **Step 6: Add CLI apply mode**

`index.ts --apply`:

- принимает существующие `--xml-root`, `--output`, `--concurrency`, `--witness-limit`;
- требует чистый Git worktree до анализа;
- сначала строит полный result и source edits;
- пишет `rewrite-plan.json` в output;
- применяет edits только после успешного построения всего плана;
- verification повторно импортирует правила, сверяет exact candidate и вызывает `assertObservationSubsequence`;
- не изменяет XML и не пишет YAML.

- [ ] **Step 7: Run tests and type-check**

Run:

```bash
pnpm --dir packages/core exec vitest run scripts/rule-order-analysis
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/scripts/rule-order-analysis packages/core/package.json
git commit -m "feat: :sparkles: безопасно упорядочивать свойства rules.ts"
```

---

### Task 4: Декларативный порядок XML-export

**Files:**

- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`

**Interfaces:**

- Consumes: порядок `Object.keys(rule.properties)`.
- Produces:

```ts
export function getOrderedKeysToXML<Rule extends MetadataItemRule>(params: { rule: Rule; tag?: string[] }): string[]
```

Параметры `context` и `referenceMetadata` удаляются: функция больше не зависит от снимка или reference order.

- [ ] **Step 1: Write failing declaration-order tests**

В `helpers.test.ts`:

```ts
it("uses declaration order instead of XML name order", () => {
  const rule = {
    itemType: "TestItem" as never,
    properties: {
      lastAlphabetically: { type: "string", xml: "Zulu" },
      firstAlphabetically: { type: "string", xml: "Alpha" },
    },
  }

  expect(getOrderedKeysToXML({ rule })).toEqual(["lastAlphabetically", "firstAlphabetically"])
})
```

В `fromYAMLToXML.test.ts` добавить:

- reference XML с обратным порядком не меняет declaration order;
- `ConfigurationXmlNode.order` с обратным порядком не меняет declaration order;
- новое YAML-свойство, отсутствующее в reference XML, записывается на declaration position;
- `xmlParents` создаются в порядке первого объявленного свойства группы;
- tag-фильтр сохраняет относительный declaration order оставшихся ключей.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/property/helpers.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: at least the XML-name and snapshot-order assertions FAIL.

- [ ] **Step 3: Simplify property ordering**

В `helpers.ts`:

- удалить `order` из `PathInfo`, `FlatEntry` и сравнений;
- строить результат из порядка обхода `Object.entries(rule.properties)`;
- сохранить фильтры `runtimeOnly`, `syncExternalOnly`, `filePath` и `tag`;
- сохранить группировку `xmlParents`, не сортируя свойства внутри группы по XML-имени.

В `fromYAMLToXML.ts`:

- вызвать новый `getOrderedKeysToXML({ rule, tag })`;
- удалить `indexOrder`, `referenceOrder` и их финальную сортировку;
- удалить `copyConfigurationIndexNodeOrder`;
- оставить специальные nested/collection exporters без изменений.

- [ ] **Step 4: Run tests and type-check**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/property/helpers.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/property/yamlPropertyOrder.test.ts
pnpm --dir packages/core type-check
```

Expected: PASS; YAML priority test remains unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/property
git commit -m "refactor: :recycle: экспортировать XML в порядке rules.ts"
```

---

### Task 5: Явное присутствие вместо объектного порядка снимка

**Files:**

- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/configurationIndex/referenceView.ts`
- Modify: `packages/core/metadata/configurationIndex/referenceView.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.test.ts`

**Interfaces:**

- Consumes: фактический `presentInXML` общего XML-import.
- Produces: `ConfigurationXmlNode.present` как единственный снимковый факт присутствия обычного свойства.

- [ ] **Step 1: Write failing import-presence tests**

В `fromXMLToYAML.test.ts` проверить:

```ts
expect(fragment.xmlNodes).toContainEqual({
  logicalAddress: "Тест.Объект",
  present: ["name", "explicitDefault", "comment"],
})
expect(fragment.xmlNodes).not.toContainEqual(expect.objectContaining({ order: expect.any(Array) }))
```

Добавить отдельные случаи:

- alias записывает canonical property key в `present` и alias отдельно;
- отсутствующий optional key не попадает в `present`;
- одинаковый ключ из повторного XML-source дедуплицируется;
- `present` сериализуется по declaration order, а не по XML order.

- [ ] **Step 2: Run import test and verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: FAIL because common traversal still writes `order` and records `present` only selectively.

- [ ] **Step 3: Record every observed property as present**

В `fromXMLToYAML.ts`:

- накапливать canonical keys с `presentInXML === true` отдельно для каждого `xmlNodeLogicalAddress`;
- после обхода идти по `Object.keys(rule.properties)` и вызывать `collector.setPresent` для накопленных
  ключей в declaration order;
- удалить специальный ограниченный вызов `setPresent` для implicit/default, поскольку общий вызов его покрывает;
- оставить `RulePropertyOrderCollector.accept` до завершения миграционного инструмента;
- удалить `observation.collector.setOrder` из общего цикла;
- не менять `ConfigurationIndexCollector.setPresent`: специальные обработчики сохраняют свой текущий договор.

- [ ] **Step 4: Write failing presence-reader tests**

В `referenceView.test.ts`:

```ts
it("does not treat order as property presence", () => {
  const context = contextWithNode({
    order: ["name"],
    present: [],
  })

  expect(isConfigurationIndexPropertyPresent(context, "name")).toBe(false)
})
```

В `baseFormIndex.test.ts` проверить, что доступность обычного свойства определяется `present`, а специальный structural order продолжает проецироваться.

- [ ] **Step 5: Remove order-as-presence**

В `referenceView.ts` оставить:

```ts
return node?.present?.includes(propertyKey) === true
```

В `baseFormIndex.ts`:

- `isXmlNodePropertyAvailable` использует `present` и XML-value facts;
- `xmlNodePropertyKeys` получает обычные property keys из `present`;
- structural `projectedPropertyOrder` остаётся для специальной BaseForm-проекции, но не доказывает presence.

- [ ] **Step 6: Verify special collection order**

Добавить или уточнить тест в `metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`, который подтверждает, что collection handler всё ещё вызывает `setOrder` и round-trip сохраняет порядок элементов.

- [ ] **Step 7: Run focused tests and type-check**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/configurationIndex/referenceView.test.ts \
  metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts \
  packages/core/metadata/configurationIndex/referenceView.ts \
  packages/core/metadata/configurationIndex/referenceView.test.ts \
  packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts \
  packages/core/metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts
git commit -m "refactor: :recycle: отделить присутствие XML-свойств от порядка"
```

---

### Task 6: Миграция правил и удаление числового `order`

**Files:**

- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Create: `packages/core/metadata/orchestration/property/types.contract.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/types.ts`
- Modify generated set: `packages/core/metadata/**/rules.ts`
- Modify tests containing PropertyRule `order`: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Modify tests containing PropertyRule `order`: `packages/core/metadata/ruleOrderAnalysis/fingerprint.test.ts`

**Production `rules.ts` with current numeric `order`:**

- `packages/core/metadata/appliedObjects/metadataCommand/rules.ts`
- `packages/core/metadata/appliedObjects/metadataCommonCommand/rules.ts`
- `packages/core/metadata/appliedObjects/metadataEventSubscription/rules.ts`
- `packages/core/metadata/commonObjects/additionalIndex/rules.ts`
- `packages/core/metadata/commonObjects/characteristicsDescription/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldUseRestriction/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/rules.ts`
- `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/rules.ts`
- `packages/core/metadata/commonObjects/homePageWorkArea/rules.ts`
- `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- `packages/core/metadata/commonObjects/metadataRegisterDimension/rules.ts`
- `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- `packages/core/metadata/commonObjects/metadataRegisterResource/rules.ts`
- `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts`
- `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- `packages/core/metadata/forms/elements/table/rules.ts`

**Interfaces:**

- Consumes: verified rewrite command from Task 3.
- Produces: rules physically ordered without `BasePropertyRule.order` or `configurationIndexPresenceFromOrder`.

- [ ] **Step 1: Run the analyzer in planning mode**

Run:

```bash
test ! -e /private/tmp/nkdk-rule-declaration-plan
pnpm --dir packages/core analyze-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --output /private/tmp/nkdk-rule-declaration-plan \
  --concurrency 6 \
  --witness-limit 3
```

Expected:

- 7 configurations;
- 148662 observations, unless fresh XML contents changed and the report explains the new exact count;
- 0 unmatched observations;
- 0 conflicts and 0 cycles;
- one exact `RuleOrderSource` per observation;
- `canonicalOrders` contains every observed rule.

- [ ] **Step 2: Run the rewrite transaction**

Run:

```bash
test ! -e /private/tmp/nkdk-rule-declaration-rewrite
pnpm --dir packages/core rewrite-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --output /private/tmp/nkdk-rule-declaration-rewrite \
  --concurrency 6 \
  --witness-limit 3
```

Expected: exit 0; `rewrite-plan.json` lists every changed file and verification confirms every observation as a subsequence.

- [ ] **Step 3: Write the failing type-removal check**

Создать `packages/core/metadata/orchestration/property/types.contract.test.ts`:

```ts
type HasOrder = "order" extends keyof BasePropertyRule ? true : false
expectTypeOf<HasOrder>().toEqualTypeOf<false>()

type HasPresenceFromOrder = "configurationIndexPresenceFromOrder" extends keyof BasePropertyRule ? true : false
expectTypeOf<HasPresenceFromOrder>().toEqualTypeOf<false>()
```

Run:

```bash
pnpm --dir packages/core type-check
```

Expected before removing fields: FAIL through the explicit type assertion.

- [ ] **Step 4: Remove obsolete property fields and branches**

В `types.ts` удалить:

```ts
order?: number
configurationIndexPresenceFromOrder?: false
```

Удалить `configurationIndexPresenceFromOrder` из:

- `packages/core/metadata/commonObjects/metadataPath/types.ts`;
- `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`;
- `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`;
- `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts`;
- соответствующих тестов.

Проверить `helpers.ts` и удалить определения `order` из `PathInfo`/`FlatEntry`, обращения
`ruleProp.order` и сравнения числового порядка. После удаления команда
`rg -n "ruleProp\\.order|propertyRule\\.order" packages/core/metadata/orchestration/property`
не должна находить совпадений.

- [ ] **Step 5: Prove no numeric PropertyRule order remains**

Run:

```bash
rg -n "order: [0-9]" packages/core/metadata -g '*.ts'
```

Expected: совпадения допустимы только в тестовых данных `ConfigurationXmlNode.order` или иных доменных объектах; ни одно совпадение не находится внутри `MetadataItemRule.properties`.

Дополнительно:

```bash
rg -n "configurationIndexPresenceFromOrder|ruleProp\\.order|propertyRule\\.order" packages/core
```

Expected: no matches.

- [ ] **Step 6: Run metadata tests and type-check**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata
pnpm --dir packages/core type-check
git diff --check
```

Expected: PASS and no whitespace errors.

- [ ] **Step 7: Commit**

Использовать сообщение:

```bash
git add packages/core/metadata packages/core/scripts/rule-order-analysis
git commit -m "refactor: :recycle: задать порядок XML объявлениями rules.ts" -m "Порядок обычных XML-свойств больше не дублируется числовыми полями и снимком конфигурации. Специальные порядки коллекций сохранены."
```

---

### Task 7: Сквозная проверка миграции

**Files:**

- Modify: `packages/core/scripts/rule-order-analysis/index.test.ts`
- Modify: `docs/superpowers/specs/2026-07-28-rule-declaration-order-design.md` only if implementation exposed a verified constraint that the approved spec did not state
- Generate outside Git: `/private/tmp/nkdk-rule-declaration-final/**`

**Interfaces:**

- Consumes: migrated rules and simplified runtime from Tasks 1–6.
- Produces: fresh proof that declaration order covers all configurations and ordinary object order is absent from new snapshots.

- [ ] **Step 1: Write a failing end-to-end command test**

В `index.test.ts` создать две временные конфигурации из существующей минимальной XML-фикстуры и выполнить command без изменения входов. Проверить:

```ts
expect(result.exitCode).toBe(0)
expect(report.conflictCount).toBe(0)
expect(report.unmatchedObservationCount).toBe(0)
expect(report.declarationVerificationFailures).toEqual([])
expect(snapshot.xmlNodesForOrdinaryRules).not.toContainEqual(expect.objectContaining({ order: expect.any(Array) }))
expect(snapshot.specialCollectionNode).toMatchObject({
  order: ["first", "second"],
})
```

Expected before final wiring: FAIL on declaration verification or ordinary snapshot order.

- [ ] **Step 2: Wire declaration verification into the command result**

Исправить command/result assembly, чтобы:

- итоговый JSON содержал `declarationVerificationFailures`;
- ordinary rule nodes проверялись отдельно от special order nodes;
- команда возвращала code 1 при первой failure;
- входной XML оставался read-only.

- [ ] **Step 3: Run focused verification**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/ruleOrderAnalysis \
  scripts/rule-order-analysis \
  metadata/orchestration/property/helpers.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  metadata/forms/clientApplicationForm/baseFormIndex.test.ts
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 4: Run the complete repository test suite**

Run:

```bash
pnpm test
```

Expected: all `packages/core`, `packages/platform` and `packages/mcp` tests PASS with zero failures.

- [ ] **Step 5: Run final seven-configuration declaration verification**

Run:

```bash
test ! -e /private/tmp/nkdk-rule-declaration-final
pnpm --dir packages/core analyze-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --output /private/tmp/nkdk-rule-declaration-final \
  --concurrency 6 \
  --witness-limit 3
```

Expected:

- configurations exactly `acc`, `all`, `clean`, `doc`, `erp`, `small`, `trade`;
- 0 unmatched;
- 0 conflicts;
- 0 cycles;
- 0 declaration verification failures;
- every observation is a subsequence of its exact runtime rule.

- [ ] **Step 6: Run XML round-trip for every supplied configuration**

Run each command from the worktree root:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/acc ./.agents/skills/round-trip-xml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all ./.agents/skills/round-trip-xml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/clean ./.agents/skills/round-trip-xml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/doc ./.agents/skills/round-trip-xml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/erp ./.agents/skills/round-trip-xml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/small ./.agents/skills/round-trip-xml/round-trip.sh
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/trade ./.agents/skills/round-trip-xml/round-trip.sh
```

Expected: every command exits 0 with no property-order diff. If the helper reports an unrelated existing diff, save its exact path and prove the same diff on `origin/develop` before classifying it as baseline.

- [ ] **Step 7: Verify source and worktree integrity**

Run:

```bash
git status --short
git diff --check
git -C /Users/nikita/git/round-trip status --short -- cf
```

Expected:

- only intended repository files are modified before the final commit;
- no whitespace errors;
- no change under `/Users/nikita/git/round-trip/cf`.

- [ ] **Step 8: Commit integration coverage**

```bash
git add packages/core/scripts/rule-order-analysis/index.test.ts
git commit -m "test: :white_check_mark: проверить декларативный порядок XML"
```

- [ ] **Step 9: Finish the development branch**

Invoke `superpowers:verification-before-completion`, then `superpowers:requesting-code-review`, then `superpowers:finishing-a-development-branch`. Preserve the worktree unless the user explicitly chooses local merge and cleanup.
