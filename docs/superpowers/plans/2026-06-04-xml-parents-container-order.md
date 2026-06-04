# XML Parents Container Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export XML without reference in the 1C-compatible container order and remove `requiredXMLParents` by deriving required XML containers from `xmlParents`.

**Architecture:** Keep metadata rules linear: `xmlParents` remains the only place where XML container paths are described. `getOrderedKeysToXML` handles ordering of known top-level XML groups, while `exportPropertiesToXML` creates required empty `ChildObjects` and `ListSettings` containers only for the current rule after export filters.

**Tech Stack:** TypeScript, Vitest, pnpm, fast-xml-parser XML structures, existing `packages/core/metadata/orchestration/property` helpers.

---

## Scope Check

This is one subsystem: XML export orchestration for metadata properties. It touches ordering, required container materialization, and rule cleanup, but all changes belong to `packages/core/metadata/**` and are testable through focused Vitest files plus the existing `round-trip-yaml-1c` diagnostic.

## File Structure

- Modify `packages/core/metadata/orchestration/property/helpers.ts`: add XML container rank helpers, apply rank in `getOrderedKeysToXML`, add helpers for auto-required XML parent roots, remove obsolete `applyRequiredXMLParents`.
- Modify `packages/core/metadata/orchestration/property/toXML.ts`: collect auto-required XML parent roots while properties pass export filters, apply empty containers after property export, remove `requiredXMLParents` call.
- Modify `packages/core/metadata/orchestration/property/types.ts`: delete `MetadataItemRule.requiredXMLParents`.
- Modify `packages/core/metadata/orchestration/property/helpers.test.ts`: add `getOrderedKeysToXML` tests and remove direct `applyRequiredXMLParents` tests.
- Modify `packages/core/metadata/orchestration/metadataItem/toXML.test.ts`: add export-level tests for empty `ChildObjects` and `ListSettings`.
- Modify every `rules.ts` that currently has `requiredXMLParents`: delete the property line only; do not change XML fixtures.
- Do not modify XML fixtures in `/home/nikita/git/round-trip/all` or package fixtures.

## Task 1: Failing Tests For XML Container Order

**Files:**
- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`

- [ ] **Step 1: Update the helper test import and local rule factory**

Change the import at the top of `packages/core/metadata/orchestration/property/helpers.test.ts` to include `getOrderedKeysToXML` while keeping `applyRequiredXMLParents` for now:

```ts
import { describe, expect, it } from "vitest"
import {
  applyRequiredXMLParents,
  getOrderedKeysFromXML,
  getOrderedKeysToXML,
  shouldProcessProperty,
  XML_SOURCE_KEYS,
} from "./helpers"
import { setXMLValue } from "./toXML"
```

Replace the local `createRule` type with this wider shape so ordering tests can use `order` and export flags:

```ts
const createRule = (
  properties: Record<
    string,
    {
      xml?: string
      xmlParents?: string[]
      tag?: string
      runtimeOnly?: true
      syncExternalOnly?: true
      filePath?: string
      order?: number
      toXML?: false
    }
  >
): any => {
  return {
    // Остальное для этих тестов не важно, используются только свойства
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, rule]) => [
        name,
        {
          type: "string",
          ...rule,
        },
      ])
    ),
  }
}
```

- [ ] **Step 2: Add failing `getOrderedKeysToXML` tests**

Insert this block after the existing `describe("getOrderedKeysFromXML", ...)` block:

```ts
describe("getOrderedKeysToXML", () => {
  it("без reference ставит InternalInfo перед ordered Properties и ChildObjects", () => {
    const rule = createRule({
      name: { xml: "Name", xmlParents: ["Properties"], order: 1 },
      internalInfo: { xml: "InternalInfo" },
      dimensions: { xml: "Dimension", xmlParents: ["ChildObjects"] },
    })

    const result = getOrderedKeysToXML({
      rule,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(["internalInfo", "name", "dimensions"])
  })

  it("без reference сортирует Properties перед ChildObjects даже если ChildObjects объявлен раньше", () => {
    const rule = createRule({
      dimensions: { xml: "Dimension", xmlParents: ["ChildObjects"] },
      name: { xml: "Name", xmlParents: ["Properties"] },
    })

    const result = getOrderedKeysToXML({
      rule,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(["name", "dimensions"])
  })

  it("с reference сохраняет порядок ключей referenceMetadata главным", () => {
    const rule = createRule({
      name: { xml: "Name", xmlParents: ["Properties"], order: 1 },
      internalInfo: { xml: "InternalInfo" },
      dimensions: { xml: "Dimension", xmlParents: ["ChildObjects"] },
    })

    const result = getOrderedKeysToXML({
      rule,
      referenceMetadata: {
        itemType: "Recalculation",
        name: "Имя",
        internalInfo: {},
        dimensions: [],
      },
    })

    expect(result).toEqual(["name", "internalInfo", "dimensions"])
  })
})
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/property/helpers.test.ts -t "getOrderedKeysToXML"
```

Expected: FAIL. The first test should show `name` before `internalInfo`, or the second test should show `dimensions` before `name`, proving current global `order`/path order still beats XML container rank.

- [ ] **Step 4: Commit the failing tests**

```bash
git add packages/core/metadata/orchestration/property/helpers.test.ts
git commit -m "test: :white_check_mark: описать порядок XML-контейнеров"
```

## Task 2: Implement XML Container Order From xmlParents

**Files:**
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Test: `packages/core/metadata/orchestration/property/helpers.test.ts`

- [ ] **Step 1: Add known container rank helpers**

In `packages/core/metadata/orchestration/property/helpers.ts`, after `export const XML_SOURCE_KEYS = Symbol("xmlSourceKeys")`, add:

```ts
const XML_CONTAINER_ORDER = new Map<string, number>([
  ["InternalInfo", 0],
  ["Properties", 1],
  ["ChildObjects", 2],
])

const getEntryTopLevelXMLName = (entry: { path: Path; xmlKey: string }): string => entry.path[0] ?? entry.xmlKey

const getKnownXMLContainerOrder = (entry: { path: Path; xmlKey: string }): number | undefined =>
  XML_CONTAINER_ORDER.get(getEntryTopLevelXMLName(entry))
```

- [ ] **Step 2: Carry path and XML key inside `FlatEntry`**

In `getOrderedKeysToXML`, replace the `FlatEntry` type and entry push block with:

```ts
type FlatEntry = {
  key: string
  order: number | undefined
  pathIdx: number
  withinPathIdx: number
  path: Path
  xmlKey: string
}
const entries: FlatEntry[] = []

for (let pathIdx = 0; pathIdx < pathOrder.length; pathIdx++) {
  const path = pathOrder[pathIdx]!
  const info = pathToInfo.get(pathKey(path))
  if (!info) continue
  info.orderByRule.forEach((e, withinPathIdx) => {
    entries.push({ key: e.key, order: e.order, pathIdx, withinPathIdx, path, xmlKey: e.xmlKey })
  })
}
```

- [ ] **Step 3: Add container-aware comparator**

In `getOrderedKeysToXML`, keep `byRuleOrder` and add this comparator immediately after it:

```ts
const byKnownXMLContainerThenRuleOrder = (a: FlatEntry, b: FlatEntry): number => {
  const containerOrderA = getKnownXMLContainerOrder(a)
  const containerOrderB = getKnownXMLContainerOrder(b)

  if (
    containerOrderA !== undefined &&
    containerOrderB !== undefined &&
    containerOrderA !== containerOrderB
  ) {
    return containerOrderA - containerOrderB
  }

  return byRuleOrder(a, b)
}
```

This intentionally compares ranks only when both entries belong to known groups. Unranked root nodes and special containers keep the existing rule/path behavior.

- [ ] **Step 4: Use the container-aware comparator without reference**

Replace:

```ts
if (refKeyOrder.size === 0) {
  entries.sort(byRuleOrder)
  return entries.map((e) => e.key)
}
```

with:

```ts
if (refKeyOrder.size === 0) {
  entries.sort(byKnownXMLContainerThenRuleOrder)
  return entries.map((e) => e.key)
}
```

- [ ] **Step 5: Use the container-aware comparator for free keys with reference**

Replace:

```ts
free.sort(byRuleOrder)
```

with:

```ts
free.sort(byKnownXMLContainerThenRuleOrder)
```

- [ ] **Step 6: Run focused order tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/property/helpers.test.ts -t "getOrderedKeysToXML"
```

Expected: PASS for all three `getOrderedKeysToXML` tests.

- [ ] **Step 7: Run full helper tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/property/helpers.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit ordering implementation**

```bash
git add packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/orchestration/property/helpers.test.ts
git commit -m "fix: :bug: упорядочить XML-контейнеры из xmlParents"
```

## Task 3: Failing Tests For Auto-Required XML Containers

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/toXML.test.ts`

- [ ] **Step 1: Add test rules for auto-required containers**

In `packages/core/metadata/orchestration/metadataItem/toXML.test.ts`, after `ruleWithRawObject`, add:

```ts
const ruleWithAutoRequiredChildObjects = {
  itemType: "Recalculation",
  properties: {
    name: { xml: "Name", type: "string", xmlParents: ["Properties"] },
    dimensions: {
      xml: "Dimension",
      type: "string",
      xmlParents: ["ChildObjects"],
    },
  },
} as const satisfies MetadataItemRule

const ruleWithIgnoredChildObjects = {
  itemType: "Recalculation",
  properties: {
    name: { xml: "Name", type: "string", xmlParents: ["Properties"] },
    dimensions: {
      xml: "Dimension",
      type: "string",
      xmlParents: ["ChildObjects"],
      toXML: false,
    },
  },
} as const satisfies MetadataItemRule

const ruleWithAutoRequiredListSettings = {
  itemType: "Recalculation",
  properties: {
    dataParameters: {
      xml: "dcscor:item",
      type: "string",
      xmlParents: ["ListSettings", "dcsset:dataParameters"],
    },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Add failing export-level tests**

Append this `describe` block before `describe("exportMetadataItemToXML reference preservation", ...)`:

```ts
describe("exportMetadataItemToXML auto-required XML containers", () => {
  it("создаёт пустой ChildObjects для rule с экспортируемым xmlParents[0] ChildObjects", () => {
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: { itemType: "Recalculation", name: "Имя" } as any,
      rule: ruleWithAutoRequiredChildObjects,
    })

    expect(xml).toEqual({
      Properties: {
        Name: "Имя",
      },
      ChildObjects: {},
    })
  })

  it("не создаёт ChildObjects, если единственное ChildObjects-свойство отфильтровано из XML-экспорта", () => {
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: { itemType: "Recalculation", name: "Имя" } as any,
      rule: ruleWithIgnoredChildObjects,
    })

    expect(xml).toEqual({
      Properties: {
        Name: "Имя",
      },
    })
  })

  it("создаёт пустой ListSettings для rule с экспортируемым вложенным путём ListSettings", () => {
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: { itemType: "Recalculation" } as any,
      rule: ruleWithAutoRequiredListSettings,
    })

    expect(xml).toEqual({
      ListSettings: {},
    })
  })
})
```

- [ ] **Step 3: Run focused auto-container tests and verify they fail**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/metadataItem/toXML.test.ts -t "auto-required XML containers"
```

Expected: FAIL. The first and third tests should miss `ChildObjects` and `ListSettings` because no `requiredXMLParents` exists on these test rules yet.

- [ ] **Step 4: Commit the failing tests**

```bash
git add packages/core/metadata/orchestration/metadataItem/toXML.test.ts
git commit -m "test: :white_check_mark: описать обязательные XML-контейнеры"
```

## Task 4: Implement Auto-Required XML Containers From xmlParents

**Files:**
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/toXML.ts`
- Test: `packages/core/metadata/orchestration/metadataItem/toXML.test.ts`

- [ ] **Step 1: Add auto-required container helpers**

In `packages/core/metadata/orchestration/property/helpers.ts`, after `getKnownXMLContainerOrder`, add:

```ts
const AUTO_REQUIRED_XML_PARENT_ROOTS = new Set<string>(["ChildObjects", "ListSettings"])

export const collectAutoRequiredXMLParentRoot = (rule: PropertyRule, roots: Set<string>): void => {
  const root = rule.xmlParents?.[0]
  if (root !== undefined && AUTO_REQUIRED_XML_PARENT_ROOTS.has(root)) {
    roots.add(root)
  }
}

export const applyAutoRequiredXMLParents = (result: ItemXML, roots: ReadonlySet<string>): void => {
  for (const root of roots) {
    if (result[root] === undefined) {
      result[root] = {}
    }
  }
}
```

- [ ] **Step 2: Import the new helpers in XML export**

In `packages/core/metadata/orchestration/property/toXML.ts`, replace the helper import with:

```ts
import {
  applyAutoRequiredXMLParents,
  applyRequiredXMLParents,
  collectAutoRequiredXMLParentRoot,
  getOrderedKeysToXML,
  shouldProcessProperty,
  XML_SOURCE_KEYS,
} from "./helpers"
```

`applyRequiredXMLParents` stays temporarily until old rules are cleaned up.

- [ ] **Step 3: Collect roots only after export filters pass**

In `exportPropertiesToXML`, after:

```ts
  const orderedKeys = getOrderedKeysToXML({ rule, tag, referenceMetadata })
```

add:

```ts
  const autoRequiredXMLParentRoots = new Set<string>()
```

Inside the loop, immediately after the `shouldProcessProperty` guard and before `const currentContext`, add:

```ts
      collectAutoRequiredXMLParentRoot(ruleProp, autoRequiredXMLParentRoots)
```

The surrounding section should become:

```ts
      if (
        !shouldProcessProperty({
          rule: ruleProp,
          operation: "exportToXML",
          metadataItem: metadata,
          context,
          propertyKey: key,
          referenceMetadata,
        })
      ) {
        continue
      }

      collectAutoRequiredXMLParentRoot(ruleProp, autoRequiredXMLParentRoots)

      const currentContext: ConfigurationContextWithExportToXML = {
        ...context,
        exportToXML: { ...context.exportToXML },
      }
```

- [ ] **Step 4: Apply auto-required containers after property export**

In `exportPropertiesToXML`, before the existing `if (rule.requiredXMLParents)` block, add:

```ts
  applyAutoRequiredXMLParents(result, autoRequiredXMLParentRoots)
```

The end of the function should temporarily be:

```ts
  applyAutoRequiredXMLParents(result, autoRequiredXMLParentRoots)

  if (rule.requiredXMLParents) {
    applyRequiredXMLParents(result, rule.requiredXMLParents, tag)
  }

  return result
}
```

- [ ] **Step 5: Run focused auto-container tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/metadataItem/toXML.test.ts -t "auto-required XML containers"
```

Expected: PASS.

- [ ] **Step 6: Run related XML export tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/metadataItem/toXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/commonObjects/metadataTabularSection/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit auto-container implementation**

```bash
git add packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/orchestration/property/toXML.ts packages/core/metadata/orchestration/metadataItem/toXML.test.ts
git commit -m "fix: :bug: выводить обязательные XML-контейнеры из xmlParents"
```

## Task 5: Remove requiredXMLParents From Rules

**Files:**
- Modify: every listed `rules.ts`
- Test: `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataTabularSection/toXML.test.ts`
- Test: `packages/core/metadata/orchestration/metadataItem/toXML.test.ts`

- [ ] **Step 1: Delete every `requiredXMLParents` property line from rules**

Remove these exact lines:

```text
packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts:415:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts:422:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/commonObjects/recalculation/rules.ts:74:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/rules.ts:254:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/rules.ts:261:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/commonObjects/metadataWebServiceOperation/rules.ts:166:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts:235:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts:251:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts:229:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataSequence/rules.ts:113:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataSettingsStorage/rules.ts:113:  requiredXMLParents: [childObjects],
packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts:126:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataExternalDataSource/rules.ts:107:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts:412:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataTask/rules.ts:432:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataHTTPService/rules.ts:97:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts:199:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts:216:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataCatalog/rules.ts:483:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts:428:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts:114:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts:111:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts:114:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataWebService/rules.ts:112:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataIntegrationService/rules.ts:91:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts:263:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataReport/rules.ts:279:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataCalculationRegister/rules.ts:201:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/forms/commonObjects/dynamicList/rules.ts:6:  requiredXMLParents: [["ListSettings"]],
packages/core/metadata/appliedObjects/metadataDocumentJournal/rules.ts:195:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataFilterCriterion/rules.ts:140:  requiredXMLParents: [childObjects],
packages/core/metadata/appliedObjects/metadataDocument/rules.ts:434:  requiredXMLParents: [["ChildObjects"]],
packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts:322:  requiredXMLParents: [["ChildObjects"]],
```

Do not delete the `properties` or `childObjects` path constants; many property rules still use them as `xmlParents`.

- [ ] **Step 2: Verify no rule still declares `requiredXMLParents`**

Run:

```bash
rg "requiredXMLParents" packages/core/metadata -n
```

Expected: only orchestration support remains in `property/toXML.ts`, `property/helpers.ts`, `property/types.ts`, and tests. No `rules.ts` result should appear.

- [ ] **Step 3: Run related export tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/metadataItem/toXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/commonObjects/metadataTabularSection/toXML.test.ts
```

Expected: PASS. `DynamicListRules` should still export `<ListSettings/>`; tabular sections should still export `<ChildObjects/>`.

- [ ] **Step 4: Commit rule cleanup**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: удалить requiredXMLParents из правил"
```

## Task 6: Remove Obsolete requiredXMLParents Support

**Files:**
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Modify: `packages/core/metadata/orchestration/property/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`

- [ ] **Step 1: Remove obsolete helper import from tests**

In `packages/core/metadata/orchestration/property/helpers.test.ts`, replace the helper import with:

```ts
import { getOrderedKeysFromXML, getOrderedKeysToXML, shouldProcessProperty, XML_SOURCE_KEYS } from "./helpers"
```

- [ ] **Step 2: Delete `applyRequiredXMLParents` tests**

Delete the whole block:

```ts
describe("applyRequiredXMLParents", () => {
  it("plain-array entries создаются независимо от тега", () => {
    const result: any = {}
    applyRequiredXMLParents(result, [["ChildObjects"]], ["Form"])
    expect(result).toEqual({ ChildObjects: {} })
  })

  it("tagged entries создаются только при совпадении тега", () => {
    const result: any = {}
    applyRequiredXMLParents(result, [{ path: ["Attributes"], tag: "Form" }], ["Form"])
    expect(result).toEqual({ Attributes: {} })
  })

  it("tagged entries пропускаются при несовпадении тега", () => {
    const result: any = {}
    applyRequiredXMLParents(result, [{ path: ["Attributes"], tag: "Form" }], ["Metadata"])
    expect(result).toEqual({})
  })

  it("не перезаписывает уже существующий узел", () => {
    const existing = { Attribute: [{ _name: "foo" }] }
    const result: any = { Attributes: existing }
    applyRequiredXMLParents(result, [{ path: ["Attributes"], tag: "Form" }], ["Form"])
    expect(result.Attributes).toBe(existing)
  })
})
```

- [ ] **Step 3: Remove obsolete helper from `helpers.ts`**

Delete this exported function from `packages/core/metadata/orchestration/property/helpers.ts`:

```ts
export const applyRequiredXMLParents = (
  result: ItemXML,
  entries: ReadonlyArray<ReadonlyArray<string> | { path: ReadonlyArray<string>; tag?: string }>,
  tag?: string[]
): void => {
  for (const entry of entries) {
    const path = "path" in entry ? entry.path : entry
    const entryTag = "path" in entry ? entry.tag : undefined
    if (entryTag !== undefined && (tag === undefined || !tag.includes(entryTag))) continue
    let node = result
    for (const key of path) {
      if (node[key] === undefined) {
        node[key] = {}
      }
      node = node[key]
    }
  }
}
```

- [ ] **Step 4: Remove obsolete import and call from XML export**

In `packages/core/metadata/orchestration/property/toXML.ts`, replace the helper import with:

```ts
import {
  applyAutoRequiredXMLParents,
  collectAutoRequiredXMLParentRoot,
  getOrderedKeysToXML,
  shouldProcessProperty,
  XML_SOURCE_KEYS,
} from "./helpers"
```

Then replace the end of `exportPropertiesToXML`:

```ts
  applyAutoRequiredXMLParents(result, autoRequiredXMLParentRoots)

  if (rule.requiredXMLParents) {
    applyRequiredXMLParents(result, rule.requiredXMLParents, tag)
  }

  return result
}
```

with:

```ts
  applyAutoRequiredXMLParents(result, autoRequiredXMLParentRoots)

  return result
}
```

- [ ] **Step 5: Remove `requiredXMLParents` from `MetadataItemRule`**

In `packages/core/metadata/orchestration/property/types.ts`, delete this comment and property:

```ts
  /**
   * Пути к XML-тегам-контейнерам, которые должны присутствовать в результате exportPropertiesToXML
   * всегда, даже пустыми. Каждый путь — массив ключей от корня результата, симметричный xmlParents
   * на уровне PropertyRule. Пример: [["Catalog", "ChildObjects"]].
   * Может содержать объект { path, tag } для создания контейнера только при экспорте с указанным тегом.
   */
  requiredXMLParents?: ReadonlyArray<ReadonlyArray<string> | { path: ReadonlyArray<string>; tag?: string }>
```

- [ ] **Step 6: Verify no `requiredXMLParents` references remain**

Run:

```bash
rg "requiredXMLParents" packages/core/metadata -n
```

Expected: no output.

- [ ] **Step 7: Run focused orchestration tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/property/helpers.test.ts metadata/orchestration/metadataItem/toXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/commonObjects/metadataTabularSection/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run TypeScript type check for core**

Run:

```bash
pnpm --dir packages/core type-check
```

Expected: PASS.

- [ ] **Step 9: Commit obsolete support removal**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: удалить поддержку requiredXMLParents"
```

## Task 7: Final Verification

**Files:**
- Verify only; no source edits.

- [ ] **Step 1: Verify working tree state**

Run:

```bash
git status --short
```

Expected: no source changes except planned documentation changes that the current session already owns. If source files are dirty, inspect them before continuing.

- [ ] **Step 2: Run full project tests**

Run from `/home/nikita/git/nkdk`:

```bash
pnpm test
```

Expected: PASS across all `packages/*`.

- [ ] **Step 3: Run YAML to XML to 1C diagnostic**

Before this diagnostic, ensure the working tree is clean, because `round-trip-yaml-1c` requires it.

Run from `/home/nikita/git/nkdk`:

```bash
NKDK_XML_REPO=/home/nikita/git/round-trip NKDK_XML_DIR=/home/nikita/git/round-trip/all NKDK_1C_DATA=/home/nikita/git/temp-base NKDK_1C_DB_PATH=/home/nikita/git/temp-base NKDK_1C_IBCMD=/opt/1cv8/x86_64/8.3.27.2170/ibcmd ./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: the script reaches:

```text
=== Загрузка в 1С прошла успешно ===
```

- [ ] **Step 4: Confirm the original error is gone**

If the diagnostic fails, the first failure must not be:

```text
Current property: InternalInfo, expected property: ChildObjects.
```

If that exact error remains, inspect generated tabular section XML and re-check `getOrderedKeysToXML` ordering for `InternalInfo`, `Properties`, `ChildObjects`.

- [ ] **Step 5: Final status**

Run:

```bash
git status --short
```

Expected: clean working tree.

## Self-Review

- Spec coverage: container order without reference is covered by Tasks 1-2; `InternalInfo` as non-container is covered by ordering tests; auto-required `ChildObjects` and `ListSettings` are covered by Tasks 3-4; `requiredXMLParents` removal is covered by Tasks 5-6; final `pnpm test` and `round-trip-yaml-1c` are covered by Task 7.
- Placeholder scan: no step uses an unspecified implementation placeholder; code edits include exact snippets or exact lines to delete.
- Type consistency: helper names are `collectAutoRequiredXMLParentRoot` and `applyAutoRequiredXMLParents` in both `helpers.ts` and `toXML.ts`; `FlatEntry` includes `path` and `xmlKey` before comparator helpers use them.
