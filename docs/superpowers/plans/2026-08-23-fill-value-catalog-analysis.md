# FillValue Catalog Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать проектный навык и анализатор, которые группируют наблюдаемые XML-значения `FillValue` по смысловому типу, категории значения и оценке текущих `rules.ts`.

**Architecture:** Анализатор напрямую разбирает XML через `parseXmlWithSaxes`, извлекает обычные и стандартные реквизиты, затем независимо обогащает наблюдения типами и оценкой правил. Повторяющиеся точные значения агрегируются в JSON, а Markdown строит читаемые срезы по семействам типов без полного XML-import и LMDB.

**Tech Stack:** TypeScript 7, Node.js 26, `@nkdk/runtime`, Vitest 4, Node test runner, проектные metadata rules.

**Spec:** `docs/superpowers/specs/2026-08-23-fill-value-catalog-analysis-design.md`

## Global Constraints

- XML-каталог только читается; существующие XML-фикстуры не изменяются.
- Факты XML, смысловая категория и оценка `rules.ts` хранятся раздельно.
- Неизвестная корректная конструкция попадает в `unresolved`, а не пропускается молча.
- JSON не содержит абсолютных путей и имеет детерминированную сортировку.
- Markdown не разворачивает все точные значения: показывает категории, счётчики и ограниченные примеры.
- Скрипт не изменяет metadata rules и не принимает решение о новом каноническом `FillValue`.
- Unit-тесты не используют файловую систему; файловые проверки имеют суффикс `.integration.test.ts`.
- После каждого завершённого слоя выполняется `pnpm duplicates -- --base 613073729`.

---

### Task 1: Модель типа и смысловая классификация значения

**Files:**
- Create: `packages/rules/scripts/fill-value-catalog/model.ts`
- Create: `packages/rules/scripts/fill-value-catalog/valueClassification.ts`
- Test: `packages/rules/scripts/fill-value-catalog/valueClassification.test.ts`

**Interfaces:**
- Consumes: `FillValueEffectiveType`, `FillValueClassification` и `FillValueTypedValue` из `@nkdk/runtime/rule-kit`.
- Produces: `RawFillValue`, `NormalizedType`, `ValueCategory`, `FillValueObservation`, `normalizeEffectiveType()` и `classifyObservedValue()`.

- [ ] **Step 1: Write the failing semantic-classification table test**

```ts
import { describe, expect, it } from "vitest"
import { classifyObservedValue, normalizeEffectiveType } from "./valueClassification"

describe("FillValue catalog classification", () => {
  it.each([
    ["0001-01-01T00:00:00", "initial"],
    ["2026-08-23T10:20:30", "explicit"],
  ] as const)("classifies dateTime %s as %s", (text, category) => {
    const type = { status: "known", composite: false, alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }] } as const
    expect(classifyObservedValue({
      raw: { form: "typedText", xsiType: "xs:dateTime", text },
      typedValue: { type: "dateTime", value: text },
      effectiveType: type,
    })).toBe(category)
  })

  it.each([
    ["Catalog.Контрагенты.EmptyRef", "emptyRef"],
    ["Catalog.Контрагенты.PredefinedValue.Основной", "predefinedRef"],
    ["Enum.ВидКонтрагента.Value.Покупатель", "enumValue"],
  ] as const)("classifies reference %s as %s", (value, category) => {
    expect(classifyObservedValue({
      raw: { form: "typedText", xsiType: "xr:DesignTimeRef", text: value },
      typedValue: { type: "ref", value },
      effectiveType: { status: "notSpecified" },
    })).toBe(category)
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```shell
pnpm --filter @nkdk/rules exec vitest run scripts/fill-value-catalog/valueClassification.test.ts --project unit
```

Expected: FAIL because `valueClassification.ts` does not exist.

- [ ] **Step 3: Define the stable data contracts**

`model.ts` must define these contracts without filesystem or composition dependencies:

```ts
export type FillValueForm =
  | "absent" | "nil" | "typedEmpty" | "typedText" | "untypedEmpty" | "untypedText"

export type ValueCategory =
  | "absent" | "xmlEmpty" | "initial" | "explicit"
  | "emptyRef" | "predefinedRef" | "enumValue" | "concreteRef"
  | "invalid" | "unparsed"

export interface RawFillValue {
  form: FillValueForm
  xsiType?: string
  text?: string
}

export interface NormalizedType {
  source: "xml" | "rules" | "unresolved"
  sourceType?: unknown
  family: "string" | "number" | "boolean" | "dateTime" | "reference" | "composite" | "unresolved"
  signature: string
  alternatives: readonly unknown[]
  reason?: string
}

export interface FillValueObservation {
  configuration: string
  file: string
  ownerKind: string
  ownerName?: string
  attributeKind: "ordinary" | "standard"
  attributeName: string
  itemKind: string
  type: NormalizedType
  raw: RawFillValue
  typedValue?: { readonly type: string; readonly value?: unknown }
  valueCategory: ValueCategory
  rulesClassification: "explicit" | "implicit" | "invalid" | "unresolved" | "notSpecified"
  rulesReason?: string
  rulesEvidence?: {
    declaration?: unknown
    ownerProperties?: Readonly<Record<string, unknown>>
  }
}
```

- [ ] **Step 4: Implement normalization and classification minimally**

`normalizeEffectiveType()` sorts alternatives by `JSON.stringify`, derives `composite` when more than one remains and emits a stable signature such as `dateTime(DateTime)` or `reference(Catalog.Контрагенты)`.

`classifyObservedValue()` accepts `{ raw, typedValue, effectiveType,
rulesClassification }`, where `rulesClassification` is the complete runtime
`FillValueClassification`, and applies this order:

```ts
if (raw.form === "absent") return "absent"
if (raw.form === "nil" || raw.form === "typedEmpty" || raw.form === "untypedEmpty") {
  if (typedValue?.type === "string" && typedValue.value === "") return "initial"
  return "xmlEmpty"
}
if (typedValue?.type === "ref" && typeof typedValue.value === "string") {
  if (typedValue.value.endsWith(".EmptyRef") || typedValue.value === "") return "emptyRef"
  if (typedValue.value.includes(".PredefinedValue.")) return "predefinedRef"
  if (typedValue.value.includes(".Value.") && typedValue.value.startsWith("Enum.")) return "enumValue"
  return "concreteRef"
}
if (rulesClassification?.kind === "invalid") return "invalid"
if (rulesClassification?.kind === "implicit") return "initial"
if (typedValue === undefined) return "unparsed"
return "explicit"
```

Map runtime `valid` to report `explicit`; the observation stores only this
stable report kind and the optional reason.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run the command from Step 2. Expected: PASS.

- [ ] **Step 6: Check duplicates and commit the layer**

```shell
pnpm duplicates -- --base 613073729
git add packages/rules/scripts/fill-value-catalog
git commit -m "feat: :sparkles: классифицировать значения заполнения"
```

---

### Task 2: Извлечение наблюдений из одного XML-документа

**Files:**
- Create: `packages/rules/scripts/fill-value-catalog/xmlScanner.ts`
- Test: `packages/rules/scripts/fill-value-catalog/xmlScanner.test.ts`

**Interfaces:**
- Consumes: contracts from Task 1, `parseXmlWithSaxes`, `importTypeDescriptionFromXML`, `importMetadataValueFromXML`, `effectiveFillValueType`, and an injected `StandardAttributeEnricher`.
- Produces: `scanFillValuesInXml(params): FillValueObservation[]` and `UnresolvedXmlObservation`.

- [ ] **Step 1: Write a failing XML extraction test**

Use an in-memory document containing an ordinary date attribute, a reference attribute, and a standard attribute:

```ts
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns:v8="v8" xmlns:xr="xr" xmlns:xsi="xsi">
  <Document uuid="1"><Properties><Name>Заказ</Name><StandardAttributes>
    <xr:StandardAttribute name="Date"><xr:FillValue xsi:type="xs:dateTime">0001-01-01T00:00:00</xr:FillValue></xr:StandardAttribute>
  </StandardAttributes></Properties><ChildObjects>
    <Attribute><Properties><Name>Срок</Name><Type><v8:Type>xs:dateTime</v8:Type></Type><FillValue xsi:type="xs:dateTime">2026-08-23T10:20:30</FillValue></Properties></Attribute>
    <Attribute><Properties><Name>Контрагент</Name><Type><v8:Type>cfg:CatalogRef.Контрагенты</v8:Type></Type><FillValue xsi:type="xr:DesignTimeRef">Catalog.Контрагенты.EmptyRef</FillValue></Properties></Attribute>
  </ChildObjects></Document>
</MetaDataObject>`

expect(scanFillValuesInXml({ configuration: "demo", file: "Documents/Заказ.xml", xml, enrichStandard }))
  .toMatchObject([
    { attributeName: "Дата", attributeKind: "standard", valueCategory: "initial" },
    { attributeName: "Срок", attributeKind: "ordinary", type: { family: "dateTime" }, valueCategory: "explicit" },
    { attributeName: "Контрагент", attributeKind: "ordinary", type: { family: "reference" }, valueCategory: "emptyRef" },
  ])
```

- [ ] **Step 2: Run the focused scanner test and verify RED**

```shell
pnpm --filter @nkdk/rules exec vitest run scripts/fill-value-catalog/xmlScanner.test.ts --project unit
```

Expected: FAIL because `scanFillValuesInXml` is absent.

- [ ] **Step 3: Parse exact XML forms**

Create one helper with exhaustive output:

```ts
export function rawFillValue(value: unknown, present: boolean): RawFillValue {
  if (!present) return { form: "absent" }
  if (typeof value !== "object" || value === null) {
    const text = typeof value === "string" ? value : String(value ?? "")
    return { form: text === "" ? "untypedEmpty" : "untypedText", ...(text === "" ? {} : { text }) }
  }
  const record = value as Record<string, unknown>
  const xsiType = typeof record["_xsi:type"] === "string" ? record["_xsi:type"] : undefined
  const text = typeof record["#text"] === "string" ? record["#text"] : undefined
  if (record["_xsi:nil"] === true || record["_xsi:nil"] === "true") return { form: "nil" }
  if (xsiType !== undefined) return { form: text === undefined || text === "" ? "typedEmpty" : "typedText", xsiType, ...(text ? { text } : {}) }
  return { form: text === undefined || text === "" ? "untypedEmpty" : "untypedText", ...(text ? { text } : {}) }
}
```

Call `parseXmlWithSaxes(xml, { preserveXsiNil: true, preserveEmptyElements: true })` so `nil` and typed-empty remain distinguishable.

- [ ] **Step 4: Walk only supported attribute shapes**

The scanner must:

- identify the owner as the first child of `MetaDataObject`;
- read `ownerName` from `owner.Properties.Name`;
- recognize `xr:StandardAttribute` by element name and `_name`;
- recognize ordinary roots/nodes only from `CommonAttribute`, `Attribute`, `Dimension`, `Resource`, `AddressingAttribute`, `Field`, `AccountingFlag`, and `ExtDimensionAccountingFlag`;
- require a `Properties` object with `Type` for an ordinary candidate;
- pass unrecognized candidates containing a `FillValue` into `unresolved`.

Do not use path regular expressions to parse XML. Recursion walks records and arrays, keeping the current element name and owner.

- [ ] **Step 5: Import type and typed value with production helpers**

Create a local read-only context:

```ts
const context = {
  version: "2.20",
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
  fromXML: { forReference: false },
} satisfies ConfigurationContextFromXML
```

For ordinary attributes call `importTypeDescriptionFromXML(context, undefined, properties.Type)` and then `effectiveFillValueType(type)`. For present, non-nil values call `importMetadataValueFromXML({ context, rule: undefined, value })`; catch unsupported values into `unparsed` without dropping the raw data.

- [ ] **Step 6: Run scanner tests and verify GREEN**

Run the command from Step 2. Expected: PASS with no filesystem access.

- [ ] **Step 7: Check duplicates and commit the layer**

```shell
pnpm duplicates -- --base 613073729
git add packages/rules/scripts/fill-value-catalog
git commit -m "feat: :sparkles: извлекать FillValue из XML"
```

---

### Task 3: Обогащение стандартных реквизитов текущими rules.ts

**Files:**
- Create: `packages/rules/scripts/fill-value-catalog/rulesEnrichment.ts`
- Modify: `packages/rules/scripts/fill-value-catalog/xmlScanner.ts`
- Test: `packages/rules/scripts/fill-value-catalog/rulesEnrichment.test.ts`
- Test: `packages/rules/scripts/fill-value-catalog/xmlScanner.test.ts`

**Interfaces:**
- Consumes: `metadataRules`, `createMetadataExecutionRegistrySets(metadataRules)`, owner root tag/name and raw standard member.
- Produces: `createStandardAttributeEnricher(): StandardAttributeEnricher`, returning type evidence, declaration policy, typed value and rules classification.

- [ ] **Step 1: Write failing declaration-source tests**

```ts
const enrich = createStandardAttributeEnricher()

expect(enrich({ ownerXmlKind: "Document", ownerName: "Заказ", internalName: "Date", ownerProperties: {} }))
  .toMatchObject({ type: { source: "rules", family: "dateTime" }, declaration: { family: "primitive" } })

expect(enrich({ ownerXmlKind: "Catalog", ownerName: "Контрагенты", internalName: "Ref", ownerProperties: {} }))
  .toMatchObject({ type: { source: "rules", family: "reference", signature: "reference(Catalog.Контрагенты)" } })

expect(enrich({ ownerXmlKind: "Unknown", ownerName: "X", internalName: "Date", ownerProperties: {} }))
  .toMatchObject({ type: { source: "unresolved", family: "unresolved" } })
```

- [ ] **Step 2: Run focused enrichment tests and verify RED**

```shell
pnpm --filter @nkdk/rules exec vitest run scripts/fill-value-catalog/rulesEnrichment.test.ts --project unit
```

Expected: FAIL because the enricher does not exist.

- [ ] **Step 3: Resolve XML owner tags through registered metadata item rules**

Build a map once from `Object.values(metadataRules.projectSpecs).map(({ rule })
=> rule)`. For each rule, read the `xmlRoot` property rule's `container`; map
that XML container to
`registries.validation.dataPaths.getOwnerKindByItemType(rule.itemType)?.kind`.
Never hardcode `Document → Документ` in the scanner.

- [ ] **Step 4: Resolve declarations and normalized types**

Use `registries.validation.dataPaths.getStandardMembers(ownerKind)` and match `names.internal`. Convert declaration families as follows:

```ts
primitive string  -> string
primitive number  -> number
primitive boolean -> boolean
primitive dateTime -> dateTime(DateTime)
sameOwnerObject -> reference(<metadata root>.<owner name>)
objectRefFromProperty/objectRefsFromProperty -> unresolved until required owner facts are available
other families -> unresolved with the declaration family in the reason
```

Store `memberKind`, `family`, `names`, `fillValue.policy` and the imported owner
properties used by the resolver as `rulesEvidence`. The XML fact remains
unchanged. Dynamic declaration families that cannot yet be resolved keep these
facts with an explicit reason, so a later version can add resolution without
rescanning the catalog.

- [ ] **Step 5: Import only owner properties required by the declaration**

Derive the required model keys from declaration fields and its `fillValue`
policy: `property`, `typeProperty`, `lengthProperty`,
`allowedLengthProperty`, and `ownersProperty`. For each key, get
`ownerRule.properties[key]`, read XML at:

```ts
[
  ...(propertyRule.xmlParents ?? []),
  propertyRule.xml ?? `${key.charAt(0).toUpperCase()}${key.slice(1)}`,
]
```

and call:

```ts
registries.rules.property.getTypeRule(propertyRule.type, "importFromXML")(
  context,
  propertyRule,
  rawXmlValue,
)
```

Catching a missing handler or unsupported dynamic property produces an
unresolved reason while preserving successfully imported values in rule
evidence. Do not import the
whole metadata object. Add a scanner case for standard `Catalog.Code` with
`CodeType=String`, `CodeLength=9`, and `CodeAllowedLength=Variable`; expect
`string(length=9,allowedLength=Variable)` from source `rules`.

- [ ] **Step 6: Apply current FillValue classification separately**

For primitive declarations and a parsed typed value call `classifyStandardMemberFillValue({ declaration, value, ownerProperties })`. For unresolved dynamic types return `unresolved`; for absent or nil values return `notSpecified`. Do not turn a rules result into `valueCategory` except that `implicit` maps a parsed primitive to `initial`.

- [ ] **Step 7: Run scanner and enrichment tests and verify GREEN**

```shell
pnpm --filter @nkdk/rules exec vitest run \
  scripts/fill-value-catalog/rulesEnrichment.test.ts \
  scripts/fill-value-catalog/xmlScanner.test.ts \
  --project unit
```

Expected: PASS.

- [ ] **Step 8: Check duplicates and commit the layer**

```shell
pnpm duplicates -- --base 613073729
git add packages/rules/scripts/fill-value-catalog
git commit -m "feat: :sparkles: определять типы стандартных реквизитов"
```

---

### Task 4: Агрегированный JSON и сводный Markdown

**Files:**
- Create: `packages/rules/scripts/fill-value-catalog/aggregate.ts`
- Create: `packages/rules/scripts/fill-value-catalog/markdown.ts`
- Test: `packages/rules/scripts/fill-value-catalog/aggregate.test.ts`
- Test: `packages/rules/scripts/fill-value-catalog/markdown.test.ts`

**Interfaces:**
- Consumes: `FillValueObservation[]` and unresolved observations.
- Produces: `aggregateObservations(observations, examplesLimit): CatalogReport` and `renderCatalogMarkdown(report): string`.

- [ ] **Step 1: Write failing aggregation tests**

Create three date observations: two identical initial dates in different files and one explicit date. Assert:

```ts
expect(report.values).toEqual([
  expect.objectContaining({ valueCategory: "initial", occurrences: 2, configurations: ["acc", "doc"] }),
  expect.objectContaining({ valueCategory: "explicit", occurrences: 1, exactValue: "2026-08-23T10:20:30" }),
])
expect(report.summary).toContainEqual(expect.objectContaining({
  typeFamily: "dateTime",
  valueCategory: "explicit",
  occurrences: 1,
  uniqueValues: 1,
}))
```

Add a reference case with ten exact predefined values and assert the summary has one `predefinedRef` row with `uniqueValues: 10`, while `values` retains ten exact variants.

- [ ] **Step 2: Run aggregation tests and verify RED**

```shell
pnpm --filter @nkdk/rules exec vitest run scripts/fill-value-catalog/aggregate.test.ts --project unit
```

Expected: FAIL because `aggregateObservations` is absent.

- [ ] **Step 3: Implement deterministic exact-value aggregation**

The exact key is a JSON serialization of:

```ts
[
  attributeKind,
  attributeKind === "standard" ? [ownerKind, attributeName] : null,
  type.source,
  type.signature,
  valueCategory,
  raw.form,
  raw.xsiType ?? null,
  raw.text ?? null,
  rulesClassification,
  rulesReason ?? null,
  rulesEvidence ?? null,
]
```

Each entry increments `occurrences`, collects configuration names in a set and keeps only the first `examplesLimit` lexicographically sorted relative paths. Convert sets to sorted arrays before returning.
Ordinary entries additionally collect all source names in sorted
`attributeNames`, but those names do not split a type/value group. The standard
owner kind and internal attribute name remain in the key because their policy
is part of the meaning.

- [ ] **Step 4: Implement summary aggregation and statuses**

Group the exact entries by `type.family`, `type.signature`, `attributeKind`, `valueCategory`, and `raw.form`. Compute occurrences, unique exact values and unique configurations. Status precedence is:

```ts
unresolved type -> "тип не определён"
any rulesClassification === "invalid" -> "противоречит rules"
more than one category or XML form in the type group -> "варианты"
otherwise -> "однозначно"
```

Different exact explicit values inside one category do not create a contradiction.

- [ ] **Step 5: Write and run a failing Markdown snapshot-by-lines test**

Assert meaningful lines instead of a full-file snapshot:

```ts
expect(markdown).toContain("## Дата и время")
expect(markdown).toContain("| ДатаВремя (дата и время) | Явное значение | typedText | 1 | 1 |")
expect(markdown).toContain("## Ссылки")
expect(markdown).toContain("Справочник.Контрагенты")
expect(markdown).toContain("## Неразобранное")
```

- [ ] **Step 6: Implement Markdown rendering and verify GREEN**

Render Russian family labels, escape `|` and newlines in cells, and cap exact values/examples by the requested limit. Keep a stable family order: string, number, boolean, dateTime, reference, composite, unresolved; sort signatures and categories lexicographically inside it.

Run:

```shell
pnpm --filter @nkdk/rules exec vitest run \
  scripts/fill-value-catalog/aggregate.test.ts \
  scripts/fill-value-catalog/markdown.test.ts \
  --project unit
```

Expected: PASS.

- [ ] **Step 7: Check duplicates and commit the layer**

```shell
pnpm duplicates -- --base 613073729
git add packages/rules/scripts/fill-value-catalog
git commit -m "feat: :sparkles: строить отчёт по значениям заполнения"
```

---

### Task 5: Файловый обход и CLI анализатора

**Files:**
- Create: `packages/rules/scripts/analyze-fill-value-defaults.ts`
- Create: `packages/rules/scripts/analyze-fill-value-defaults.integration.test.ts`

**Interfaces:**
- Consumes: scanner, enricher, aggregator and Markdown renderer from Tasks 2–4.
- Produces: `parseAnalyzeFillValueArgs()`, `analyzeFillValueCatalog(options)` and CLI writing `fill-value-observations.json` plus `fill-value-summary.md`.

- [ ] **Step 1: Write a failing filesystem integration test**

Create a temporary catalog with `doc/Documents/Заказ.xml` and `acc/CommonAttributes/Дата.xml`, call `analyzeFillValueCatalog({ catalogRoot, outputDir, concurrency: 2, examples: 2, configurations: [] })`, then assert both files exist, JSON paths are relative, and Markdown has date and reference sections. Clean the temporary directory in `afterEach`.

- [ ] **Step 2: Run the integration test and verify RED**

```shell
pnpm --filter @nkdk/rules exec vitest run scripts/analyze-fill-value-defaults.integration.test.ts --project integration
```

Expected: FAIL because the analyzer entry point is absent.

- [ ] **Step 3: Implement strict argument parsing**

Support exactly:

```text
analyze-fill-value-defaults <catalog-root> --output <dir>
  [--concurrency N] [--examples N] [--configuration NAME ...]
```

Defaults are `concurrency: 4`, `examples: 3`. Reject missing paths, unknown switches, non-positive integers, a missing catalog root and a requested configuration not present as an immediate directory.
`-h` and `--help` print the complete usage text and exit successfully without
requiring paths.

- [ ] **Step 4: Implement deterministic bounded traversal**

Use `readdir(..., { withFileTypes: true })`, reject symbolic links, sort names before recursion, include case-insensitive `.xml`, and ignore `ConfigDumpInfo.xml`. Treat each selected immediate child directory as one configuration. Limit concurrent `readFile`/scan operations with existing `p-limit`.

- [ ] **Step 5: Write only the two owned output files**

Create `outputDir` without deleting it, then overwrite only:

```text
fill-value-observations.json
fill-value-summary.md
```

Serialize JSON with two-space indentation and a trailing newline. Do not include catalog root, output root, timestamps or durations in JSON because they break reproducibility.

- [ ] **Step 6: Run integration test and CLI error test; verify GREEN**

Add a test that invokes `parseAnalyzeFillValueArgs([])` and expects the usage error. Then run:

```shell
pnpm --filter @nkdk/rules exec vitest run scripts/analyze-fill-value-defaults.integration.test.ts --project integration
```

Expected: PASS.

- [ ] **Step 7: Check duplicates and commit the layer**

```shell
pnpm duplicates -- --base 613073729
git add packages/rules/scripts/analyze-fill-value-defaults.ts packages/rules/scripts/analyze-fill-value-defaults.integration.test.ts
git commit -m "feat: :sparkles: анализировать каталог значений заполнения"
```

---

### Task 6: Проектный навык и стабильный запуск

**Files:**
- Create: `.agents/skills/analyze-fill-value-defaults/SKILL.md`
- Create: `.agents/skills/analyze-fill-value-defaults/analyze-fill-value-defaults.mjs`
- Create: `.agents/skills/analyze-fill-value-defaults/analyze-fill-value-defaults.test.mjs`

**Interfaces:**
- Consumes: package CLI from Task 5.
- Produces: user-facing project skill `analyze-fill-value-defaults` and Node wrapper preserving all CLI arguments and exit code.

- [ ] **Step 1: Scaffold the skill with the project skill-creator**

```shell
python /Users/nikita/.codex/skills/.system/skill-creator/scripts/init_skill.py \
  analyze-fill-value-defaults \
  --path .agents/skills
```

- [ ] **Step 2: Write the failing wrapper integration test before the wrapper**

The Node test runner test creates a temporary mini-catalog, invokes:

```js
await execFileAsync(process.execPath, [
  scriptPath,
  catalogRoot,
  "--output", outputDir,
  "--configuration", "demo",
])
```

and asserts that both report files exist. A second test invokes `--help` and asserts the output contains `--configuration` and `--examples`.

- [ ] **Step 3: Run the skill test and verify RED**

```shell
node --test .agents/skills/analyze-fill-value-defaults/analyze-fill-value-defaults.test.mjs
```

Expected: FAIL because the wrapper is absent.

- [ ] **Step 4: Implement the wrapper**

The wrapper resolves the repository root from `import.meta.url` and runs:

```js
spawnSync("pnpm", [
  "--filter", "@nkdk/rules", "exec", "tsx",
  "scripts/analyze-fill-value-defaults.ts",
  ...process.argv.slice(2),
], { cwd: repoRoot, stdio: "inherit" })
```

Forward `signal` and set `process.exitCode` to the child status, defaulting to `1` when no status is available.

- [ ] **Step 5: Write the minimal precise SKILL.md**

Frontmatter:

```yaml
---
name: analyze-fill-value-defaults
description: Use when the user asks to systematize, compare, or investigate FillValue defaults across one or more 1C XML configuration catalogs by attribute type.
---
```

The body must instruct the agent to:

1. accept a catalog root and output directory;
2. run the wrapper, optionally filtering configurations;
3. read summary counters, then `противоречит rules`, `варианты`, and `тип не определён` sections;
4. use JSON exact variants and relative examples for evidence;
5. distinguish XML facts, semantic categories and current-rule evaluations;
6. ask for explicit approval before changing metadata rules or introducing `!xml`.

- [ ] **Step 6: Verify the skill and its command**

```shell
node --test .agents/skills/analyze-fill-value-defaults/analyze-fill-value-defaults.test.mjs
python /Users/nikita/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  .agents/skills/analyze-fill-value-defaults
```

Expected: all Node tests pass and validator prints a successful result.

- [ ] **Step 7: Check duplicates and commit the skill**

```shell
pnpm duplicates -- --base 613073729
git add .agents/skills/analyze-fill-value-defaults
git commit -m "feat: :sparkles: добавить навык исследования FillValue"
```

---

### Task 7: Полный каталог и проектные проверки

**Files:**
- Modify only if a defect is found: files created in Tasks 1–6.
- Generate outside repository: `/private/tmp/fill-value-defaults/fill-value-observations.json`
- Generate outside repository: `/private/tmp/fill-value-defaults/fill-value-summary.md`

**Interfaces:**
- Consumes: completed skill and analyzer.
- Produces: verified report for `/Users/nikita/git/round-trip-compact/cf` and evidence that repository checks pass.

- [ ] **Step 1: Run the complete catalog analysis**

```shell
node .agents/skills/analyze-fill-value-defaults/analyze-fill-value-defaults.mjs \
  /Users/nikita/git/round-trip-compact/cf \
  --output /private/tmp/fill-value-defaults \
  --concurrency 4 \
  --examples 3
```

Expected: exit code 0 and both report files are non-empty.

- [ ] **Step 2: Inspect report invariants**

Confirm with read-only commands that:

- total occurrences are greater than zero;
- dateTime contains separate `initial` and `explicit` categories when both occur;
- references contain target-specific signatures and reference value categories;
- every unresolved entry has a reason and a relative example path;
- JSON has no `/Users/` or `/private/` strings.

If an invariant fails, add one focused failing test to the narrowest module before changing implementation.

- [ ] **Step 3: Run focused tests and type checking**

```shell
pnpm --filter @nkdk/rules exec vitest run scripts/fill-value-catalog --project unit
pnpm --filter @nkdk/rules exec vitest run scripts/analyze-fill-value-defaults.integration.test.ts --project integration
node --test .agents/skills/analyze-fill-value-defaults/analyze-fill-value-defaults.test.mjs
pnpm type-check
```

Expected: all commands pass.

- [ ] **Step 4: Run repository-wide verification outside the LMDB sandbox**

```shell
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 613073729
```

Expected: every command exits 0; do not update dependency-cruiser baselines or XML fixtures.

- [ ] **Step 5: Commit any verification-driven fixes**

If Step 2–4 required code changes, commit only those tested fixes:

```shell
git add packages/rules/scripts/fill-value-catalog packages/rules/scripts/analyze-fill-value-defaults.ts packages/rules/scripts/analyze-fill-value-defaults.integration.test.ts .agents/skills/analyze-fill-value-defaults
git commit -m "fix: :bug: исправить отчёт по значениям заполнения"
```

If no files changed, do not create an empty commit.
