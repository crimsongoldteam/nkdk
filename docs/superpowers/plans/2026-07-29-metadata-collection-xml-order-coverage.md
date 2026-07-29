# Metadata Collection XML Order Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать и записать `xmlOrder` для всех конкретных runtime-правил, представленных в семи `cf` и трёх `cfe`, включая стандартные реквизиты, табличные части и другие элементы metadata-коллекций.

**Architecture:** Общий импорт metadata-коллекций наследует `DirectImportTraversal` целиком, чтобы временный сборщик порядка и путь XML доходили до каждого элемента. Если для сохранения присутствия свойств создаётся техническая копия `itemRule`, локальный переходник возвращает в наблюдение исходное правило; рабочая модель и каталог правил остаются неизменными. После исправления реальные источники повторно анализируются, оставшиеся ненаблюдавшиеся правила проверяются по фактическому использованию, а доказанные порядки записываются в `rules.ts`.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, pnpm, существующие XML-import, configuration index и анализатор `ruleOrderAnalysis`.

## Global Constraints

- Работать в `/Users/nikita/git/nkdk/.worktrees/rule-order-analysis` на ветке `codex/rule-order-analysis`.
- Не изменять существующие XML-фикстуры.
- Не считать правило общей заготовкой только из-за расположения в `commonObjects`.
- Каждое правило, самостоятельно переданное в XML-import и представленное в исходном XML, обязано получить наблюдаемый `xmlOrder`.
- В `xmlOrder` входят только наблюдавшиеся свойства; ненаблюдавшиеся свойства экспортируются в конце в порядке объявления.
- Порядок элементов коллекций остаётся в YAML или специальном `ConfigurationXmlNode.order`.
- Источники: семь каталогов `/Users/nikita/git/round-trip/cf` и три каталога `/Users/nikita/git/round-trip/cfe`; базой расширений является `cf/all`.
- Контрольный объект: табличная часть из `/Users/nikita/git/round-trip/cf/all/Catalogs/СправочникПолный.xml`, включая `internalInfo`.
- Для проверки использовать `round-trip-yaml`; изменения `cf/all` в родительском репозитории разрешено восстановить после фиксации результата.
- Временный анализатор не удалять без отдельной явной команды пользователя.
- Перед завершением выполнить `pnpm test` из корня worktree.

---

### Task 1: Передать анализатор во все элементы metadata-коллекций

**Files:**

- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts`

**Interfaces:**

- Consumes: `DirectImportTraversal.ruleOrderCollector?: RulePropertyOrderCollector`
- Consumes: `DirectImportTraversal.sourceXmlPath?: string`
- Produces: вложенный `DirectImportTraversal`, сохраняющий все поля родительского traversal
- Produces: наблюдение, в котором техническая копия `itemRule` заменена исходным `MetadataItemRule`

- [ ] **Step 1: Зарегистрировать тестовую коллекцию с сохранением присутствия**

В `fromXMLToYAML.test.ts` рядом с существующими тестовыми регистрациями добавить:

```ts
registerMetadataItemCollectionRule({
  propertyType: "TestPreservedPresenceCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  keyField: "name",
  preserveItemPropertyPresence: true,
})
```

- [ ] **Step 2: Написать падающий тест переноса наблюдения**

Расширить `runDirectRule` необязательными параметрами анализа:

```ts
function runDirectRule(
  type: PropertyRuleType,
  xml: Record<string, unknown>,
  context = mockContextFromXML(),
  analysis?: {
    accept: RulePropertyOrderCollector["accept"]
    sourceXmlPath: string
  }
) {
  const collector = createLocalIndexesCollector()
  const deferred = createDeferredValuePathCollector()
  const importContext = { ...context, exportToYAML: { toTyped: true } }
  const yaml = importPropertiesFromXMLToYAML({
    context: importContext,
    rule: {
      itemType: "TestOwner",
      properties: { items: { type, xml: "Items", yaml: "Элементы" } },
    } as MetadataItemRule,
    sources: [{ context: importContext, xml }],
    yamlPath: [],
    rulePath: [],
    collector,
    deferred,
    ...(analysis === undefined
      ? {}
      : {
          ruleOrderCollector: { accept: analysis.accept },
          sourceXmlPath: analysis.sourceXmlPath,
        }),
  })
  return { yaml, localIndexes: collector.finish(), deferred: deferred.finish() }
}
```

Добавить тест:

```ts
it("передаёт наблюдение элемента и связывает техническую копию с исходным правилом", () => {
  const facts: RulePropertyOrderFact[] = []
  const indexCollector = createConfigurationIndexCollector()

  runDirectRule(
    "TestPreservedPresenceCollection" as PropertyRuleType,
    { Items: { Item: { Name: "Первый", Value: "a" } } },
    withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Владелец.A"),
    {
      accept: (fact) => facts.push(fact),
      sourceXmlPath: "/Catalogs/Test.xml",
    }
  )

  expect(facts).toContainEqual(
    expect.objectContaining({
      rule: itemRule,
      sourceXmlPath: "/Catalogs/Test.xml",
      fields: ["name", "value"],
    })
  )
})
```

Импортировать типы `RulePropertyOrderFact` и `RulePropertyOrderCollector` из
`../property/importYamlTypes`.

- [ ] **Step 3: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts
```

Expected: FAIL — факт элемента отсутствует, потому что вложенный traversal теряет
`ruleOrderCollector` и `sourceXmlPath`.

- [ ] **Step 4: Наследовать traversal и сопоставить копию правила**

В `fromXMLToYAML.ts` сохранить исходное и фактически импортируемое правила:

```ts
const sourceItemRule = params.itemRule
const itemRule =
  params.preserveItemPropertyPresence === true
    ? withPreservedPropertyPresence(sourceItemRule)
    : sourceItemRule
```

Добавить локальный переходник:

```ts
function remapItemRuleCollector(
  collector: RulePropertyOrderCollector | undefined,
  importedRule: MetadataItemRule,
  sourceRule: MetadataItemRule
): RulePropertyOrderCollector | undefined {
  if (collector === undefined || importedRule === sourceRule) return collector
  return {
    accept(fact) {
      collector.accept(fact.rule === importedRule ? { ...fact, rule: sourceRule } : fact)
    },
  }
}
```

При вызове `importMetadataItemFromXMLToYAML` собирать traversal через spread:

```ts
traversal: enterNestedYamlRule(
  {
    ...params.traversal,
    yamlPath,
    collector: bufferedCollector?.collector ?? params.traversal.collector,
    deferred: bufferedDeferred?.collector ?? params.traversal.deferred,
    ruleOrderCollector: remapItemRuleCollector(
      params.traversal.ruleOrderCollector,
      itemRule,
      sourceItemRule
    ),
  },
  itemRule.itemType
),
```

Не менять `sourceXmlPath`: он наследуется из `params.traversal`.

- [ ] **Step 5: Запустить тесты и type-check**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  metadata/orchestration/metadataItem/fromXMLToYAML.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts
pnpm --dir packages/core type-check
git diff --check
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать исправление**

```bash
git add \
  packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts
git commit -m "fix: :bug: собирать порядок элементов metadata-коллекций"
```

---

### Task 2: Доказать наблюдение стандартных реквизитов и табличных частей

**Files:**

- Modify: `packages/core/metadata/importFromXml/worker.test.ts`

**Interfaces:**

- Uses fixture: `packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/full.xml`
- Requires candidates:
  - `commonObjects/standardAttributeDescription/rules.ts#StandardAttributeDescriptionRules`
  - `commonObjects/metadataAttribute/rules.ts#MetadataCatalogAttributeRules`
  - `commonObjects/metadataTabularSection/rules.ts#MetadataTabularSectionRules`
  - `commonObjects/metadataAttribute/rules.ts#MetadataTabularSectionAttributeRules`

- [ ] **Step 1: Написать интеграционный тест рабочего XML-import**

В блок `XML import worker rule order analysis` добавить:

```ts
it("собирает порядок стандартных реквизитов и табличной части с internalInfo", async () => {
  const outputDir = createTempDir("rule-order-catalog-collections")
  await initializeWorker(outputDir)
  const assignment = catalogAssignment({
    itemName: "СправочникПолный",
    targetProjectPath: "Справочник/СправочникПолный/Свойства.yaml",
    logicalAddress: "Справочник.СправочникПолный",
    xmlFiles: [{ role: "metadata", sourcePath: catalogFullXmlPath }],
  })

  const result = await runImportWorkerCommand({
    kind: "analyzeRuleOrder",
    configuration: "all",
    metadataDir,
    assignments: [assignment],
  })
  if (result?.kind !== "ruleOrderAnalysisFirstPassResult") {
    throw new Error("Ожидался первый проход анализа порядка")
  }

  const candidates = result.observations.map(({ source }) => source.candidate)
  expect(candidates).toContain(
    "commonObjects/standardAttributeDescription/rules.ts#StandardAttributeDescriptionRules"
  )
  expect(candidates).toContain(
    "commonObjects/metadataAttribute/rules.ts#MetadataCatalogAttributeRules"
  )
  expect(candidates).toContain(
    "commonObjects/metadataTabularSection/rules.ts#MetadataTabularSectionRules"
  )
  expect(candidates).toContain(
    "commonObjects/metadataAttribute/rules.ts#MetadataTabularSectionAttributeRules"
  )

  const tabularFields = result.observations
    .filter(({ source }) =>
      source.candidate === "commonObjects/metadataTabularSection/rules.ts#MetadataTabularSectionRules"
    )
    .flatMap(({ fields }) => fields)
  expect(tabularFields).toContain("internalInfo")
  expect(result.unmatchedObservationCount).toBe(0)
})
```

- [ ] **Step 2: Запустить тест и подтвердить GREEN после Task 1**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/importFromXml/worker.test.ts
```

Expected: PASS; до исправления Task 1 новый тест должен падать на отсутствии четырёх candidates.

- [ ] **Step 3: Проверить физический порядок контрольной табличной части**

Run:

```bash
sed -n '498,570p' \
  packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/full.xml
```

Expected: в репозиторной фикстуре контейнеры табличной части идут как `InternalInfo`, затем
`Properties`, затем `ChildObjects`; наблюдения содержат `internalInfo`. Реальный `cf/all`
проверяется отдельно в Task 5, потому что там `InternalInfo` расположен после `ChildObjects`.

- [ ] **Step 4: Зафиксировать интеграционный тест**

```bash
git add packages/core/metadata/importFromXml/worker.test.ts
git commit -m "test: :white_check_mark: проверить порядок вложенных metadata-объектов"
```

---

### Task 3: Повторно проверить все конкретные runtime-правила

**Files:**

- No intended source changes
- Generate outside repository: `/private/tmp/nkdk-collection-order-plan/**`

**Interfaces:**

- Requires:
  - `skippedObservationCount === 0`
  - `ambiguities.length === 0`
  - no conflicts
  - no cycles
- Produces: полный список оставшихся `unobservedSources`

- [ ] **Step 1: Запустить полный анализ без записи**

Run:

```bash
test ! -e /private/tmp/nkdk-collection-order-plan
pnpm --dir packages/core analyze-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-collection-order-plan \
  --concurrency 6 \
  --witness-limit 3
```

Expected: ровно семь `cf` и три `cfe`; анализ завершается без ошибки.

- [ ] **Step 2: Проверить обязательные правила в наблюдениях**

Run:

```bash
rg -n \
  'StandardAttributeDescriptionRules|MetadataTabularSectionRules|MetadataCatalogAttributeRules|MetadataCommandRules|MetadataEnumerationValueRules|FormParameterRules' \
  /private/tmp/nkdk-collection-order-plan/observations.jsonl
```

Expected: для каждого правила, реально представленного в XML, существует хотя бы одно наблюдение.

- [ ] **Step 3: Проверить строгие инварианты отчёта**

Run:

```bash
node - <<'NODE'
const report = require("/private/tmp/nkdk-collection-order-plan/conflicts.json")
const conflicts = report.rules.reduce((sum, rule) => sum + rule.conflicts.length, 0)
const cycles = report.rules.reduce((sum, rule) => sum + rule.cycles.length, 0)
if (report.skippedObservationCount !== 0) throw new Error(`skipped=${report.skippedObservationCount}`)
if (report.ambiguities.length !== 0) throw new Error(`ambiguities=${report.ambiguities.length}`)
if (conflicts !== 0) throw new Error(`conflicts=${conflicts}`)
if (cycles !== 0) throw new Error(`cycles=${cycles}`)
console.log({
  observations: report.observationCount,
  canonicalOrders: report.canonicalOrders.length,
  unobservedSources: report.unobservedSources.length,
})
NODE
```

Expected: все четыре значения ошибок равны нулю.

- [ ] **Step 4: Проверить каждое оставшееся ненаблюдавшееся правило**

Вывести список:

```bash
node - <<'NODE'
const report = require("/private/tmp/nkdk-collection-order-plan/conflicts.json")
for (const source of report.unobservedSources) console.log(source.candidate)
NODE
```

Для каждого кандидата проверить:

1. регистрируется ли он как самостоятельный `itemRule` или вызывается через
   `importMetadataItemFromXMLToYAML`;
2. присутствует ли соответствующий XML-элемент в `cf` или `cfe`;
3. является ли правило только общей заготовкой либо относится к типу, отсутствующему в источниках.

Если правило самостоятельно импортируется и его XML-элемент присутствует, анализ не применять:
зафиксировать candidate и XML-путь, добавить падающий тест в конкретный маршрут traversal и
вернуться к Task 1. Не выводить порядок из объявления `properties`.

- [ ] **Step 5: Зафиксировать проверенный результат**

Expected before proceeding:

- нет пропущенных runtime-наблюдений;
- нет конкретного правила, представленного в XML, без наблюдения;
- оставшиеся `unobservedSources` — только заготовки или отсутствующие в источниках типы.

---

### Task 4: Записать новые `xmlOrder` и проверить идемпотентность

**Files:**

- Modify: конкретные `packages/core/metadata/**/rules.ts`, выбранные анализатором
- Generate outside repository:
  - `/private/tmp/nkdk-collection-order-apply/**`
  - `/private/tmp/nkdk-collection-order-after/**`
  - `/private/tmp/nkdk-collection-order-idempotent/**`

**Interfaces:**

- Consumes: canonical orders из Task 3
- Produces: частичные `MetadataItemRule.xmlOrder`
- Preserves: порядок `properties` и `ConfigurationXmlNode.order`

- [ ] **Step 1: Проверить чистоту worktree**

Run:

```bash
git status --short
```

Expected: no output; `rewrite-rule-order` требует чистый worktree.

- [ ] **Step 2: Применить вычисленный порядок**

Run:

```bash
test ! -e /private/tmp/nkdk-collection-order-apply
pnpm --dir packages/core rewrite-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-collection-order-apply \
  --concurrency 6 \
  --witness-limit 3
```

Expected: изменяются только `rules.ts` наблюдавшихся конкретных правил.

- [ ] **Step 3: Проверить изменения**

Run:

```bash
git diff --stat
git diff --check
git diff -- packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts
git diff -- packages/core/metadata/commonObjects/metadataTabularSection/rules.ts
```

Expected: добавлены `xmlOrder`; массивы содержат только ключи соответствующих `properties`.

- [ ] **Step 4: Повторить анализ после записи**

Run:

```bash
test ! -e /private/tmp/nkdk-collection-order-after
pnpm --dir packages/core analyze-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-collection-order-after \
  --concurrency 6 \
  --witness-limit 3
```

Expected: ноль пропусков, неоднозначностей, конфликтов и циклов; каждое наблюдение является
подпоследовательностью текущего `xmlOrder`.

- [ ] **Step 5: Запустить целевые тесты**

Run:

```bash
pnpm --dir packages/core exec vitest run \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  metadata/importFromXml/worker.test.ts \
  metadata/orchestration/property/xmlPropertyOrder.test.ts \
  metadata/orchestration/property/fromYAMLToXML.test.ts
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать новые порядки**

```bash
git add packages/core/metadata
git commit -m "feat: :sparkles: дополнить порядок XML элементов коллекций"
```

- [ ] **Step 7: Доказать идемпотентность переписчика**

Run:

```bash
test ! -e /private/tmp/nkdk-collection-order-idempotent
pnpm --dir packages/core rewrite-rule-order \
  --xml-root /Users/nikita/git/round-trip/cf \
  --extension-root /Users/nikita/git/round-trip/cfe \
  --extension-base all \
  --output /private/tmp/nkdk-collection-order-idempotent \
  --concurrency 6 \
  --witness-limit 3
git status --short
```

Expected: `rewrite-plan.json` содержит пустой массив; worktree чистый.

---

### Task 5: Проверить round-trip `cf/all`

**Files:**

- No intended source changes
- Temporarily modifies: `/Users/nikita/git/round-trip/cf/all/**`

**Interfaces:**

- Uses: `.agents/skills/round-trip-yaml/round-trip.sh`
- XML source and comparison target: `/Users/nikita/git/round-trip/cf/all`

- [ ] **Step 1: Зафиксировать исходное состояние родительского репозитория**

Run:

```bash
git -C /Users/nikita/git/round-trip status --short -- cf/all
```

Expected: состояние записано в журнал выполнения; пользователь разрешил восстановить `cf/all`.

- [ ] **Step 2: Выполнить полный YAML round-trip**

Run:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 30
```

Expected: команда завершается; XML-diff либо отсутствует, либо классифицирован относительно
сохранённого результата до исправления порядка.

- [ ] **Step 3: Проверить контрольный каталог и табличную часть**

Run:

```bash
git -C /Users/nikita/git/round-trip diff -- \
  cf/all/Catalogs/СправочникПолный.xml
```

Expected: порядок `Properties` → `ChildObjects` → `InternalInfo` сохранён; новых перестановок
стандартных реквизитов, реквизитов и табличной части нет.

- [ ] **Step 4: Восстановить только проверяемую конфигурацию**

Run:

```bash
git -C /Users/nikita/git/round-trip restore -- cf/all
git -C /Users/nikita/git/round-trip status --short -- cf/all
```

Expected: `cf/all` возвращён к состоянию HEAD родительского репозитория; другие каталоги не
затронуты.

---

### Task 6: Выполнить финальную проверку и сохранить анализатор

**Files:**

- No intended source changes

**Interfaces:**

- Analyzer remains callable through `analyze-rule-order` and `rewrite-rule-order`
- Deletion requires a future explicit user command

- [ ] **Step 1: Проверить сохранность анализатора**

Run:

```bash
test -d packages/core/metadata/ruleOrderAnalysis
test -d packages/core/scripts/rule-order-analysis
rg -n '"analyze-rule-order"|"rewrite-rule-order"' packages/core/package.json
```

Expected: все проверки успешны.

- [ ] **Step 2: Запустить статические проверки**

Run:

```bash
pnpm --dir packages/core type-check
git diff --check
git status --short
```

Expected: type-check проходит; worktree чистый.

- [ ] **Step 3: Запустить все тесты проекта**

Run:

```bash
pnpm test
```

Expected: все пакеты `packages/*` проходят тесты.

- [ ] **Step 4: Сохранить итоговые доказательства**

В итоговом сообщении указать:

- количество наблюдений и канонических порядков до и после исправления;
- список оставшихся ненаблюдавшихся правил и причину для каждого;
- файлы, получившие новый `xmlOrder`;
- результат round-trip `cf/all`;
- результат `pnpm test`;
- каталоги отчётов в `/private/tmp`;
- коммиты реализации.

Не удалять временный анализатор.
