# Data Set Field Kinds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve all three 1C data composition schema data set field variants through XML -> model -> YAML -> XML.

**Architecture:** Add an explicit `Вид` discriminator in YAML and `kind` in the internal model for `DataCompositionSchemaDataSetField`. Map that discriminator to the XML `_xsi:type` values and keep old YAML compatible by treating missing `Вид` as `ПолеНабораДанныхСхемыКомпоновкиДанных`.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules in `packages/core/metadata/orchestration`, 1C XML fixtures.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/data.ts`: expected model/YAML fixtures for the three variants and legacy YAML.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/nested-data-set.xml`: XML fixture for `dcssch:DataSetFieldNestedDataSet`.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/folder.xml`: XML fixture for `dcssch:DataSetFieldFolder`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`: import and round-trip coverage for all variants.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAML.test.ts`: YAML import coverage, including missing `Вид`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toXML.test.ts`: XML export coverage for all variants.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toYAML.test.ts`: YAML export coverage for all variants.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/kind.ts`: discriminator constants, XML/YAML mapping, type-rule registrations, JSON schema.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`: add `kind` property and per-kind XML property gates.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/types.ts`: load/register `kind.ts` and export the kind type.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: register `DataCompositionSchemaDataSetFieldKind` as a property type.

Note: this worktree may already contain an earlier draft moved out of `develop`. The plan is authoritative; validate and adjust the draft rather than assuming it is correct.

Execution note: because this is a recovery after a draft was moved out of `develop`, Tasks 1-4 are tightly coupled and should be executed by one implementer subagent as a single unit, then reviewed by a spec-compliance subagent and a code-quality subagent.

## Task 1: Test Fixtures And Red Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/nested-data-set.xml`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/__fixtures__/folder.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toYAML.test.ts`

- [ ] **Step 1: Add expected model and YAML fixtures**

In `__fixtures__/data.ts`, add `kind` to the existing full fixture:

```ts
export const fullDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ПолеНабораДанныхСхемыКомпоновкиДанных",
  dataPath: "Реквизит1",
  field: "Реквизит1",
  useRestriction: {
    itemType: "CalculatedFieldUseRestriction",
    condition: true,
  },
} as const satisfies DataCompositionSchemaDataSetField

export const fullDataCompositionSchemaDataSetFieldYAML = {
  Вид: "ПолеНабораДанныхСхемыКомпоновкиДанных",
  ПутьКДанным: "Реквизит1",
  Поле: "Реквизит1",
  ОграничениеИспользования: {
    Условие: "Истина",
  },
} as const satisfies DataCompositionSchemaDataSetFieldYAML

export const legacyDataCompositionSchemaDataSetFieldYAML = {
  ПутьКДанным: "Реквизит1",
  Поле: "Реквизит1",
  ОграничениеИспользования: {
    Условие: "Истина",
  },
} as const satisfies DataCompositionSchemaDataSetFieldYAML

export const nestedDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ВложенныйНаборДанныхСхемыКомпоновкиДанных",
  dataPath: "Товары",
  field: "Товары",
} as const

export const nestedDataCompositionSchemaDataSetFieldYAML = {
  Вид: "ВложенныйНаборДанныхСхемыКомпоновкиДанных",
  ПутьКДанным: "Товары",
  Поле: "Товары",
} as const

export const folderDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  kind: "ПапкаПолейНабораДанныхСхемыКомпоновкиДанных",
  dataPath: "ГруппаПолей",
  title: {
    items: {
      ru: "Группа полей",
    },
  },
  useRestriction: {
    itemType: "CalculatedFieldUseRestriction",
    condition: true,
  },
} as const

export const folderDataCompositionSchemaDataSetFieldYAML = {
  Вид: "ПапкаПолейНабораДанныхСхемыКомпоновкиДанных",
  ПутьКДанным: "ГруппаПолей",
  Заголовок: "Группа полей",
  ОграничениеИспользования: {
    Условие: "Истина",
  },
} as const
```

- [ ] **Step 2: Add XML fixtures**

Create `nested-data-set.xml`:

```xml
<Field xsi:type="dcssch:DataSetFieldNestedDataSet">
	<dcssch:dataPath>Товары</dcssch:dataPath>
	<dcssch:field>Товары</dcssch:field>
</Field>
```

Create `folder.xml`:

```xml
<Field xsi:type="dcssch:DataSetFieldFolder">
	<dcssch:dataPath>ГруппаПолей</dcssch:dataPath>
	<dcssch:title xsi:type="v8:LocalStringType">
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Группа полей</v8:content>
		</v8:item>
	</dcssch:title>
	<dcssch:useRestriction>
		<dcssch:condition>true</dcssch:condition>
	</dcssch:useRestriction>
</Field>
```

- [ ] **Step 3: Add XML import/export expectations**

In `fromXML.test.ts`, import the three fixtures from `data.ts` and add tests:

```ts
it("round-trips nested-data-set.xml", () => {
  const imported = testImportPropertyFromXML({
    rule,
    path: "nested-data-set.xml",
    xmlRootTag: "Field",
    importMetaUrl: import.meta.url,
  })

  const { result, expectedResult } = testExportPropertyToXML({
    rule,
    value: imported,
    xmlRootTag: "Field",
    path: "nested-data-set.xml",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(expectedResult)
})

it("imports nested data set kind", () => {
  const result = testImportPropertyFromXML({
    rule,
    path: "nested-data-set.xml",
    xmlRootTag: "Field",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(nestedDataCompositionSchemaDataSetField)
})

it("round-trips folder.xml", () => {
  const imported = testImportPropertyFromXML({
    rule,
    path: "folder.xml",
    xmlRootTag: "Field",
    importMetaUrl: import.meta.url,
  })

  const { result, expectedResult } = testExportPropertyToXML({
    rule,
    value: imported,
    xmlRootTag: "Field",
    path: "folder.xml",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(expectedResult)
})

it("imports folder kind", () => {
  const result = testImportPropertyFromXML({
    rule,
    path: "folder.xml",
    xmlRootTag: "Field",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(folderDataCompositionSchemaDataSetField)
})
```

In `toXML.test.ts`, add export tests for `nested-data-set.xml` and `folder.xml` with `testExportPropertyToXML`.

- [ ] **Step 4: Add YAML import/export expectations**

In `fromYAML.test.ts`, add:

```ts
it("imports legacy YAML without kind as field kind", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "DataCompositionSchemaDataSetField" },
    value: legacyDataCompositionSchemaDataSetFieldYAML,
  })

  expect(result).toEqual(fullDataCompositionSchemaDataSetField)
})

it("imports nested data set kind", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "DataCompositionSchemaDataSetField" },
    value: nestedDataCompositionSchemaDataSetFieldYAML,
  })

  expect(result).toEqual(nestedDataCompositionSchemaDataSetField)
})

it("imports folder kind", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "DataCompositionSchemaDataSetField" },
    value: folderDataCompositionSchemaDataSetFieldYAML,
  })

  expect(result).toEqual(folderDataCompositionSchemaDataSetField)
})
```

In `toYAML.test.ts`, assert that each variant exports `Вид` with the long 1C name.

- [ ] **Step 5: Run tests to verify red**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField
```

Expected before implementation: failures showing missing `kind`, missing YAML `Вид`, and wrong XML `xsi:type` for nested/folder variants. If this recovery worktree still contains the moved implementation draft, the test may already pass; in that case record that the red phase was previously observed before the move, and continue with the plan validation instead of deleting the draft.

## Task 2: Kind Type Rule And Registry

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/kind.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/types.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Create kind mapping**

Create `kind.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"

export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD =
  "ПолеНабораДанныхСхемыКомпоновкиДанных"
export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER =
  "ПапкаПолейНабораДанныхСхемыКомпоновкиДанных"
export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET =
  "ВложенныйНаборДанныхСхемыКомпоновкиДанных"

export const DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KINDS = [
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET,
] as const

export type DataCompositionSchemaDataSetFieldKind =
  (typeof DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KINDS)[number]

const KIND_TO_XSI_TYPE: Record<DataCompositionSchemaDataSetFieldKind, string> = {
  [DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD]: "dcssch:DataSetFieldField",
  [DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER]: "dcssch:DataSetFieldFolder",
  [DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET]: "dcssch:DataSetFieldNestedDataSet",
}

const XSI_TYPE_TO_KIND: Record<string, DataCompositionSchemaDataSetFieldKind> = Object.fromEntries(
  Object.entries(KIND_TO_XSI_TYPE).map(([kind, xsiType]) => [xsiType, kind])
) as Record<string, DataCompositionSchemaDataSetFieldKind>

export const dataCompositionSchemaDataSetFieldKindFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): DataCompositionSchemaDataSetFieldKind => {
  if (value === undefined || value === null || value === "") {
    return DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
  }

  if (typeof value !== "string" || XSI_TYPE_TO_KIND[value] === undefined) {
    throw new Error(`Unsupported DataCompositionSchemaDataSetField xsi:type: ${String(value)}`)
  }

  return XSI_TYPE_TO_KIND[value]
}

export const dataCompositionSchemaDataSetFieldKindToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: DataCompositionSchemaDataSetFieldKind | undefined
): string => {
  const kind = value ?? DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
  const xsiType = KIND_TO_XSI_TYPE[kind]
  if (xsiType === undefined) {
    throw new Error(`Unsupported DataCompositionSchemaDataSetField kind: ${String(kind)}`)
  }
  return xsiType
}

export const dataCompositionSchemaDataSetFieldKindFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): DataCompositionSchemaDataSetFieldKind => {
  if (value === undefined || value === null || value === "") {
    return DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
  }

  if (typeof value !== "string" || !isDataCompositionSchemaDataSetFieldKind(value)) {
    throw new Error(`Unsupported DataCompositionSchemaDataSetField Вид: ${String(value)}`)
  }

  return value
}

export const dataCompositionSchemaDataSetFieldKindToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: DataCompositionSchemaDataSetFieldKind | undefined
): DataCompositionSchemaDataSetFieldKind => value ?? DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD

export const isDataCompositionSchemaDataSetFieldKind = (
  value: string
): value is DataCompositionSchemaDataSetFieldKind =>
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KINDS.includes(value as DataCompositionSchemaDataSetFieldKind)

export const getDataCompositionSchemaDataSetFieldKind = (
  item: { kind?: DataCompositionSchemaDataSetFieldKind } | undefined
): DataCompositionSchemaDataSetFieldKind => item?.kind ?? DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD

registerTypeRule("DataCompositionSchemaDataSetFieldKind", "importFromXML", dataCompositionSchemaDataSetFieldKindFromXML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "exportToXML", dataCompositionSchemaDataSetFieldKindToXML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "importFromYAML", dataCompositionSchemaDataSetFieldKindFromYAML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "exportToYAML", dataCompositionSchemaDataSetFieldKindToYAML)
registerTypeRule("DataCompositionSchemaDataSetFieldKind", "exportToJSONSchema", () =>
  Type.Union([
    Type.Literal(DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD),
    Type.Literal(DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER),
    Type.Literal(DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET),
  ])
)
```

- [ ] **Step 2: Load kind registration from types**

In `types.ts`, add:

```ts
import "./kind"
export type { DataCompositionSchemaDataSetFieldKind } from "./kind"
```

- [ ] **Step 3: Register property type**

In `packages/core/metadata/orchestration/property/registry.ts`, import the type and add registry entries:

```ts
import type {
  DataCompositionSchemaDataSetField,
  DataCompositionSchemaDataSetFieldKind,
  DataCompositionSchemaDataSetFieldYAML,
  DataSetFieldFields,
  DataSetFieldFieldsYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/types"
```

Add to `PropertyTypeRegistry`:

```ts
DataCompositionSchemaDataSetFieldKind: {
  item: DataCompositionSchemaDataSetFieldKind
  yaml: DataCompositionSchemaDataSetFieldKind
}
```

Add to `PropertyRuleTypeNames`:

```ts
DataCompositionSchemaDataSetFieldKind: "DataCompositionSchemaDataSetFieldKind",
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField
```

Expected after this task: YAML `Вид` import/export can work once `rules.ts` is wired; XML `xsi:type` may still fail until Task 3.

## Task 3: Wire Kind Into Data Set Field Rules

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`

- [ ] **Step 1: Import kind helpers**

Add imports and predicates near the top of `rules.ts`:

```ts
import {
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET,
  getDataCompositionSchemaDataSetFieldKind,
} from "./kind"

type DataSetFieldKindOwner = Parameters<typeof getDataCompositionSchemaDataSetFieldKind>[0]

const isField = (item: DataSetFieldKindOwner) =>
  getDataCompositionSchemaDataSetFieldKind(item) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
const isFolder = (item: DataSetFieldKindOwner) =>
  getDataCompositionSchemaDataSetFieldKind(item) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER
const isNestedDataSet = (item: DataSetFieldKindOwner) =>
  getDataCompositionSchemaDataSetFieldKind(item) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET
```

- [ ] **Step 2: Add `kind` property**

Inside `DataCompositionSchemaDataSetFieldRules.properties`, before `dataPath`, add:

```ts
kind: {
  type: "DataCompositionSchemaDataSetFieldKind",
  xml: "_xsi:type",
  yaml: "Вид",
  defaultValue: DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
  toXML: (metadataItem) => metadataItem?.kind !== undefined,
  order: 0,
},
```

Keep top-level `xsiType: "dcssch:DataSetFieldField"` for backwards-compatible default export when `kind` is absent.

- [ ] **Step 3: Gate XML-only properties by variant**

Update property rules:

```ts
field: {
  type: "string",
  xml: "dcssch:field",
  yaml: "Поле",
  toXML: (metadataItem) => isField(metadataItem) || isNestedDataSet(metadataItem),
  order: 2,
},
useRestriction: {
  type: "CalculatedFieldUseRestriction",
  xml: "dcssch:useRestriction",
  yaml: "ОграничениеИспользования",
  toXML: (metadataItem) => isField(metadataItem) || isFolder(metadataItem),
  order: 4,
},
attributeUseRestriction: {
  type: "string",
  xml: "dcssch:attributeUseRestriction",
  yaml: "ОграничениеИспользованияРеквизитов",
  toXML: isField,
  order: 5,
},
role: {
  type: "string",
  xml: "dcssch:role",
  yaml: "Роль",
  toXML: isField,
  order: 6,
},
presentationExpression: {
  type: "string",
  xml: "dcssch:presentationExpression",
  yaml: "ВыражениеПредставления",
  toXML: isField,
  order: 7,
},
orderExpressions: {
  type: "string",
  xml: "dcssch:orderExpressions",
  yaml: "ВыраженияУпорядочивания",
  toXML: isField,
  order: 8,
},
hierarchyCheckDataSet: {
  type: "string",
  xml: "dcssch:hierarchyCheckDataSet",
  yaml: "НаборДанныхПроверкиИерархии",
  toXML: isField,
  order: 9,
},
hierarchyCheckDataSetParameter: {
  type: "string",
  xml: "dcssch:hierarchyCheckDataSetParameter",
  yaml: "ПараметрНабораДанныхПроверкиИерархии",
  toXML: isField,
  order: 10,
},
valueType: {
  type: "TypeDescription",
  xml: "dcssch:valueType",
  yaml: "ТипЗначения",
  toXML: isField,
  order: 11,
},
appearance: {
  type: "string",
  xml: "dcssch:appearance",
  yaml: "Оформление",
  toXML: isField,
  order: 12,
},
editParameters: {
  type: "string",
  xml: "dcssch:editParameters",
  yaml: "ПараметрыРедактирования",
  toXML: isField,
  order: 13,
},
```

Keep `dataPath` available for all three variants. Keep `title` available for all three variants.

- [ ] **Step 4: Run targeted tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField
```

Expected: 4 test files pass, 16 tests pass.

## Task 4: Round-Trip Verification And Commit

**Files:**
- No new implementation files beyond Tasks 1-3.
- Use git to stage and commit only the data set field changes and this plan.

- [ ] **Step 1: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 2: Run targeted tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField
```

Expected: 4 test files pass, 16 tests pass.

- [ ] **Step 3: Run short round-trip triage**

The round-trip skill requires a clean worktree. If there are uncommitted changes, commit first or run the reproducer after committing.

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 15
```

Expected: the previous diff where `<Field xsi:type="dcssch:DataSetFieldNestedDataSet">` became `<Field xsi:type="dcssch:DataSetFieldField">` should be gone. Other unrelated diffs in the 15-19 range may remain.

- [ ] **Step 4: Commit**

Stage only relevant files:

```bash
git add docs/superpowers/plans/2026-05-07-data-set-field-kinds.md \
  packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField \
  packages/core/metadata/orchestration/property/registry.ts
```

Commit:

```bash
git commit -m "feat: :sparkles: добавить виды полей набора данных СКД"
```

Expected: one commit on `codex/data-set-field-kinds`.

## Self-Review

- Spec coverage: covers all three variants, YAML `Вид`, XML `_xsi:type`, backward compatibility for missing `Вид`, targeted tests, and round-trip verification.
- Placeholder scan: no placeholders; every task names exact files and commands.
- Type consistency: `DataCompositionSchemaDataSetFieldKind`, `kind`, and YAML `Вид` are used consistently across fixtures, rules, registry, and tests.
