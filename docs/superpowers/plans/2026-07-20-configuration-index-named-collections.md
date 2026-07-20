# Configuration Index Named Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Научить общий импорт XML адресовать именованные metadata-item коллекции в файле индекса конфигурации через декларативную регистрацию коллекции.

**Architecture:** `registerMetadataItemCollectionRule` получает необязательный `configurationIndexUidSegment`. Стандартный `fromXML` коллекции перед импортом каждого именованного элемента переключает контекст индекса на дочерний `logicalAddress`; конкретные знания остаются в регистрациях коллекций, а общий слой не знает про HTTPService или другие объекты 1С.

**Tech Stack:** TypeScript, Vitest, существующие metadata rules, `ConfigurationIndexCollector`, `logicalAddress`.

## Global Constraints

- Не изменять XML-фикстуры: они являются источником истины.
- Общие слои `packages/core/metadata/orchestration`, `packages/core/metadata/validation` и `packages/core/metadata/project` не должны знать про конкретные `itemType`, XML-корни, папки или типы 1С.
- Новое поведение должно быть декларативным: конкретный сегмент адресации задаётся в регистрации metadata-item коллекции.
- Первая версия покрывает только именованные metadata-item коллекции.
- Безымянные повторяющиеся XML-элементы не адресуются автоматически по порядковому номеру для нового `configurationIndexUidSegment`; существующее поведение `childCollectionUidSegment` не меняется.
- Перед закрытием задачи обязательно выполнить `pnpm test` из корня worktree.
- В рабочем дереве уже могут быть незакоммиченные изменения по XML-discovery; коммиты этого плана должны добавлять только файлы, указанные в задаче.

---

## File Structure

- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
  - Добавляет поле `configurationIndexUidSegment` в параметры регистрации и передаёт его в стандартный импорт коллекции.
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXML.ts`
  - Расширяет `importMetadataItemCollectionFromXML`: принимает сегмент адресации регистрации, строит дочерний `logicalAddress` для каждого именованного элемента, диагностирует отсутствие имени у новой адресуемой коллекции и сохраняет прежнее индексное поведение для существующего `childCollectionUidSegment`.
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`
  - Покрывает общий договор регистрации: разные элементы коллекции пишут `uuid` в разные адреса.
- Modify: `packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/register.ts`
  - Регистрирует сегмент `ШаблонURL`.
- Modify: `packages/core/metadata/commonObjects/metadataHTTPServiceMethod/register.ts`
  - Регистрирует сегмент `Метод`.
- Modify: `packages/core/metadata/appliedObjects/metadataHTTPService/fromXML.test.ts`
  - Проверяет реальный сценарий HTTPService: `URLTemplate` и вложенный `Method` пишут `uuid` в адреса конкретных элементов.

---

### Task 1: Общий договор адресуемой metadata-item коллекции

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/fromXML.ts`
- Test: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`

**Interfaces:**
- Consumes:
  - `registerMetadataItemCollectionRule(params)`
  - `createConfigurationIndexCollector()`
  - `withConfigurationIndexCollector(context, collector, logicalAddress)`
- Produces:
  - `CollectionRule["configurationIndexUidSegment"]?: string`
  - `importMetadataItemCollectionFromXML(itemRule, xmlElement, options?)`
  - `options.configurationIndexUidSegment?: string`

- [ ] **Step 1: Write failing tests for collection-level logical addresses**

Add imports to `packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts`:

```ts
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
```

Extend `TestCollectionItemRules` with `uuid` before `name`:

```ts
const TestCollectionItemRules = {
  itemType: "TestCollectionItem",
  properties: {
    uuid: {
      type: "string",
      xml: "_uuid",
      forReferenceOnly: true,
    },
    name: {
      type: "string",
      xml: "Name",
      yaml: "name",
      required: true,
    },
    value: {
      type: "string",
      xml: "Value",
      yaml: "value",
    },
  },
} as unknown as MetadataItemRule
```

Register a new addressable collection after existing test registrations:

```ts
registerMetadataItemCollectionRule({
  propertyType: "TestAddressableCollection" as any,
  itemRule: TestCollectionItemRules,
  xmlElement: "Item",
  keyField: "name",
  configurationIndexUidSegment: "Элемент",
})

const addressableRule: PropertyRule = { type: "TestAddressableCollection" as any }
```

Add tests inside `describe("registerMetadataItemCollectionRule default fromXML", () => { ... })`:

```ts
  it("пишет идентификаторы элементов адресуемой коллекции в дочерние logicalAddress", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML({ forReference: true }), collector, "Владелец.A")

    const result = importPropertyFromXML({
      context,
      rule: addressableRule,
      value: {
        Item: [
          { _uuid: "11111111-1111-1111-1111-111111111111", Name: "Первый" },
          { _uuid: "22222222-2222-2222-2222-222222222222", Name: "Второй" },
        ],
      },
    })

    expect(result).toEqual([
      { itemType: "TestCollectionItem", uuid: "11111111-1111-1111-1111-111111111111", name: "Первый" },
      { itemType: "TestCollectionItem", uuid: "22222222-2222-2222-2222-222222222222", name: "Второй" },
    ])
    expect(collector.fragment("owner.yaml").identities).toEqual([
      {
        logicalAddress: "Владелец.A.Элемент.Первый",
        kind: "uuid",
        value: "11111111-1111-1111-1111-111111111111",
      },
      {
        logicalAddress: "Владелец.A.Элемент.Второй",
        kind: "uuid",
        value: "22222222-2222-2222-2222-222222222222",
      },
    ])
  })

  it("завершает импорт ошибкой, если адресуемый элемент коллекции не имеет имени", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML({ forReference: true }), collector, "Владелец.A")

    expect(() =>
      importPropertyFromXML({
        context,
        rule: addressableRule,
        value: { Item: { _uuid: "11111111-1111-1111-1111-111111111111" } },
      })
    ).toThrow("Адресуемая metadata-item коллекция TestAddressableCollection содержит элемент без имени")
  })
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts --reporter dot
```

Expected: FAIL because `configurationIndexUidSegment` is not accepted/passed and identities are still collected at `Владелец.A`.

- [ ] **Step 3: Extend collection registration types**

In `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`, add the field to `CollectionRule`:

```ts
  /** Канонический сегмент logicalAddress для элементов этой metadata-item коллекции. */
  configurationIndexUidSegment?: string
```

Change `fromXMLDefault` so every call to `importMetadataItemCollectionFromXML` passes the option:

```ts
  const fromXMLDefault: ImportFromXMLFunction = (context, rule, xml) => {
    const effectiveElement = xmlElement ?? (rule as any).xml
    const options = {
      propertyType,
      configurationIndexUidSegment: params.configurationIndexUidSegment,
    }
    if (Array.isArray(xml)) {
      const isWrapped = xml.every(
        (entry) =>
          entry !== null && typeof entry === "object" && !Array.isArray(entry) && effectiveElement in (entry as object)
      )
      const bodies = isWrapped
        ? xml.flatMap((entry: any) => {
            const inner = entry[effectiveElement]
            return Array.isArray(inner) ? inner : [inner]
          })
        : xml
      return importMetadataItemCollectionFromXML(itemRule, effectiveElement, options)(context, rule, {
        [effectiveElement]: bodies,
      })
    }
    if (xml !== undefined && xml !== null && typeof xml === "object" && !(effectiveElement in (xml as object))) {
      return importMetadataItemCollectionFromXML(itemRule, effectiveElement, options)(context, rule, {
        [effectiveElement]: [xml],
      })
    }
    return importMetadataItemCollectionFromXML(itemRule, effectiveElement, options)(context, rule, xml)
  }
```

- [ ] **Step 4: Implement address switching in collection import**

In `packages/core/metadata/orchestration/metadataCollection/fromXML.ts`, change the function signature:

```ts
export const importMetadataItemCollectionFromXML = <Rule extends MetadataItemRule, XMLKey extends string>(
  itemRule: Rule,
  xmlElement: XMLKey,
  options?: {
    propertyType?: PropertyRuleType
    configurationIndexUidSegment?: string
  }
): ImportFromXMLFunction => {
```

Replace `collection?.childCollectionUidSegment` usage in the mapper with this logic:

```ts
        const collection = getConfigurationIndexCollectionContext(context)
        const itemName = configurationIndexItemName(item, itemRule)
        const registeredUidSegment = options?.configurationIndexUidSegment
        if (collection !== undefined && registeredUidSegment !== undefined && itemName === undefined) {
          throw new Error(
            `Адресуемая metadata-item коллекция ${options.propertyType ?? itemRule.itemType} содержит элемент без имени`
          )
        }
        const uidSegment = registeredUidSegment ?? collection?.childCollectionUidSegment
        const itemContext =
          collection === undefined || uidSegment === undefined
            ? context
            : withConfigurationIndexLogicalAddress(
                context,
                itemName === undefined
                  ? indexedUid(collection.logicalAddress, uidSegment, index)
                  : childUid(collection.logicalAddress, uidSegment, itemName)
              )
```

Keep both logical address helpers imported:

```ts
import { childUid, indexedUid } from "../../configurationIndex/logicalAddress"
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/metadataCollection/ruleFactory.test.ts --reporter dot
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts \
  packages/core/metadata/orchestration/metadataCollection/fromXML.ts \
  packages/core/metadata/orchestration/metadataCollection/ruleFactory.test.ts
git commit -m "feat: :sparkles: адресовать именованные коллекции в индексе"
```

Expected: commit includes only the three files listed above.

---

### Task 2: HTTPService collection registrations

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataHTTPServiceMethod/register.ts`
- Test: `packages/core/metadata/appliedObjects/metadataHTTPService/fromXML.test.ts`

**Interfaces:**
- Consumes:
  - `registerMetadataItemCollectionRule({ configurationIndexUidSegment })` from Task 1
- Produces:
  - URL template logical addresses with segment `ШаблонURL`
  - Method logical addresses with segment `Метод`

- [ ] **Step 1: Write failing HTTPService index test**

Add imports to `packages/core/metadata/appliedObjects/metadataHTTPService/fromXML.test.ts`:

```ts
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { importMetadataItemFromXML } from "../../orchestration"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
```

Add this test:

```ts
  it("пишет uuid URLTemplate и Method в адреса конкретных элементов индекса", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML({ forReference: true }),
      collector,
      "HTTPСервис.HTTPСервисВсеСвойства"
    )
    const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(import.meta.url, "full.xml")

    importMetadataItemFromXML({
      context,
      xml: parsed.MetaDataObject,
      rule: MetadataHTTPServiceRules,
    })

    expect(collector.fragment("HTTPServices/HTTPСервисВсеСвойства/Свойства.yaml").identities).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: "HTTPСервис.HTTPСервисВсеСвойства.ШаблонURL.ШаблонURLВсеСвойства",
          kind: "uuid",
          value: "aee983bf-4532-4484-af10-18bec3476e5f",
        },
        {
          logicalAddress: "HTTPСервис.HTTPСервисВсеСвойства.ШаблонURL.ШаблонURLВсеСвойства.Метод.МетодВсеСвойства",
          kind: "uuid",
          value: "5cea292e-474f-4e14-9b79-46832cf8447b",
        },
      ])
    )
  })
```

- [ ] **Step 2: Run HTTPService test and verify failure**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/metadataHTTPService/fromXML.test.ts --reporter dot
```

Expected: FAIL because URL templates and methods do not yet have collection-level index segments.

- [ ] **Step 3: Add URL template segment**

In `packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/register.ts`, update registration:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceURLTemplates",
  itemRule: MetadataHTTPServiceURLTemplateRules,
  xmlElement: "URLTemplate",
  keyField: "name",
  configurationIndexUidSegment: "ШаблонURL",
  fromYAML: importMetadataHTTPServiceURLTemplatesFromYAML,
})
```

- [ ] **Step 4: Add method segment**

In `packages/core/metadata/commonObjects/metadataHTTPServiceMethod/register.ts`, update registration:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataHTTPServiceMethods",
  itemRule: MetadataHTTPServiceMethodRules,
  xmlElement: "Method",
  keyField: "name",
  configurationIndexUidSegment: "Метод",
  fromYAML: importMetadataHTTPServiceMethodsFromYAML,
  toXML: (params) => {
    if (Array.isArray(params.value) && params.value.length === 0 && "defaultValueXMLRaw" in params.rule) {
      return []
    }

    const effectiveXmlElement = (params.rule as any).xml === "Method" ? undefined : "Method"
    return exportMetadataCollectionToXML({
      context: params.context,
      rule: params.rule,
      data: params.value as MetadataHTTPServiceMethods | undefined,
      referenceData: params.referenceMetadata as MetadataHTTPServiceMethods | undefined,
      itemRule: MetadataHTTPServiceMethodRules,
      xmlElement: effectiveXmlElement,
      keyField: "name",
    })
  },
})
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/metadataCollection/ruleFactory.test.ts \
  metadata/commonObjects/metadataHTTPServiceURLTemplate/fromXML.test.ts \
  metadata/commonObjects/metadataHTTPServiceMethod/fromXML.test.ts \
  metadata/appliedObjects/metadataHTTPService/fromXML.test.ts \
  --reporter dot
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/register.ts \
  packages/core/metadata/commonObjects/metadataHTTPServiceMethod/register.ts \
  packages/core/metadata/appliedObjects/metadataHTTPService/fromXML.test.ts
git commit -m "fix: :bug: развести адреса HTTPService в индексе"
```

Expected: commit includes only the three files listed above.

---

### Task 3: Verification against import conflicts

**Files:**
- No planned source edits.
- May inspect: `packages/core/metadata/importFromXml/worker.test.ts`
- May inspect: `packages/core/metadata/importFromXml/importConfiguration.test.ts`

**Interfaces:**
- Consumes:
  - Addressable collection behavior from Task 1
  - HTTPService registrations from Task 2
- Produces:
  - Evidence that HTTPService conflicts are gone
  - A clear list of any remaining non-HTTPService addressation gaps, if they still exist

- [ ] **Step 1: Run import with ERP and 4 workers**

Run from `/Users/nikita/git/nkdk/.worktrees/remote-sync-state-design`:

```bash
/usr/bin/time -l pnpm --filter @nkdk/cli exec tsx -e 'import { syncConfigurationFromXML } from "../core/index.ts"; (async () => { const result = await syncConfigurationFromXML({ context: { defaultLanguage: "ru", version: "2.20", exportToYAML: { toTyped: false }, fromXML: { forReference: false } }, inputDir: "/Users/nikita/git/round-trip/cf/erp", outputDir: "/Users/nikita/git/nkdk-yaml/cf", concurrency: 4 }); console.log(JSON.stringify(result, null, 2)); if (result.failed.length > 0) process.exitCode = 1; })();'
```

Expected: no `xml_import_assignment_failed` conflicts for logical addresses beginning with `HTTPСервис.exchange_dsl_1_0_0_1`.

If the command still fails with other conflicts, save the first 10 unique `logicalAddress` values and classify them as a follow-up design/implementation gap. Do not broaden this task to fix unrelated object families.

- [ ] **Step 2: Run focused regression tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/metadataCollection/ruleFactory.test.ts \
  metadata/appliedObjects/metadataHTTPService/fromXML.test.ts \
  metadata/importFromXml/discovery.test.ts \
  metadata/importFromXml/importConfiguration.test.ts \
  --reporter dot
```

Expected: PASS.

- [ ] **Step 3: Run full project test**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Commit verification-only changes if any**

If no files changed during verification, do not create an empty commit.

If a small test expectation or diagnostic text had to be corrected in `packages/core/metadata/appliedObjects/metadataHTTPService/fromXML.test.ts`, commit only that file:

```bash
git add packages/core/metadata/appliedObjects/metadataHTTPService/fromXML.test.ts
git commit -m "test: :white_check_mark: закрепить проверку адресов индекса"
```

Expected: no unrelated discovery changes are accidentally included unless they were already intentionally committed in a separate task.

---

## Self-Review Notes

- Spec coverage: Task 1 covers the general registration contract and no-index fallback decision. Task 2 covers HTTPService `ШаблонURL` and `Метод`. Task 3 covers ERP verification and remaining-gap reporting.
- Placeholder scan: no unfinished placeholders are intentionally left in the plan.
- Type consistency: the new option name is consistently `configurationIndexUidSegment`; the produced API stays inside `registerMetadataItemCollectionRule` and `importMetadataItemCollectionFromXML`.
