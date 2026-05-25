# Graph Stub Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce false `GraphStub` nodes by making graph node ids canonical model paths and by resolving command, data path, type, table, and value references through one shared mapping.

**Architecture:** Introduce a small graph-path canonicalization layer backed by the existing metadata path correspondence tables. Then route existing graph builders through it instead of constructing russian enterprise ids inline. Keep YAML/XML serialization untouched; only graph node ids and reference targets change.

**Tech Stack:** TypeScript, Vitest, `packages/core/metadata/**`, existing `GraphBuilder` / `GraphOps` graph construction APIs.

---

## Baseline

The isolated worktree is `/Users/nikita/git/nakidka-core/.worktrees/graph-stub-resolution-plan` on branch `codex/graph-stub-resolution-plan`.

Baseline commands already run:

```bash
pnpm install
pnpm --filter nkdk-language langium:generate
pnpm test
```

Observed result:

- `pnpm --filter nkdk-language langium:generate` prints `No projects matched the filters`; current workspace packages do not include `nkdk-language`.
- `pnpm test` passes: `@nakidka/graph` 53 tests, `@nakidka/core` 3729 tests, `@nakidka/cli` 46 tests.

## File Structure

Create:

- `packages/core/metadata/commonObjects/metadataPath/graphPath.ts` — canonical graph id conversion helpers.
- `packages/core/metadata/commonObjects/metadataPath/graphPath.test.ts` — unit tests for canonical top-level, child, runtime object, standard attribute, command, and predefined value paths.

Modify:

- `packages/core/metadata/orchestration/property/extractReferenceFromPath.ts` — make global reference extraction return canonical model graph ids.
- `packages/core/metadata/orchestration/graphImport/root.ts` — create top-level graph roots with canonical ids.
- `packages/core/metadata/graphImport/registerFormGraphImport.ts` — create form roots with `.Form.`.
- `packages/core/metadata/orchestration/buildGraphFromModel.ts` — use canonical child node segments for `graphChild`.
- `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts` — canonicalize `GraphOps.children`, `GraphOps.references`, and final form-local fallback targets.
- `packages/core/metadata/forms/commonObjects/formCommand/graphFromModel.ts` — create form command nodes with `.Command.`.
- `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts` — create form attribute/additional column helper nodes with `.Attribute.` and resolve `TABLE` via data path graph ops.
- `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts` — classify local, external, system, and internal numeric command names.
- `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts` — canonicalize global data paths and preserve form-local edge props.
- `packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts` — emit canonical `TYPE` / `VALUE_TYPE` references.
- `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts` — emit `...PredefinedData.<value>` for metadata values.
- `packages/core/metadata/commonObjects/metadataField/graphFromModel.ts` — benefits from `extractReferenceFromPath`; add tests for `FIELD`.
- `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts` — add coverage for standard attributes through choice parameter links.

Important existing documents:

- `.agents/knowledge/metadata/INDEX.md`
- `.agents/knowledge/metadata/sources-of-truth.md`
- `.agents/architecture-orchestration.md`
- `docs/superpowers/specs/2026-05-25-graph-stub-resolution-design.md`

## Task 1: Canonical Graph Path Helpers

**Files:**

- Create: `packages/core/metadata/commonObjects/metadataPath/graphPath.ts`
- Create: `packages/core/metadata/commonObjects/metadataPath/graphPath.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/types.ts`

- [ ] **Step 1: Read metadata source-of-truth notes**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
```

Expected: document confirms XML/YAML correspondence tables are authoritative for metadata naming.

- [ ] **Step 2: Write failing tests for canonical graph paths**

Create `packages/core/metadata/commonObjects/metadataPath/graphPath.test.ts`:

```ts
import {
  canonicalizeMetadataGraphPath,
  canonicalizeMetadataTypeGraphPath,
  canonicalizeMetadataValueGraphPath,
  canonicalizeRuntimeObjectPath,
} from "./graphPath"

describe("metadata graph path canonicalization", () => {
  it.each([
    ["Справочник.Товары", "Catalog.Товары"],
    ["Документ.Заказ", "Document.Заказ"],
    ["Справочник.Товары.Реквизит.Артикул", "Catalog.Товары.Attribute.Артикул"],
    ["Документ.Заказ.ТабличнаяЧасть.Товары", "Document.Заказ.TabularSection.Товары"],
    ["Документ.Заказ.СтандартныйРеквизит.Ссылка", "Document.Заказ.StandardAttribute.Ref"],
    ["Document.Заказ.StandardAttribute.Date", "Document.Заказ.StandardAttribute.Date"],
    ["Документ.Заказ.СтандартныйРеквизит.Number", "Document.Заказ.StandardAttribute.Number"],
  ])("canonicalizes %s", (input, expected) => {
    expect(canonicalizeMetadataGraphPath(input)).toBe(expected)
  })

  it.each([
    ["DocumentObject.Заказ.Товары", "Document.Заказ.TabularSection.Товары"],
    ["ДокументОбъект.Заказ.Number", "Document.Заказ.StandardAttribute.Number"],
    ["CatalogObject.Номенклатура.Description", "Catalog.Номенклатура.StandardAttribute.Description"],
    ["СправочникОбъект.Номенклатура.Артикул", "Catalog.Номенклатура.Attribute.Артикул"],
  ])("canonicalizes runtime object path %s", (input, expected) => {
    expect(canonicalizeRuntimeObjectPath(input)).toBe(expected)
  })

  it.each([
    ["ОпределяемыйТип.ДенежнаяСумма", "DefinedType.ДенежнаяСумма"],
    ["ПланСчетов.Хозрасчетный", "ChartOfAccounts.Хозрасчетный"],
    ["ПланВидовХарактеристик.ВидыБюджетов", "ChartOfCharacteristicTypes.ВидыБюджетов"],
    ["CatalogObject.Номенклатура", "Catalog.Номенклатура"],
    ["DocumentObject.Заказ", "Document.Заказ"],
  ])("canonicalizes type path %s", (input, expected) => {
    expect(canonicalizeMetadataTypeGraphPath(input)).toBe(expected)
  })

  it.each([
    ["Справочник.СтавкиНДС.БезНДС", "Catalog.СтавкиНДС.PredefinedData.БезНДС"],
    [
      "ПланВидовХарактеристик.ВидыБюджетов.БюджетДвиженияДенежныхСредств",
      "ChartOfCharacteristicTypes.ВидыБюджетов.PredefinedData.БюджетДвиженияДенежныхСредств",
    ],
    ["ПланСчетов.Хозрасчетный.Основной", "ChartOfAccounts.Хозрасчетный.PredefinedData.Основной"],
    ["Catalog.СтавкиНДС.EmptyRef", "Catalog.СтавкиНДС.EmptyRef"],
    ["Enum.ВидыДоговоров.EnumValue.СПоставщиком", "Enum.ВидыДоговоров.СПоставщиком"],
  ])("canonicalizes value path %s", (input, expected) => {
    expect(canonicalizeMetadataValueGraphPath(input)).toBe(expected)
  })
})
```

- [ ] **Step 3: Run the failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataPath/graphPath.test.ts --no-isolate
```

Expected: fail because `graphPath.ts` does not exist.

- [ ] **Step 4: Export shared field map details needed by graph helpers**

Modify `packages/core/metadata/commonObjects/metadataPath/types.ts` only if needed to export existing constants already defined in the file. Do not duplicate the correspondence table. `MetadataFieldsRulesToYAML`, `MetadataFieldsRulesFromYAML`, `MetadataTypesRulesToYAML`, `MetadataTypesRulesFromYAML`, `MetadataValuesRulesToYAML`, and `MetadataValuesRulesFromYAML` are already exported; keep them as the single source of truth.

- [ ] **Step 5: Implement graph path helpers**

Create `packages/core/metadata/commonObjects/metadataPath/graphPath.ts`:

```ts
import type { MetadataFieldsRules, MetadataFieldsRulesItem, MetadataMapItem } from "./types"
import {
  MetadataFieldsRulesFromYAML,
  MetadataFieldsRulesToYAML,
  MetadataTypesRulesFromYAML,
  MetadataTypesRulesToYAML,
} from "./types"

const RUNTIME_TO_MODEL_PREFIX: Record<string, string> = {
  CatalogObject: "Catalog",
  CatalogRef: "Catalog",
  DocumentObject: "Document",
  DocumentRef: "Document",
  ChartOfAccountObject: "ChartOfAccounts",
  ChartOfAccountsRef: "ChartOfAccounts",
  ChartOfCharacteristicTypesObject: "ChartOfCharacteristicTypes",
  ChartOfCharacteristicTypesRef: "ChartOfCharacteristicTypes",
  ChartOfCalculationTypesObject: "ChartOfCalculationTypes",
  ChartOfCalculationTypesRef: "ChartOfCalculationTypes",
  ExchangePlanObject: "ExchangePlan",
  ExchangePlanRef: "ExchangePlan",
  BusinessProcessObject: "BusinessProcess",
  BusinessProcessRef: "BusinessProcess",
  TaskObject: "Task",
  TaskRef: "Task",
  СправочникОбъект: "Catalog",
  Справочник: "Catalog",
  ДокументОбъект: "Document",
  Документ: "Document",
  ПланСчетовОбъект: "ChartOfAccounts",
  ПланСчетов: "ChartOfAccounts",
  ПланВидовХарактеристикОбъект: "ChartOfCharacteristicTypes",
  ПланВидовХарактеристик: "ChartOfCharacteristicTypes",
  ПланВидовРасчетаОбъект: "ChartOfCalculationTypes",
  ПланВидовРасчета: "ChartOfCalculationTypes",
  ПланОбменаОбъект: "ExchangePlan",
  ПланОбмена: "ExchangePlan",
  БизнесПроцессОбъект: "BusinessProcess",
  БизнесПроцесс: "BusinessProcess",
  ЗадачаОбъект: "Task",
  Задача: "Task",
}

function isMapItem(rule: MetadataFieldsRulesItem | undefined): rule is MetadataMapItem {
  return typeof rule === "object" && rule !== null
}

function ruleName(rule: MetadataFieldsRulesItem | undefined): string | undefined {
  if (typeof rule === "string") return rule
  if (isMapItem(rule)) return rule.name
  return undefined
}

function findRuleKeyByName(rules: MetadataFieldsRules | undefined, name: string): string | undefined {
  if (!rules) return undefined
  if (name in rules) return name
  for (const [key, rule] of Object.entries(rules)) {
    if (ruleName(rule) === name) return key
  }
  return undefined
}

function childRules(rules: MetadataFieldsRules | undefined, key: string): MetadataFieldsRules | undefined {
  const rule = rules?.[key]
  return isMapItem(rule) ? rule.fields : undefined
}

function standardAttributeModelName(ownerKind: string, attribute: string): string {
  const ownerRule = MetadataFieldsRulesToYAML[ownerKind]
  if (!isMapItem(ownerRule)) return attribute
  const standardRule = ownerRule.fields?.StandardAttribute
  if (!isMapItem(standardRule)) return attribute
  return findRuleKeyByName(standardRule.fields, attribute) ?? attribute
}

export function normalizeMetadataRootSegment(segment: string): string {
  return RUNTIME_TO_MODEL_PREFIX[segment] ?? segment
}

export function canonicalizeRuntimeObjectPath(path: string): string | undefined {
  const parts = path.split(".")
  if (parts.length < 2) return undefined

  const ownerKind = normalizeMetadataRootSegment(parts[0]!)
  const ownerName = parts[1]!
  const tail = parts.slice(2)
  if (tail.length === 0) return `${ownerKind}.${ownerName}`

  const firstTail = tail[0]!
  const standardName = standardAttributeModelName(ownerKind, firstTail)
  if (standardName !== firstTail || ["Ref", "Number", "Date", "Description", "Code"].includes(firstTail)) {
    return [ownerKind, ownerName, "StandardAttribute", standardName, ...tail.slice(1)].join(".")
  }

  const ownerRule = MetadataFieldsRulesToYAML[ownerKind]
  if (isMapItem(ownerRule)) {
    for (const childKind of ["TabularSection", "Attribute"] as const) {
      if (ownerRule.fields?.[childKind]) {
        return [ownerKind, ownerName, childKind, ...tail].join(".")
      }
    }
  }

  return [ownerKind, ownerName, ...tail].join(".")
}

export function canonicalizeMetadataGraphPath(path: string): string | undefined {
  if (!path) return undefined
  const parts = path.split(".")
  if (parts.length === 0) return undefined

  const first = normalizeMetadataRootSegment(parts[0]!)
  if (first !== parts[0] && (parts[0]!.endsWith("Object") || parts[0]!.endsWith("Объект"))) {
    return canonicalizeRuntimeObjectPath(path)
  }

  const result = [first]
  let currentRules: MetadataFieldsRules | undefined = childRules(MetadataFieldsRulesToYAML, first)

  for (let index = 1; index < parts.length; index += 1) {
    const part = parts[index]!
    if (index === 1) {
      result.push(part)
      continue
    }

    const key = findRuleKeyByName(currentRules, part) ?? part
    if (key === "StandardAttribute" && index + 1 < parts.length) {
      result.push(key)
      const rawName = parts[index + 1]!
      result.push(standardAttributeModelName(first, rawName))
      index += 1
      currentRules = undefined
      continue
    }

    result.push(key)
    currentRules = childRules(currentRules, key)
  }

  return result.join(".")
}

export function canonicalizeMetadataTypeGraphPath(path: string): string | undefined {
  if (!path) return undefined
  const dotIndex = path.indexOf(".")
  if (dotIndex === -1) return undefined

  const prefix = path.slice(0, dotIndex)
  const tail = path.slice(dotIndex + 1)
  const mapped = normalizeMetadataRootSegment(prefix)
  if (mapped !== prefix) return `${mapped}.${tail}`

  const yamlMapped = MetadataTypesRulesFromYAML[prefix as keyof typeof MetadataTypesRulesFromYAML]
  if (yamlMapped) return `${normalizeMetadataRootSegment(String(yamlMapped))}.${tail}`

  const modelMapped = MetadataTypesRulesToYAML[prefix as keyof typeof MetadataTypesRulesToYAML]
  if (modelMapped) return `${normalizeMetadataRootSegment(prefix)}.${tail}`

  return canonicalizeMetadataGraphPath(path)
}

export function canonicalizeMetadataValueGraphPath(path: string): string | undefined {
  const canonical = canonicalizeMetadataGraphPath(path)
  if (!canonical) return undefined
  const parts = canonical.split(".")
  if (parts.length !== 3) return canonical
  if (parts[2] === "EmptyRef") return canonical
  return `${parts[0]}.${parts[1]}.PredefinedData.${parts[2]}`
}
```

- [ ] **Step 6: Run graph path tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataPath/graphPath.test.ts --no-isolate
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataPath/graphPath.ts packages/core/metadata/commonObjects/metadataPath/graphPath.test.ts packages/core/metadata/commonObjects/metadataPath/types.ts
git commit -m "feat: :sparkles: добавить канонизацию graph id метаданных"
```

## Task 2: Canonical Root, Form, And Child Node IDs

**Files:**

- Modify: `packages/core/metadata/orchestration/graphImport/root.ts`
- Modify: `packages/core/metadata/graphImport/registerFormGraphImport.ts`
- Modify: `packages/core/metadata/orchestration/buildGraphFromModel.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/graphFromModel.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`
- Test: `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts`

- [ ] **Step 1: Write failing tests for canonical structural ids**

Add cases that assert ids:

```ts
expect([...graph.nodes()]).toContain("Catalog.Товары")
expect([...graph.nodes()]).toContain("Catalog.Товары.Form.ФормаСписка")
expect([...graph.nodes()]).toContain("Catalog.Товары.Form.ФормаСписка.Command.Открыть")
expect([...graph.nodes()]).toContain("Catalog.Товары.Form.ФормаСписка.Attribute.Таблица")
expect([...graph.nodes()]).not.toContain("Справочник.Товары")
expect([...graph.nodes()]).not.toContain("Catalog.Товары.Форма.ФормаСписка")
expect([...graph.nodes()]).not.toContain("Catalog.Товары.Form.ФормаСписка.Команда.Открыть")
```

Place the root/form assertions in `packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts`, form command assertions in `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.test.ts`, and form attribute assertions in `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts`.

- [ ] **Step 2: Run failing structural tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts metadata/forms/commonObjects/commandName/graphFromModel.test.ts metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts --no-isolate
```

Expected: fail because ids still contain russian technical segments.

- [ ] **Step 3: Canonicalize root ids**

In `packages/core/metadata/orchestration/graphImport/root.ts`, import `canonicalizeMetadataGraphPath` and change:

```ts
const itemNodeId = `${rule.itemTypePrefix}.${name}`
graph.ensureNode(rule.itemTypePrefix, { name: rule.itemTypePrefix })
```

to:

```ts
const rootNodeId = canonicalizeMetadataGraphPath(rule.itemTypePrefix) ?? rule.itemTypePrefix
const itemNodeId = `${rootNodeId}.${name}`
graph.ensureNode(rootNodeId, { name: rule.itemTypePrefix })
```

Use `rootNodeId` instead of `rule.itemTypePrefix` for the root edge source.

- [ ] **Step 4: Canonicalize form root ids**

In `packages/core/metadata/graphImport/registerFormGraphImport.ts`, change:

```ts
const formNodeId = `${ownerNodeId}.Форма.${name}`
graph.ensureEdge(ownerNodeId, formNodeId, "FORM", { yaml: "Форма" })
```

to:

```ts
const formNodeId = `${ownerNodeId}.Form.${name}`
graph.ensureEdge(ownerNodeId, formNodeId, "FORM", { yaml: "Форма" })
```

Also make `matchFormPath` derive `ownerNodeId` through `canonicalizeMetadataGraphPath(`${owner.dir}.${owner.name}`)`.

- [ ] **Step 5: Canonicalize graphChild node segments**

In `packages/core/metadata/orchestration/buildGraphFromModel.ts`, add a helper:

```ts
const GRAPH_NODE_SEGMENTS: Record<string, string> = {
  Реквизит: "Attribute",
  СтандартныйРеквизит: "StandardAttribute",
  ТабличнаяЧасть: "TabularSection",
  Измерение: "Dimension",
  Ресурс: "Resource",
  РеквизитАдресации: "AddressingAttribute",
  Команда: "Command",
  Элемент: "Element",
}

function canonicalNodeSegment(segment: string): string {
  return GRAPH_NODE_SEGMENTS[segment] ?? segment
}
```

Use `canonicalNodeSegment(graphChildDef.nodeSegment)` when constructing `childNodeId`. Keep `edgeYaml` unchanged.

- [ ] **Step 6: Canonicalize generic GraphOps child ids**

In `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`, apply the same segment mapping for `child.idSuffix` only when it is a known technical segment. For `child.absoluteId`, canonicalize the whole id with `canonicalizeMetadataGraphPath(child.absoluteId) ?? child.absoluteId`.

- [ ] **Step 7: Update form command graphChild segment**

In `packages/core/metadata/forms/commonObjects/formCommand/graphFromModel.ts`, change:

```ts
nodeSegment: "Команда",
```

to:

```ts
nodeSegment: "Command",
```

- [ ] **Step 8: Update form attribute graphChild segment**

In `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`, change `nodeSegment: "Реквизит"` to `nodeSegment: "Attribute"`. Keep `edgeYaml: "РеквизитФормы"`.

- [ ] **Step 9: Run structural tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph/buildGraph.test.ts metadata/forms/commonObjects/commandName/graphFromModel.test.ts metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts --no-isolate
```

Expected: pass after updating old string expectations to canonical ids.

- [ ] **Step 10: Commit**

```bash
git add packages/core/metadata/orchestration/graphImport/root.ts packages/core/metadata/graphImport/registerFormGraphImport.ts packages/core/metadata/orchestration/buildGraphFromModel.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts packages/core/metadata/forms/commonObjects/formCommand/graphFromModel.ts packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts packages/core/metadata/orchestration/buildGraph/buildGraph.test.ts packages/core/metadata/forms/commonObjects/commandName/graphFromModel.test.ts packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts
git commit -m "feat: :sparkles: перевести структурные graph id на модельные сегменты"
```

## Task 3: CommandName Resolution

**Files:**

- Modify: `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.test.ts`

- [ ] **Step 1: Write failing tests for command classes**

Add tests:

```ts
it("резолвит Form.Command.<name> в команду текущей формы", () => {
  const formNodeId = "Catalog.Товары.Form.ФормаСписка"
  const result = buildCommandNameGraphForTest("Form.Command.Печать", formNodeId)
  expect(result).toEqual({
    references: [{ id: "Catalog.Товары.Form.ФормаСписка.Command.Печать", name: "Печать" }],
    edgeKind: "COMMAND_NAME",
    edgeYaml: "ИмяКоманды",
  })
})

it("резолвит CommonCommand как внешнюю команду", () => {
  const result = buildCommandNameGraphForTest("CommonCommand.Напомнить", "Catalog.Товары.Form.ФормаСписка")
  expect(result?.references?.[0]).toMatchObject({ id: "CommonCommand.Напомнить", name: "Напомнить" })
})

it("не добавляет CommandName 0 в граф", () => {
  expect(buildCommandNameGraphForTest("0", "Catalog.Товары.Form.ФормаСписка")).toBeUndefined()
  expect(buildCommandNameGraphForTest("0:198ea630-fda2-4cda-8a23-f999f4c67ee6", "Catalog.Товары.Form.ФормаСписка")).toBeUndefined()
})

it("системную команду формы хранит на ребре к форме", () => {
  const result = buildCommandNameGraphForTest("Form.StandardCommand.Help", "Catalog.Товары.Form.ФормаСписка")
  expect(result?.references?.[0]).toMatchObject({
    id: "Catalog.Товары.Form.ФормаСписка",
    name: "ФормаСписка",
    edgeProps: { commandScope: "form", standardCommand: "Help" },
  })
})

it("системную команду элемента хранит на ребре к элементу", () => {
  const result = buildCommandNameGraphForTest("Form.Item.Список.StandardCommand.Find", "Catalog.Товары.Form.ФормаСписка")
  expect(result?.references?.[0]).toMatchObject({
    id: "Catalog.Товары.Form.ФормаСписка.Element.Список",
    name: "Список",
    edgeProps: { commandScope: "item", standardCommand: "Find", targetItemName: "Список" },
  })
})
```

If the test file has no exported helper, export the pure builder from `graphFromModel.ts` as `buildCommandNameGraphOps` and call it directly.

- [ ] **Step 2: Run failing command tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/commandName/graphFromModel.test.ts --no-isolate
```

Expected: fail on all new command class expectations.

- [ ] **Step 3: Implement command classifier**

In `packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts`, add:

```ts
const INTERNAL_COMMAND_NAME_PATTERN = /^0(?::[0-9a-fA-F-]+)?$/

function formNameFromNodeId(formNodeId: string): string {
  return formNodeId.split(".").pop() ?? formNodeId
}

export function buildCommandNameGraphOps(model: string, formNodeId: string): GraphOps | undefined {
  if (INTERNAL_COMMAND_NAME_PATTERN.test(model)) return undefined

  const formCommandPrefix = "Form.Command."
  if (model.startsWith(formCommandPrefix)) {
    const name = model.slice(formCommandPrefix.length)
    return {
      references: [{ id: `${formNodeId}.Command.${name}`, name }],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  const standardPrefix = "Form.StandardCommand."
  if (model.startsWith(standardPrefix)) {
    const standardCommand = model.slice(standardPrefix.length)
    return {
      references: [{
        id: formNodeId,
        name: formNameFromNodeId(formNodeId),
        edgeProps: { commandScope: "form", standardCommand },
      }],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  const itemMatch = /^Form\.Item\.([^.]+)\.StandardCommand\.([^.]+)$/.exec(model)
  if (itemMatch) {
    const [, targetItemName, standardCommand] = itemMatch
    return {
      references: [{
        id: `${formNodeId}.Element.${targetItemName}`,
        name: targetItemName,
        edgeProps: { commandScope: "item", standardCommand, targetItemName },
      }],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  const external = canonicalizeMetadataGraphPath(model)
  if (external && external !== model || model.startsWith("CommonCommand.") || model.includes(".Command.")) {
    const id = external ?? model
    return {
      references: [{ id, name: id.split(".").pop() ?? id }],
      edgeKind: EDGE_KIND,
      edgeYaml: EDGE_YAML,
    }
  }

  return {
    references: [{ id: `${formNodeId}.Command.${model}`, name: model }],
    edgeKind: EDGE_KIND,
    edgeYaml: EDGE_YAML,
  }
}
```

Then make the registered `buildCommandNameGraph` delegate to `buildCommandNameGraphOps(model, formNodeId)`.

- [ ] **Step 4: Run command tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/commandName/graphFromModel.test.ts --no-isolate
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/commandName/graphFromModel.ts packages/core/metadata/forms/commonObjects/commandName/graphFromModel.test.ts
git commit -m "feat: :sparkles: разобрать классы CommandName в графе"
```

## Task 4: DataPath, ChoiceParameterLink, FIELD, And TABLE Resolution

**Files:**

- Modify: `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts`
- Modify: `packages/core/metadata/orchestration/property/extractReferenceFromPath.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`
- Test: `packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataField/graphFromModel.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts`

- [ ] **Step 1: Write failing tests**

Add expectations:

```ts
expect(buildDataPathGraphOps({
  sourcePath: "Document.Заказ.StandardAttribute.Date",
  propertyName: "dataPath",
  edgeYaml: "ПутьКДанным",
})?.references?.[0].id).toBe("Document.Заказ.StandardAttribute.Date")

expect(buildDataPathGraphOps({
  sourcePath: "Документ.Заказ.СтандартныйРеквизит.Date",
  propertyName: "dataPath",
  edgeYaml: "ПутьКДанным",
})?.references?.[0].id).toBe("Document.Заказ.StandardAttribute.Date")
```

In form-local integration tests, create a form attribute named `Объект` with `TYPE` pointing to `Document.Заказ`, then assert `Объект.Number` resolves to `Document.Заказ.StandardAttribute.Number` and `Объект.Товары` resolves to `Document.Заказ.TabularSection.Товары`.

For `TABLE`, assert `AdditionalColumns.table = "Объект.Товары"` creates a `TABLE` edge to `Document.Заказ.TabularSection.Товары`.

- [ ] **Step 2: Run failing data path tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dataPath/graphOps.test.ts metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts metadata/commonObjects/metadataField/graphFromModel.test.ts metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts --no-isolate
```

Expected: fail because current code emits russian `СтандартныйРеквизит` and runtime object ids.

- [ ] **Step 3: Canonicalize global reference extraction**

In `packages/core/metadata/orchestration/property/extractReferenceFromPath.ts`, replace `convertPath(MetadataFieldsRulesToYAML, path)` with:

```ts
const nodeId = canonicalizeMetadataGraphPath(path)
if (!nodeId) return undefined
```

Keep `name` as the last segment of `nodeId`.

- [ ] **Step 4: Canonicalize DataPath global references**

In `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts`, global paths already flow through `extractReferenceFromPath`; after Step 3 only add tests and keep edge props unchanged.

- [ ] **Step 5: Resolve runtime form-local fallbacks**

In `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`, inside `resolveFormLocalPath`, when `typeTargetId` exists and `childByEdge` is absent, compute:

```ts
const runtimeTarget = canonicalizeRuntimeObjectPath(`${typeTargetId}.${segment}`)
const nextNodeId = childByEdge ?? runtimeTarget ?? `${typeTargetId}.${segment}`
```

This makes `Document.Заказ.Number` become `Document.Заказ.StandardAttribute.Number` and `Document.Заказ.Товары` become `Document.Заказ.TabularSection.Товары`.

- [ ] **Step 6: Route TABLE through data path graph ops**

In `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`, replace the `formLocalReferences` block for `TABLE` with:

```ts
const tableOps = buildDataPathGraphOps({
  sourcePath: tablePath,
  propertyName: "table",
  edgeYaml: TABLE_EDGE_YAML,
  formNodeId,
})
if (tableOps) {
  sections.push({
    ...tableOps,
    edgeKind: TABLE_EDGE_KIND,
    edgeYaml: TABLE_EDGE_YAML,
    formLocalReferences: tableOps.formLocalReferences?.map((reference) => ({
      ...reference,
      parentOverride: proxyNodeId,
    })),
    references: tableOps.references?.map((reference) => ({
      ...reference,
      edgeProps: { ...reference.edgeProps, property: "table", sourcePath: tablePath },
    })),
  })
}
```

- [ ] **Step 7: Run data path tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dataPath/graphOps.test.ts metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts metadata/commonObjects/metadataField/graphFromModel.test.ts metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts --no-isolate
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts packages/core/metadata/orchestration/property/extractReferenceFromPath.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/graphFromModel.test.ts packages/core/metadata/commonObjects/metadataField/graphFromModel.test.ts packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts
git commit -m "feat: :sparkles: резолвить DataPath и TABLE в канонические узлы"
```

## Task 5: TypeDescription TYPE And VALUE_TYPE Resolution

**Files:**

- Modify: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts`
- Test: `packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests:

```ts
expect(extractTypeDescriptionGraph({ type: ["DefinedType.ДенежнаяСумма"] })?.references?.[0].id)
  .toBe("DefinedType.ДенежнаяСумма")

expect(extractTypeDescriptionGraph({ type: ["CatalogObject.Номенклатура"] })?.references?.[0].id)
  .toBe("Catalog.Номенклатура")

expect(extractTypeDescriptionGraph({ type: ["DocumentObject.Заказ"] })?.references?.[0].id)
  .toBe("Document.Заказ")

expect(extractTypeDescriptionGraph({ type: ["ChartOfAccountsRef.Хозрасчетный"] })?.references?.[0].id)
  .toBe("ChartOfAccounts.Хозрасчетный")
```

- [ ] **Step 2: Run failing type tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/graphFromModel.test.ts --no-isolate
```

Expected: fail because current code emits `rule.enterprise`.

- [ ] **Step 3: Implement canonical type target**

In `packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts`, replace:

```ts
const targetNodeId = `${rule.enterprise}.${detailType}`
```

with:

```ts
const targetNodeId = canonicalizeMetadataTypeGraphPath(`${baseType}.${detailType}`)
if (!targetNodeId) continue
```

Keep the existing skip for `!rule?.modifier || rule.modifier === "alwaysType"`.

- [ ] **Step 4: Preserve object/ref detail on TYPE edge only if needed**

If tests or existing code need object/ref distinction, attach edge props:

```ts
edgeProps: baseType.endsWith("Object") ? { typeKind: "object" } : baseType.endsWith("Ref") ? { typeKind: "ref" } : undefined
```

Do not encode this distinction in the target node id.

- [ ] **Step 5: Run type tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/graphFromModel.test.ts --no-isolate
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/typeDescription/graphFromModel.ts packages/core/metadata/commonObjects/typeDescription/graphFromModel.test.ts
git commit -m "feat: :sparkles: канонизировать TYPE-ссылки графа"
```

## Task 6: MetadataValue VALUE And PredefinedData Resolution

**Files:**

- Modify: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts`

- [x] **Step 1: Write failing value tests**

Add tests:

```ts
expect(extractSingleValueRef({ type: "ref", value: "Catalog.СтавкиНДС.БезНДС" })?.ref.id)
  .toBe("Catalog.СтавкиНДС.PredefinedData.БезНДС")

expect(extractSingleValueRef({ type: "ref", value: "ChartOfAccounts.Хозрасчетный.Основной" })?.ref.id)
  .toBe("ChartOfAccounts.Хозрасчетный.PredefinedData.Основной")

expect(extractSingleValueRef({ type: "ref", value: "Catalog.СтавкиНДС.EmptyRef" })?.ref.id)
  .toBe("Catalog.СтавкиНДС.EmptyRef")
```

Add one `ChoiceParameter` integration expectation for `Значение`.

- [x] **Step 2: Run failing value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataValue/graphFromModel.test.ts metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts --no-isolate
```

Expected: fail because current value conversion omits `PredefinedData`.

- [x] **Step 3: Use canonical value helper**

In `packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts`, replace `convertRefValueToNodeId` internals with:

```ts
function convertRefValueToNodeId(refValue: string): string | undefined {
  if (!refValue) return undefined
  return canonicalizeMetadataValueGraphPath(refValue)
}
```

- [x] **Step 4: Run value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataValue/graphFromModel.test.ts metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts --no-isolate
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue/graphFromModel.ts packages/core/metadata/commonObjects/metadataValue/graphFromModel.test.ts packages/core/metadata/commonObjects/сhoiceParameters/graphFromModel.test.ts
git commit -m "feat: :sparkles: вести VALUE-ссылки к PredefinedData"
```

## Task 7: Full Graph Regression And Spec Verification

**Files:**

- Modify: `docs/superpowers/specs/2026-05-25-graph-stub-resolution-design.md` only if implementation reveals a corrected decision.
- Test: existing test suite.

- [x] **Step 1: Run focused graph tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/buildGraph metadata/forms/commonObjects metadata/commonObjects/typeDescription metadata/commonObjects/metadataValue metadata/commonObjects/metadataField --no-isolate
```

Expected: pass.

- [x] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: pass.

- [x] **Step 3: Build a representative graph and count remaining stubs**

Use the same project graph source used in the spec. If FalkorDB is running locally, run the project command that rebuilds graph data, then query:

```bash
pnpm --filter @nakidka/graph exec tsx -e 'import { FalkorDB } from "falkordb"; (async()=>{ const client=await FalkorDB.connect({socket:{host:"127.0.0.1",port:6379}}); const graph=client.selectGraph("nkdk_1f5594ee3af5"); const r=await graph.query("MATCH (s)-[e]->(g:GraphStub) RETURN type(e) AS kind, e.yaml AS yaml, labels(s)[0] AS sourceLabel, count(*) AS count ORDER BY count DESC LIMIT 40"); console.table(r.data.map((x:any)=>x)); await client.close(); })();'
```

Expected: large false-positive groups from the spec disappear or move to canonical diagnostic ids:

- no `...Command.Form.Command.*`;
- no `...Command.Form.StandardCommand.*`;
- no `...Command.0` or `...Command.0:<uuid>`;
- no `DocumentObject.*` / `CatalogObject.*` graph stubs for `DATA_PATH`, `TABLE`, or `TYPE`;
- no russian enterprise prefixes for `TYPE`, `VALUE_TYPE`, and `VALUE`;
- remaining stubs represent genuinely missing targets or unsupported metadata not loaded into the graph.

- [x] **Step 4: Update spec notes if needed**

If Step 3 shows a class not covered by the plan, add a new section to `docs/superpowers/specs/2026-05-25-graph-stub-resolution-design.md` with the observation, decision, and verification rule before changing code.

- [ ] **Step 5: Commit final docs/test adjustments**

```bash
git add docs/superpowers/specs/2026-05-25-graph-stub-resolution-design.md
git commit -m "docs: :memo: уточнить результат резолва GraphStub"
```

Skip this commit if the spec did not change in Task 7.

## Self-Review

Spec coverage:

- `COMMAND_NAME` local form commands: Task 3.
- External `COMMAND_NAME`: Task 3.
- `COMMAND_NAME = 0` / `0:<uuid>` omitted from graph: Task 3.
- System form/item commands: Task 3.
- Runtime `DocumentObject` / `CatalogObject` in data paths: Task 4.
- `StandardAttribute` model names and `FIELD` / `ChoiceParameterLink`: Task 4.
- `TYPE` / `VALUE_TYPE` canonical metadata types: Task 5.
- `TABLE` for additional columns: Task 4.
- `VALUE` to `PredefinedData`: Task 6.
- Full graph regression: Task 7.

Placeholder scan:

- The plan contains no placeholder markers or unspecified “write tests” steps. Each implementation task has concrete files, command lines, and expected outcomes.

Type consistency:

- Helper names are stable across tasks: `canonicalizeMetadataGraphPath`, `canonicalizeRuntimeObjectPath`, `canonicalizeMetadataTypeGraphPath`, `canonicalizeMetadataValueGraphPath`.
- Graph edge kinds stay unchanged: `COMMAND_NAME`, `DATA_PATH`, `DATA_PATH_DEPENDS_ON`, `TYPE`, `FIELD`, `TABLE`, `VALUE`, `VALUE_TYPE`.
