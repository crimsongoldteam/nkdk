# XML-Driven Direct Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить перебор всех свойств `rules.ts` при прямом XML → YAML импорте единственным обходом каждого XML-источника по кэшируемому плану и упорядочивать свойства создаваемых YAML-объектов по согласованному правилу.

**Architecture:** Из `MetadataItemRule` один раз компилируется дерево XML-путей с основными именами, `xmlAliases`, `xmlParents` и отдельным списком свойств с `defaultValue`. Прямой импорт обходит XML по этому дереву, сразу преобразует найденные свойства, после обхода обрабатывает только отсутствующие свойства с `defaultValue`, а перед возвратом сортирует только ключи YAML-объекта текущего `rules.ts`.

**Tech Stack:** TypeScript, Vitest, pnpm, существующие metadata orchestration и import profiler.

## Global Constraints

- Не создавать metadata-модель, `modelStub` или совместимое модельное представление.
- Каждый XML-источник одного YAML-результата обходить ровно один раз.
- Общие metadata-слои не должны знать конкретные `itemType`, XML-корни, теги форм или прикладные типы свойств.
- Не изменять существующие XML-фикстуры.
- Для найденного атомарного свойства сохранять последовательность `fromXML` → `toYAML`; для составного свойства использовать зарегистрированный прямой преобразователь.
- Для отсутствующего свойства вызывать `defaultValue` с `operation: "importFromXML"` только при наличии `defaultValue` и только если свойство разрешено для `fromXML`.
- `defaultValueXMLEmpty` применять только к присутствующему пустому XML-свойству.
- Неизвестные XML-свойства игнорировать; неоднозначное соответствие правилам считать ошибкой.
- Сортировать только свойства объекта, созданного текущим `rules.ts`: `Заголовок`/`Синоним`, `Вид`, `Тип`, остальные по русскому алфавиту.
- Не сортировать атомарные значения, массивы, элементы массивов и ключи коллекций.
- Сохранять исходный XML-порядок в файле индекса конфигурации независимо от порядка YAML.
- Не изменять существующий договор нескольких `DirectImportXMLSource` и вложенных `resolveNestedImportXMLSources`.
- Перед завершением выполнить полный `pnpm test` из корня worktree.

---

## File Structure

- Create: `packages/core/metadata/orchestration/property/xmlImportPlan.ts` — компиляция, кэширование и обход дерева XML-путей.
- Create: `packages/core/metadata/orchestration/property/xmlImportPlan.test.ts` — договор XML-плана, конфликтов, тегов, псевдонимов и контейнеров.
- Create: `packages/core/metadata/orchestration/property/yamlPropertyOrder.ts` — сортировка только свойств одного YAML-объекта правил.
- Create: `packages/core/metadata/orchestration/property/yamlPropertyOrder.test.ts` — приоритеты YAML-ключей и границы сортировки.
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts` — использование XML-плана вместо полного перебора `rule.properties`.
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts` — поведение отсутствующих свойств, нескольких источников, внешнего XML и сортировки.
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts` — понятные поля профиля подготовки плана и XML-обхода.
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts` — названия и запись новых профильных подэтапов.
- Modify: `packages/core/metadata/importFromXml/prepareYaml.test.ts` — профиль не содержит прежних подэтапов перебора правил.

---

### Task 1: Кэшируемый план XML-путей

**Files:**
- Create: `packages/core/metadata/orchestration/property/xmlImportPlan.ts`
- Create: `packages/core/metadata/orchestration/property/xmlImportPlan.test.ts`

**Interfaces:**
- Consumes: `MetadataItemRule`, `PropertyRule`, `capitalize`.
- Produces:

```ts
export interface XMLImportPlanEntry {
  propertyKey: string
  rule: PropertyRule
  canonicalXMLKey: string
}

export interface XMLImportMatch extends XMLImportPlanEntry {
  sourceXMLKey: string
  xmlPath: readonly string[]
  xmlValue: unknown
}

export interface XMLImportPlan {
  readonly defaults: readonly XMLImportPlanEntry[]
  readonly entriesByPropertyKey: ReadonlyMap<string, XMLImportPlanEntry>
}

export function getXMLImportPlan(params: {
  rule: MetadataItemRule
  tags?: readonly string[]
  includeAllTags: boolean
}): XMLImportPlan

export function visitXMLImportPlan(params: {
  plan: XMLImportPlan
  xml: Record<string, unknown>
  visit(match: XMLImportMatch): void
}): void
```

- `getXMLImportPlan` возвращает один и тот же объект для одинаковых `rule`, набора `tags` и `includeAllTags`.
- `entriesByPropertyKey` включает внешние свойства с `filePath`; дерево XML-обхода их не включает.
- `defaults` включает только свойства с собственным полем `defaultValue`, допустимые для прямого XML-импорта и не имеющие `filePath`.

- [ ] **Step 1: Write the failing plan tests**

Create `xmlImportPlan.test.ts` with focused tests:

```ts
import { describe, expect, it, vi } from "vitest"
import type { MetadataItemRule } from "./types"
import { getXMLImportPlan, visitXMLImportPlan } from "./xmlImportPlan"

const rule = {
  itemType: "TestXMLPlan",
  properties: {
    name: { type: "string", xml: "Name", xmlAliases: ["LegacyName"] },
    attributes: { type: "string", xml: "Attributes" },
    appearance: {
      type: "string",
      xml: "Appearance",
      xmlParents: ["Attributes"],
    },
    fallback: { type: "string", xml: "Fallback", defaultValue: "value" },
    external: { type: "string", filePath: "Ext/Value.xml" },
  },
} as MetadataItemRule

describe("XML import plan", () => {
  it("visits aliases and nested XML containers once in XML order", () => {
    const visit = vi.fn()
    visitXMLImportPlan({
      plan: getXMLImportPlan({ rule, includeAllTags: true }),
      xml: {
        Unknown: "ignored",
        LegacyName: "name",
        Attributes: { Appearance: "appearance" },
      },
      visit,
    })

    expect(visit.mock.calls.map(([match]) => [match.propertyKey, match.xmlPath, match.xmlValue])).toEqual([
      ["name", ["LegacyName"], "name"],
      ["attributes", ["Attributes"], { Appearance: "appearance" }],
      ["appearance", ["Attributes", "Appearance"], "appearance"],
    ])
  })

  it("caches plans and keeps only explicit defaults", () => {
    const first = getXMLImportPlan({ rule, includeAllTags: true })
    const second = getXMLImportPlan({ rule, includeAllTags: true })

    expect(second).toBe(first)
    expect(first.defaults.map(({ propertyKey }) => propertyKey)).toEqual(["fallback"])
    expect(first.entriesByPropertyKey.get("external")?.propertyKey).toBe("external")
  })

  it("filters entries by source tags", () => {
    const taggedRule = {
      itemType: "TestTaggedPlan",
      properties: {
        body: { type: "string", xml: "Value", tag: "Body" },
        metadata: { type: "string", xml: "Value", tag: "Metadata" },
      },
    } as MetadataItemRule
    const visit = vi.fn()

    visitXMLImportPlan({
      plan: getXMLImportPlan({ rule: taggedRule, tags: ["Body"], includeAllTags: false }),
      xml: { Value: "body" },
      visit,
    })

    expect(visit.mock.calls.map(([match]) => match.propertyKey)).toEqual(["body"])
  })

  it("rejects two properties with the same XML path", () => {
    const conflictingRule = {
      itemType: "TestConflict",
      properties: {
        first: { type: "string", xml: "Value" },
        second: { type: "string", xmlAliases: ["Value"] },
      },
    } as MetadataItemRule

    expect(() => getXMLImportPlan({ rule: conflictingRule, includeAllTags: true })).toThrow(
      "XML-путь /Value соответствует свойствам first и second"
    )
  })
})
```

- [ ] **Step 2: Run the plan test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/xmlImportPlan.test.ts
```

Expected: FAIL because `./xmlImportPlan` does not exist.

- [ ] **Step 3: Implement plan compilation and traversal**

Create `xmlImportPlan.ts` with these internal structures:

```ts
interface XMLImportPlanNode {
  readonly entriesByXMLKey: ReadonlyMap<string, XMLImportPlanEntry>
  readonly childrenByXMLKey: ReadonlyMap<string, XMLImportPlanNode>
}

interface CompiledXMLImportPlan extends XMLImportPlan {
  readonly root: XMLImportPlanNode
}

const cache = new WeakMap<MetadataItemRule, Map<string, CompiledXMLImportPlan>>()
```

Use a stable cache key where `includeAllTags` is `"*"`; otherwise sort and join tags without changing the caller's array. While compiling:

```ts
const propertyEntries = Object.entries(rule.properties).filter(([, propertyRule]) => {
  if (propertyRule.runtimeOnly || propertyRule.syncExternalOnly) return false
  if (params.includeAllTags) return true
  if (params.tags === undefined) return propertyRule.tag === undefined
  return propertyRule.tag !== undefined && params.tags.includes(propertyRule.tag)
})
```

For every entry:

1. Add it to `entriesByPropertyKey`.
2. If `filePath` is set, do not add it to the XML tree or `defaults`.
3. If the rule owns `defaultValue`, add it to `defaults` only when `shouldProcessProperty({ rule, operation: "importFromXML" })` is true.
4. Walk/create nodes for `xmlParents`.
5. Register the canonical XML key and every alias in the final node.
6. If an XML key already belongs to another property, throw the exact conflict error used by the test.

Implement traversal without descending into arbitrary property values. Descend only when `childrenByXMLKey` contains the current XML key:

```ts
function visitNode(
  node: XMLImportPlanNode,
  xml: unknown,
  xmlPath: readonly string[],
  visit: (match: XMLImportMatch) => void
): void {
  if (!isRecord(xml)) return
  for (const [xmlKey, xmlValue] of Object.entries(xml)) {
    const entry = node.entriesByXMLKey.get(xmlKey)
    const propertyXMLPath = [...xmlPath, xmlKey]
    if (entry !== undefined) visit({ ...entry, sourceXMLKey: xmlKey, xmlPath: propertyXMLPath, xmlValue })
    const child = node.childrenByXMLKey.get(xmlKey)
    if (child !== undefined) visitNode(child, xmlValue, propertyXMLPath, visit)
  }
}
```

The public `visitXMLImportPlan` calls `visitNode(compiled.root, params.xml, [], params.visit)`.

- [ ] **Step 4: Run tests and type checking**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/xmlImportPlan.test.ts
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: all plan tests PASS; TypeScript exits 0.

- [ ] **Step 5: Commit the plan compiler**

```bash
git add packages/core/metadata/orchestration/property/xmlImportPlan.ts packages/core/metadata/orchestration/property/xmlImportPlan.test.ts
git commit -m "feat: :sparkles: добавить план XML-обхода" -m "План кэширует соответствие XML-путей правилам и позволяет обходить только свойства исходного XML."
```

---

### Task 2: XML-ориентированный прямой импорт

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: `getXMLImportPlan`, `visitXMLImportPlan`, `XMLImportMatch` from Task 1.
- Produces: прежнюю сигнатуру `importPropertiesFromXMLToYAML`; вызывающие модули не меняются.

- [ ] **Step 1: Write failing behavior tests**

Add tests to `fromXMLToYAML.test.ts`:

```ts
it("does not process an absent property without defaultValue", () => {
  const calls: string[] = []
  registerTypeRule("TestPresentOnly" as PropertyRuleType, "importFromXML", (_context, _rule, xml) => {
    calls.push(String(xml))
    return xml
  })
  registerTypeRule("TestPresentOnly" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

  const yaml = importPropertiesWithSources({
    context,
    rule: {
      itemType: "TestPresentOnlyItem",
      properties: {
        present: { type: "TestPresentOnly", xml: "Present", yaml: "Присутствует" },
        absent: { type: "TestPresentOnly", xml: "Absent", yaml: "Отсутствует" },
      },
    } as MetadataItemRule,
    sources: [{ context, xml: { Present: "value" } }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
  })

  expect(yaml).toEqual({ Присутствует: "value" })
  expect(calls).toEqual(["value"])
})

it("processes only an absent property with defaultValue", () => {
  const calls: unknown[] = []
  registerTypeRule("TestMissingDefault" as PropertyRuleType, "importFromXML", (_context, _rule, xml) => {
    calls.push(xml)
    return xml
  })
  registerTypeRule("TestMissingDefault" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

  const yaml = importPropertiesWithSources({
    context,
    rule: {
      itemType: "TestMissingDefaultItem",
      properties: {
        absent: { type: "TestMissingDefault", xml: "Absent", yaml: "Значение", defaultValue: "default" },
      },
    } as MetadataItemRule,
    sources: [{ context, xml: {} }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
  })

  expect(yaml).toEqual({ Значение: "default" })
  expect(calls).toEqual([undefined])
})
```

Extend the existing configuration-index test so its XML contains keys in non-rule order and still expects that exact order in `xmlNodes[0].order`. Keep the existing multi-source and external-file tests unchanged; they are required regression coverage.

- [ ] **Step 2: Run tests to verify the old traversal is exposed**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: the absent-property test FAILS because the current implementation invokes `fromXML` for both rule properties.

- [ ] **Step 3: Replace rule selection with source plan traversal**

In `fromXMLToYAML.ts` remove the direct-import dependency on `getOrderedKeysFromXML`, `getXMLKey`, `getXMLKeys`, `getXMLValueByKey`, `isXMLKeyPresent`, and `isXMLKeyPresentByKey`. Do not remove `getOrderedKeysFromXML` from `helpers.ts`; legacy model import still uses it.

Create one source state per input:

```ts
interface DirectImportSourceState {
  source: DirectImportXMLSource
  plan: XMLImportPlan
  indexCollection: ReturnType<typeof getConfigurationIndexCollectionContext>
  xmlNodeLogicalAddress: string | undefined
  ownerXmlName: string | undefined
  importedKeysInSourceOrder: string[]
  foundPropertyKeys: Set<string>
}
```

For each source choose its cached plan without reading all rules:

```ts
const includeAllTags = sources.length === 1 && sources[0]?.tags === undefined
const sourceStates = sources.map((source) => ({
  source,
  plan: getXMLImportPlan({ rule, tags: source.tags, includeAllTags }),
  // Existing index fields remain unchanged.
  foundPropertyKeys: new Set<string>(),
  importedKeysInSourceOrder: [],
}))
```

Extract the existing body of the property loop into a local `importMatch` function with this exact boundary:

```ts
function importMatch(params: {
  sourceState: DirectImportSourceState
  entry: XMLImportPlanEntry
  sourceXMLKey: string | undefined
  xmlPath: readonly string[] | undefined
  sourceXMLValue: unknown
  presentInXML: boolean
}): void
```

Move the existing identity collection, configuration-index handling, atomic/direct conversion, external-file handling, YAML output and local-fact collection into this function. Preserve these distinctions:

- `presentInXML` controls aliases, presence markers, `defaultValueXMLEmpty`, special `MetadataValue`/`MetadataDcsMetadataValue` nil handling, and XML property collection.
- `sourceXMLKey === undefined` means a missing property processed through `defaultValue`; it is not added to XML order or presence data.
- `xmlPath` is passed to `DirectImportConversionError`; defaults have no XML-path, external properties use the canonical XML key as their local path.
- `sourceXMLValue` from an external XML file is present and uses the canonical XML key.
- `getValueOrDefault` remains the only evaluator of `defaultValue` and receives `operation: "importFromXML"`.

Traverse and convert each source immediately:

```ts
for (const sourceState of sourceStates) {
  visitXMLImportPlan({
    plan: sourceState.plan,
    xml: sourceState.source.xml,
    visit(match) {
      sourceState.foundPropertyKeys.add(match.propertyKey)
      importMatch({
        sourceState,
        entry: match,
        sourceXMLKey: match.sourceXMLKey,
        xmlPath: match.xmlPath,
        sourceXMLValue: match.xmlValue,
        presentInXML: true,
      })
    },
  })
}
```

Process `propertyXML` as synthetic found properties by looking up `entriesByPropertyKey` in source plans. Require exactly one matching source and keep the existing error for multiple sources. Then process missing defaults:

```ts
for (const sourceState of sourceStates) {
  for (const entry of sourceState.plan.defaults) {
    if (sourceState.foundPropertyKeys.has(entry.propertyKey)) continue
    importMatch({
      sourceState,
      entry,
      sourceXMLKey: undefined,
      xmlPath: undefined,
      sourceXMLValue: undefined,
      presentInXML: false,
    })
  }
}
```

Before applying a default, verify that the property does not belong to another source plan; every property may be assigned to only one source. Build this ownership map from `sourceState.plan.entriesByPropertyKey`, not from `rule.properties`.

Extend `DirectImportConversionError` with optional `xmlPath`. Its message must include `xmlPath=/Attributes/Appearance` for a matched nested property while preserving `yamlPath` and `rulePath`. Update the existing conversion-error test to assert all three paths.

Set configuration-index XML order directly from `importedKeysInSourceOrder`; it is already populated in XML visitation order. External properties follow visited XML keys. Remove filtering through the old `orderedKeys` array.

- [ ] **Step 4: Run direct-import and form regression tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/metadataItem/fromXMLToYAML.test.ts \
  metadata/orchestration/metadataCollection/fromXMLToYAML.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts \
  metadata/importFromXml/prepareYaml.test.ts
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: all selected tests PASS; TypeScript exits 0.

- [ ] **Step 5: Commit XML-driven import**

```bash
git add packages/core/metadata/orchestration/property/fromXMLToYAML.ts packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts
git commit -m "perf: :zap: обходить свойства XML при импорте" -m "Прямой импорт больше не перебирает все свойства rules.ts для каждого объекта и отдельно обрабатывает только отсутствующие defaultValue."
```

---

### Task 3: Порядок YAML-свойств в пределах rules.ts

**Files:**
- Create: `packages/core/metadata/orchestration/property/yamlPropertyOrder.ts`
- Create: `packages/core/metadata/orchestration/property/yamlPropertyOrder.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`

**Interfaces:**
- Produces:

```ts
export function sortYamlRuleProperties(value: Record<string, unknown>): Record<string, unknown>
```

- [ ] **Step 1: Write failing ordering tests**

Create `yamlPropertyOrder.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { sortYamlRuleProperties } from "./yamlPropertyOrder"

describe("sortYamlRuleProperties", () => {
  it("puts title and synonym before kind, type and alphabetic properties", () => {
    const sorted = sortYamlRuleProperties({
      Бета: 1,
      Тип: 2,
      Синоним: 3,
      Вид: 4,
      Заголовок: 5,
      Альфа: 6,
    })

    expect(Object.keys(sorted)).toEqual(["Заголовок", "Синоним", "Вид", "Тип", "Альфа", "Бета"])
  })

  it("does not recursively sort arrays or nested values", () => {
    const nested = { Бета: 1, Альфа: 2 }
    const array = [{ Бета: 1, Альфа: 2 }]
    const sorted = sortYamlRuleProperties({ Значение: nested, Элементы: array })

    expect(Object.keys(sorted.Значение as object)).toEqual(["Бета", "Альфа"])
    expect(Object.keys((sorted.Элементы as object[])[0]!)).toEqual(["Бета", "Альфа"])
  })
})
```

Add an integration test to `fromXMLToYAML.test.ts` that imports six rule properties in deliberately mixed XML order and asserts the same `Object.keys` sequence. Add a direct property returning an array of unsorted objects and assert its nested keys remain unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/yamlPropertyOrder.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: FAIL because `yamlPropertyOrder.ts` does not exist and current output follows insertion order.

- [ ] **Step 3: Implement non-recursive YAML property sorting**

Create `yamlPropertyOrder.ts`:

```ts
const collator = new Intl.Collator("ru")

const priority = (key: string): number => {
  if (key === "Заголовок" || key === "Синоним") return 0
  if (key === "Вид") return 1
  if (key === "Тип") return 2
  return 3
}

export function sortYamlRuleProperties(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => priority(left) - priority(right) || collator.compare(left, right))
  )
}
```

In `importPropertiesFromXMLToYAML`, replace only the final `return result` with:

```ts
return sortYamlRuleProperties(result)
```

Do not call the sorter inside `getExportToYAMLResult`, direct type handlers or collection factories. Recursive metadata items already call `importPropertiesFromXMLToYAML` for each item and therefore sort only their own rule-defined properties.

- [ ] **Step 4: Run ordering and import tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/yamlPropertyOrder.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts \
  metadata/importFromXml/prepareYaml.test.ts
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: all selected tests PASS; TypeScript exits 0. Tests comparing parsed YAML data remain unchanged; tests asserting key order use the new contract.

- [ ] **Step 5: Commit YAML ordering**

```bash
git add \
  packages/core/metadata/orchestration/property/yamlPropertyOrder.ts \
  packages/core/metadata/orchestration/property/yamlPropertyOrder.test.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts
git commit -m "feat: :sparkles: упорядочить YAML-свойства" -m "Объекты rules.ts получают единый порядок ключей, не затрагивающий массивы, атомарные значения и ключи коллекций."
```

---

### Task 4: Профиль нового XML-обхода

**Files:**
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.test.ts`

**Interfaces:**
- Replace profile fields `orderingMs` and `selectionMs` with `planningMs` and `xmlTraversalMs`.
- Replace substeps `XML в YAML: определение порядка свойств` and `XML в YAML: выбор свойств` with `XML в YAML: подготовка плана импорта` and `XML в YAML: обход XML`.

- [ ] **Step 1: Write the failing profile assertion**

In the existing common-form profile test in `prepareYaml.test.ts`, add:

```ts
const substeps = profiler.records().map(({ substep }) => substep)
expect(substeps).toContain("XML в YAML: подготовка плана импорта")
expect(substeps).toContain("XML в YAML: обход XML")
expect(substeps).not.toContain("XML в YAML: определение порядка свойств")
expect(substeps).not.toContain("XML в YAML: выбор свойств")
```

- [ ] **Step 2: Run the profile test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/prepareYaml.test.ts
```

Expected: FAIL because the profiler still emits the old substep names.

- [ ] **Step 3: Rename and measure the new operations**

Update `DirectImportProfile` and its initializer:

```ts
planningMs: number
xmlTraversalMs: number
```

Measure only cache lookup/initial plan construction in `planningMs`. For `xmlTraversalMs`, measure XML-tree lookup separately from the property conversion callback: accumulate callback time and subtract it from the enclosing `visitXMLImportPlan` time. Add synthetic external-property lookup and missing-default selection time, but not `importMatch` execution time. Keep recursive inclusive direct-type timings unchanged.

Update `recordDirectImportProfile`:

```ts
profiler.record(step, "XML в YAML: подготовка плана импорта", {
  items: profile.propertyCount,
  timeMs: profile.planningMs,
})
profiler.record(step, "XML в YAML: обход XML", {
  items: profile.propertyCount,
  timeMs: profile.xmlTraversalMs,
})
```

Remove all reads and writes of `orderingMs` and `selectionMs`.

- [ ] **Step 4: Run profile, import and type tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/prepareYaml.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/xmlImportPlan.test.ts \
  metadata/orchestration/property/yamlPropertyOrder.test.ts
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: all selected tests PASS; no old profile substeps remain.

- [ ] **Step 5: Commit profile changes**

```bash
git add \
  packages/core/metadata/orchestration/property/importYamlTypes.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/importFromXml/prepareYaml.ts \
  packages/core/metadata/importFromXml/prepareYaml.test.ts
git commit -m "perf: :zap: уточнить профиль XML-обхода" -m "Профиль отдельно показывает подготовку кэшируемого плана и фактический обход XML вместо перебора свойств rules.ts."
```

---

### Task 5: Полная проверка и профиль ERP

**Files:**
- No source changes expected.
- Output: `/private/tmp/nkdk-import-profile-erp-xml-driven.json`

**Interfaces:**
- Consumes the completed import implementation and `.agents/skills/import-profile/import-profile.mjs`.
- Produces verification evidence and a comparison with the baseline from 2026-07-22.

- [ ] **Step 1: Run the full project test suite**

Run from the worktree root:

```bash
pnpm test
```

Expected: core, CLI and MCP test suites PASS with zero failures.

- [ ] **Step 2: Verify the worktree before the destructive profile setup**

Run:

```bash
git status --short
```

Expected: no uncommitted source changes. The implementation commits from Tasks 1-4 are present.

- [ ] **Step 3: Clear the agreed ERP target and run one profile**

Run:

```bash
rm -rf /Users/nikita/git/nkdk-yaml/cf
mkdir -p /Users/nikita/git/nkdk-yaml/cf
zsh -lc 'node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip/cf/erp \
  /Users/nikita/git/nkdk-yaml/cf \
  --runs 1 --json > /private/tmp/nkdk-import-profile-erp-xml-driven.json'
```

Expected run result:

- `exitCode: 0`;
- `succeeded: 38455`;
- `errors: 0`;
- `warnings: 0`;
- result file count: `121464`;
- no profile record named `XML в YAML: определение порядка свойств` or `XML в YAML: выбор свойств`.

- [ ] **Step 4: Report profile comparison**

Use `jq` to aggregate main stages and direct-import substeps. Compare against this baseline:

| Metric | Baseline |
|---|---:|
| Total elapsed | 211.42 s |
| Peak RSS | 6224.8 MiB |
| First worker pass | 105.87 s |
| XML → YAML worker CPU sum | 208.81 s |
| Old property ordering worker CPU sum | 31.45 s |
| Old property selection worker CPU sum | 5.90 s |
| Configuration index file write | 6.99 s |

Report the new total, peak RSS, first worker pass, `XML в YAML: подготовка плана импорта`, `XML в YAML: обход XML`, result count, warnings, errors, file count and configuration-index size. Worker CPU sums are inclusive across four workers and must not be presented as wall-clock time.

- [ ] **Step 5: Verify final repository state**

Run:

```bash
git status --short
git log -6 --oneline
```

Expected: clean worktree and four implementation commits after this plan commit; the design commit remains `56b89e9e2`.
