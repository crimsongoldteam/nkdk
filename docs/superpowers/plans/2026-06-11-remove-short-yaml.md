# Remove Short YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scalar short YAML forms invalid and make exported YAML use only explicit object forms.

**Architecture:** Remove the generic `useAsShortValueYAML` scalar shortcut from orchestration, then tighten the metadata/form/register/command YAML types and tests that depended on it. Keep `yamlInline` untouched because it controls nesting shape, not scalar shorthand.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Vitest, pnpm, existing `rules.ts` orchestration.

---

## Files To Modify

- `packages/core/metadata/orchestration/property/fromYAML.ts`: reject non-object metadata item YAML after `yamlInline` normalization and remove scalar short import handling.
- `packages/core/metadata/orchestration/property/toYAML.ts`: remove scalar short export handling.
- `packages/core/metadata/orchestration/property/types.ts`: remove `useAsShortValueYAML`.
- `packages/core/metadata/orchestration/property/fromYAML.test.ts`: add regression for scalar metadata item YAML rejection.
- `packages/core/metadata/orchestration/property/toYAML.test.ts`: create regression for object export even when only one property is present.
- `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`: remove `useAsShortValueYAML`.
- `packages/core/metadata/commonObjects/metadataAttribute/types.ts`: make `MetadataAttributeYAML` object-only.
- `packages/core/metadata/commonObjects/metadataAttribute/register.ts`: remove custom scalar/type-description short import and schema union.
- `packages/core/metadata/commonObjects/metadataAttribute/__fixtures__/data.ts`: replace short YAML fixtures with object YAML.
- `packages/core/metadata/commonObjects/metadataAttribute/fromYAML.test.ts`: remove scalar-short success tests and add rejection/schema-oriented checks.
- `packages/core/metadata/commonObjects/metadataAttribute/toYAML.test.ts`: update expectations to object YAML.
- `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`: remove `useAsShortValueYAML`.
- `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`: make form attributes and columns object-only.
- `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.ts`: remove `TypeDescriptionYAML` branches from attribute and column import helpers.
- `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.ts`: return only object YAML for attributes.
- `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/data.ts`: replace short form attribute YAML with object YAML.
- `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`: remove scalar-short success test and add object-only check.
- `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`: update short-format expectation to object format.
- `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`: remove `useAsShortValueYAML`.
- `packages/core/metadata/commonObjects/metadataRegisterField/types.ts`: make `MetadataRegisterFieldYAML` object-only.
- `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`: replace scalar-short tests with object YAML or rejection tests.
- `packages/core/metadata/appliedObjects/metadataCommand/rules.ts`: remove `useAsShortValueYAML`.
- `packages/core/metadata/appliedObjects/metadataCommand/types.ts`: make `MetadataCommandYAML` object-only.
- `packages/core/metadata/appliedObjects/metadataCommand/__fixtures__/data.ts`: update command YAML fixtures.
- `packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts`: create schema regression for command scalar shorthand.
- `packages/core/metadata/appliedObjects/metadataCommonAttribute/rules.ts`: remove scalar shorthand flag.
- `packages/core/metadata/appliedObjects/metadataSessionParameter/rules.ts`: remove scalar shorthand flag.
- `packages/core/metadata/appliedObjects/metadataFilterCriterion/rules.ts`: remove scalar shorthand flag.
- `packages/core/metadata/appliedObjects/metadataDefinedType/rules.ts`: remove scalar shorthand flag.
- `packages/core/metadata/appliedObjects/metadataConstant/rules.ts`: remove scalar shorthand flag.
- `packages/core/metadata/forms/commonObjects/formParameter/rules.ts`: remove scalar shorthand flag.
- Existing YAML fixtures under `packages/core/metadata/**/__fixtures__/sync/yaml/**`: update generated expectations from scalar fields to object fields when focused tests fail.

## Pre-Flight

- [ ] **Step 1: Confirm isolated worktree and existing changes**

Run:

```bash
git branch --show-current
git status --short
```

Expected:

```text
codex/validation-error-analysis
 M packages/core/metadata/validation/validateProject.test.ts
 M packages/core/metadata/validation/validateProject.ts
```

The two modified validation files are the earlier schema-cache work. Do not mix them into commits for this plan unless the user explicitly asks.

- [ ] **Step 2: Read metadata knowledge before touching `packages/core/metadata/**`**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Then read the documents it points to for YAML contract and registries:

```bash
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,220p' .agents/knowledge/metadata/registries.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
```

Expected: no command failure. Keep XML fixtures untouched.

- [ ] **Step 3: Capture the current shorthand surface**

Run:

```bash
rg "useAsShortValueYAML|\\| TypeDescriptionYAML|\\| MetadataCommandGroupYAML" packages/core/metadata -n
```

Expected before implementation: matches in `metadataAttribute`, `formAttribute`, `metadataRegisterField`, `metadataCommand`, and other item rules such as constants/session parameters/defined types. Use this list as the audit checklist.

## Task 1: Remove Generic Scalar Shortcut

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAML.test.ts`
- Create: `packages/core/metadata/orchestration/property/toYAML.test.ts`

- [ ] **Step 1: Write failing import regression**

Append this test to `packages/core/metadata/orchestration/property/fromYAML.test.ts` inside `describe("importPropertiesFromYAML", ...)`:

```ts
  it("rejects scalar YAML for metadata items without yamlInline", () => {
    expect(() =>
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: {
          itemType: "MetadataAttribute",
          properties: {
            type: { yaml: "Тип", type: "TypeDescription", required: true },
          },
        },
        name: "Организация",
        yaml: "Справочник.Организации" as never,
      })
    ).toThrow('MetadataAttribute: ожидался YAML-объект')
  })
```

- [ ] **Step 2: Create failing export regression**

Create `packages/core/metadata/orchestration/property/toYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportPropertiesToYAML } from "./toYAML"
import type { MetadataItemRule } from "./types"

const singleTypeRule = {
  itemType: "MetadataAttribute",
  properties: {
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      required: true,
    },
  },
} as const satisfies MetadataItemRule

describe("exportPropertiesToYAML", () => {
  it("keeps metadata items as objects when only one YAML property is exported", () => {
    const result = exportPropertiesToYAML({
      context: mockContextToYAML,
      rule: singleTypeRule,
      data: {
        itemType: "MetadataAttribute",
        type: { type: ["CatalogRef.Организации"] },
      },
    })

    expect(result).toEqual({ Тип: "Справочник.Организации" })
  })
})
```

- [ ] **Step 3: Run red tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/orchestration/property/fromYAML.test.ts metadata/orchestration/property/toYAML.test.ts
```

Expected:

- `fromYAML.test.ts` fails because scalar YAML is currently accepted.
- `toYAML.test.ts` may pass already for this synthetic rule if no `useAsShortValueYAML` is set; this is okay. The later concrete tests must fail before implementation.

- [ ] **Step 4: Remove scalar import shortcut**

In `packages/core/metadata/orchestration/property/fromYAML.ts`, remove the `handleShortFormatYAML(...)` call and delete the `handleShortFormatYAML` function.

Add this helper near `importPropertiesFromYAML`:

```ts
function assertMetadataItemYAMLObject(params: { itemType: string; yaml: unknown }): void {
  const { itemType, yaml } = params
  if (yaml === undefined) return
  if (yaml !== null && typeof yaml === "object" && !Array.isArray(yaml)) return

  throw new Error(`${itemType}: ожидался YAML-объект`)
}
```

Call it at the start of `importPropertiesFromYAML`, after `result` is created and before external-file processing:

```ts
  assertMetadataItemYAMLObject({ itemType: metadataType, yaml })
```

Do not add this guard to `importMetadataItemFromYAML`; `yamlInline` is normalized there before `importPropertiesFromYAML`, and the guard belongs after that normalization.

- [ ] **Step 5: Remove scalar export shortcut**

In `packages/core/metadata/orchestration/property/toYAML.ts`, remove:

```ts
  let shortValue = undefined
  let canUseShortFormat: boolean = true
```

Remove the block that updates `shortValue`/`canUseShortFormat`, and remove:

```ts
  if (canUseShortFormat) return shortValue
```

`exportPropertiesToYAML` should always return the accumulated object.

- [ ] **Step 6: Remove the property flag type**

In `packages/core/metadata/orchestration/property/types.ts`, remove:

```ts
  useAsShortValueYAML?: true
```

- [ ] **Step 7: Run orchestration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/orchestration/property/fromYAML.test.ts metadata/orchestration/property/toYAML.test.ts
```

Expected: both files pass.

- [ ] **Step 8: Commit Task 1**

Run:

```bash
git add packages/core/metadata/orchestration/property/fromYAML.ts \
  packages/core/metadata/orchestration/property/toYAML.ts \
  packages/core/metadata/orchestration/property/types.ts \
  packages/core/metadata/orchestration/property/fromYAML.test.ts \
  packages/core/metadata/orchestration/property/toYAML.test.ts
git commit -m "feat!: :sparkles: запретить скалярный YAML для metadataItem" -m "BREAKING CHANGE: YAML-элементы metadataItem больше не принимают скалярную сокращенную форму. Используйте объект с явными полями, например { Тип: Строка } вместо Строка."
```

## Task 2: Make Metadata Attributes Object-Only

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/toYAML.test.ts`
- Modify if needed: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Update tests to the new contract**

In `packages/core/metadata/commonObjects/metadataAttribute/fromYAML.test.ts`, replace the scalar-short import tests with an assertion that validation/schema rejects the old shape. Use the existing direct import tests for full and minimal object YAML.

Add this import:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { exportMetadataAttributesToJSONSchema } from "./register"
import { mockContext } from "~/tests/mockContext"
```

Add this test:

```ts
  it("rejects scalar metadata attribute YAML in JSON Schema", () => {
    const schema = TypeCompiler.Compile(
      exportMetadataAttributesToJSONSchema(mockContext, undefined, undefined)
    )

    expect(schema.Check({ Организация: "Справочник.Организации" })).toBe(false)
    expect(schema.Check({ Организация: { Тип: "Справочник.Организации" } })).toBe(true)
  })
```

If `exportMetadataAttributesToJSONSchema` is not exported, export it from `register.ts` in Step 4.

In `toYAML.test.ts`, change short-format expected objects from:

```ts
expect(result).toEqual(shortMetadataAttributeYAML)
```

to the object form:

```ts
expect(result).toEqual({
  ТестовыйРеквизит: {
    Тип: "Строка(10)",
  },
})
```

Use the actual fixture names from `__fixtures__/data.ts`; do not invent new exported constants if updating the existing ones is simpler.

- [ ] **Step 2: Run red metadata attribute tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/metadataAttribute/fromYAML.test.ts metadata/commonObjects/metadataAttribute/toYAML.test.ts
```

Expected: failures show scalar schema still accepted or fixtures still scalar.

- [ ] **Step 3: Make attribute YAML type object-only**

In `packages/core/metadata/commonObjects/metadataAttribute/types.ts`, change:

```ts
export type MetadataAttributeYAML = MetadataAttributeFullYAML | TypeDescriptionYAML
```

to:

```ts
export type MetadataAttributeYAML = MetadataAttributeFullYAML
```

Remove unused `TypeDescriptionYAML` import if it becomes unused.

- [ ] **Step 4: Simplify metadata attribute registration**

In `packages/core/metadata/commonObjects/metadataAttribute/register.ts`:

Remove these imports:

```ts
import { Type } from "@sinclair/typebox"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import "~/metadata/commonObjects/typeDescription/graphFromModel"
import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
```

Delete `isTypeDescriptionShortYAML`.

Change `importMetadataAttributeFromYAML` signature to:

```ts
const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  itemRule: MetadataAttributeItemRule,
  yaml: MetadataAttributeYAML,
  name: string
) => {
```

Remove the scalar branch. The body should just call `importMetadataItemFromYAML`, check `properties`, and return `{ ...properties, name }`.

Change `createExportMetadataAttributesToJSONSchema` to:

```ts
export const createExportMetadataAttributesToJSONSchema =
  (itemRule: MetadataAttributeItemRule): ExportToJSONSchemaFn =>
  ({ context }) => {
    const attributeSchema = exportMetadataItemToJSONSchema({
      context,
      rule: itemRule,
    })

    return Type.Record(Type.String(), attributeSchema)
  }
```

Keep `Type` imported for `Type.Record`. If tests need a public schema function for the generic `MetadataAttributes` collection, add:

```ts
export const exportMetadataAttributesToJSONSchema =
  createExportMetadataAttributesToJSONSchema(MetadataAttributeRules)
```

Use that export in the `MetadataAttributes` registration:

```ts
  toJSONSchema: exportMetadataAttributesToJSONSchema,
```

- [ ] **Step 5: Remove `useAsShortValueYAML` from attribute rules**

In `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, remove:

```ts
    useAsShortValueYAML: true,
```

from the `type` property rule.

- [ ] **Step 6: Update metadata attribute fixtures**

In `packages/core/metadata/commonObjects/metadataAttribute/__fixtures__/data.ts`, replace scalar fixture values like:

```ts
export const shortMetadataAttributeYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит: "Строка(10)",
}
```

with object values:

```ts
export const shortMetadataAttributeYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит: {
    Тип: "Строка(10)",
  },
}
```

For type-id object shorthand:

```ts
ТестовыйРеквизит: { ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] }
```

replace with:

```ts
ТестовыйРеквизит: {
  Тип: { ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] },
}
```

- [ ] **Step 7: Run metadata attribute tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/metadataAttribute/fromYAML.test.ts metadata/commonObjects/metadataAttribute/toYAML.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataAttribute \
  packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat!: :sparkles: сделать реквизиты metadata объектным YAML" -m "BREAKING CHANGE: Реквизиты metadata больше не принимают сокращение Реквизит: Тип. Используйте Реквизит: { Тип: ... }."
```

## Task 3: Make Form Attributes Object-Only

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts` only if schema still accepts scalar values.
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`

- [ ] **Step 1: Update form attribute tests**

In `fromYAML.test.ts`, replace:

```ts
  it("should import with short format", () => {
```

with a test that old scalar YAML is rejected by schema:

```ts
  it("rejects scalar form attribute YAML in JSON Schema", () => {
    const schema = TypeCompiler.Compile(
      exportFormAttributesToJSONSchema({ context: mockContext, rule: { type: "FormAttributes" } })
    )

    expect(schema.Check({ Организация: "Справочник.Организации" })).toBe(false)
    expect(schema.Check({ Организация: { Тип: "Справочник.Организации" } })).toBe(true)
  })
```

Add imports:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { exportFormAttributesToJSONSchema } from "./toJSONSchema"
```

In `toYAML.test.ts`, change the short-format expectation to object form:

```ts
expect(result).toEqual({
  Организация: {
    Тип: "Справочник.Организации",
  },
})
```

Use the actual fixture key and type from `shortFormAttributeYAML`.

- [ ] **Step 2: Run red form attribute tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/commonObjects/formAttribute/fromYAML.test.ts metadata/forms/commonObjects/formAttribute/toYAML.test.ts
```

Expected: failures while fixtures/types still allow scalar shorthand.

- [ ] **Step 3: Make form attribute types object-only**

In `types.ts`, change:

```ts
export type FormAttributesYAML = Record<string, FormAttributeYAML | TypeDescriptionYAML>
```

to:

```ts
export type FormAttributesYAML = Record<string, FormAttributeYAML>
```

If `FormAttributeColumnYAML` currently allows nested scalar type via `Колонки`, keep columns object-only too. Do not allow `Record<string, TypeDescriptionYAML>` for columns.

- [ ] **Step 4: Simplify form attribute import**

In `fromYAML.ts`:

Remove the `TypeDescriptionYAML` import.

Change:

```ts
  yaml: FormAttributeYAML | TypeDescriptionYAML,
```

to:

```ts
  yaml: FormAttributeYAML,
```

Change helper parameters named `yamlWithColumns: FormAttributeYAML | TypeDescriptionYAML` to `yamlWithColumns: FormAttributeYAML`.

Simplify object guards. Keep defensive checks for `undefined` collections, but remove branches whose only purpose is accepting scalar/array YAML as a short type.

- [ ] **Step 5: Simplify form attribute export**

In `toYAML.ts`:

Remove `TypeDescriptionYAML` import.

Change:

```ts
): FormAttributeYAML | TypeDescriptionYAML => {
```

to:

```ts
): FormAttributeYAML => {
```

The implementation can still call `exportPropertiesToYAML`, because Task 1 makes it return object YAML only.

- [ ] **Step 6: Remove form attribute short rule**

In `rules.ts`, remove `useAsShortValueYAML: true` from the `type` property.

- [ ] **Step 7: Update form attribute fixtures**

In `__fixtures__/data.ts`, replace scalar entries:

```ts
export const shortFormAttributeYAML = {
  Организация: "Справочник.Организации",
}
```

with:

```ts
export const shortFormAttributeYAML = {
  Организация: {
    Тип: "Справочник.Организации",
  },
}
```

Do the same for column fixtures if any column is written as `Колонка: Строка`.

- [ ] **Step 8: Run form attribute tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/commonObjects/formAttribute/fromYAML.test.ts metadata/forms/commonObjects/formAttribute/toYAML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: pass after fixture updates.

- [ ] **Step 9: Commit Task 3**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute \
  packages/core/metadata/forms/clientApplicationForm
git commit -m "feat!: :sparkles: сделать реквизиты форм объектным YAML" -m "BREAKING CHANGE: Реквизиты форм больше не принимают сокращение Реквизит: Тип. Используйте Реквизит: { Тип: ... }."
```

## Task 4: Make Register Fields Object-Only

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/fromYAML.test.ts`
- Modify fixtures under register applied objects if tests expose scalar YAML.

- [ ] **Step 1: Update register field tests**

In `fromYAML.test.ts`, replace scalar-short success cases with object YAML:

```ts
value: {
  УдалитьОКТМО_КПП: {
    Тип: "Строка(21)",
  },
}
```

and:

```ts
yaml: {
  Тип: "Булево",
}
```

Add a direct rejection test for scalar metadata item import:

```ts
  it("rejects scalar YAML register field", () => {
    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: AccountingFlagRules,
        name: "ПризнакУчетаПоУмолчанию",
        yaml: "Булево" as never,
      })
    ).toThrow("AccountingFlag: ожидался YAML-объект")
  })
```

- [ ] **Step 2: Run red register field tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/metadataRegisterField/fromYAML.test.ts
```

Expected: scalar tests fail before implementation.

- [ ] **Step 3: Make register field YAML type object-only**

In `types.ts`, change:

```ts
export type MetadataRegisterFieldYAML = MetadataRegisterFieldFullYAML | TypeDescriptionYAML
```

to:

```ts
export type MetadataRegisterFieldYAML = MetadataRegisterFieldFullYAML
```

Remove unused `TypeDescriptionYAML` import if no longer needed elsewhere in the file.

- [ ] **Step 4: Remove register field short rule**

In `rules.ts`, remove `useAsShortValueYAML: true` from the `type` property.

- [ ] **Step 5: Run register field tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/metadataRegisterField/fromYAML.test.ts metadata/appliedObjects/metadataInformationRegister/fromYAML.test.ts metadata/appliedObjects/metadataAccumulationRegister/fromYAML.test.ts
```

Expected: pass after updating any scalar fixtures found by failures.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataRegisterField \
  packages/core/metadata/appliedObjects/metadataInformationRegister \
  packages/core/metadata/appliedObjects/metadataAccumulationRegister
git commit -m "feat!: :sparkles: сделать поля регистров объектным YAML" -m "BREAKING CHANGE: Поля регистров больше не принимают сокращение Поле: Тип. Используйте Поле: { Тип: ... }."
```

## Task 5: Make Metadata Commands Object-Only

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommand/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommand/types.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommand/__fixtures__/data.ts`
- Modify command-related tests and YAML fixtures that fail.

- [ ] **Step 1: Add command schema regression**

Create or update a test in `packages/core/metadata/appliedObjects/metadataCommand/fromXML.test.ts` or a new `fromYAML.test.ts` if that is cleaner. Prefer a new file `packages/core/metadata/appliedObjects/metadataCommand/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { mockContext } from "~/tests/mockContext"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { MetadataCommandRules } from "./rules"

describe("MetadataCommand YAML", () => {
  it("rejects scalar command group shorthand in JSON Schema", () => {
    const schema = TypeCompiler.Compile(
      exportMetadataItemToJSONSchema({ context: mockContext, rule: MetadataCommandRules })
    )

    expect(schema.Check("ПанельНавигацииВажное")).toBe(false)
    expect(schema.Check({ Группа: "ПанельНавигацииВажное" })).toBe(true)
  })
})
```

- [ ] **Step 2: Run red command test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataCommand/fromYAML.test.ts
```

Expected: if scalar command schema is still accepted through `useAsShortValueYAML`, the test fails.

- [ ] **Step 3: Make command YAML type object-only**

In `types.ts`, change:

```ts
export type MetadataCommandYAML = MetadataCommandFullYAML | MetadataCommandGroupYAML
```

to:

```ts
export type MetadataCommandYAML = MetadataCommandFullYAML
```

Keep `MetadataCommandGroupYAML` because `Группа?: MetadataCommandGroupYAML` still uses it as a field value.

- [ ] **Step 4: Remove command short rule**

In `rules.ts`, remove `useAsShortValueYAML: true` from the `group` property.

- [ ] **Step 5: Update command fixtures**

In `__fixtures__/data.ts`, replace scalar command YAML like:

```ts
Команда1: "ПанельНавигацииВажное"
```

with:

```ts
Команда1: {
  Группа: "ПанельНавигацииВажное",
}
```

Do the same for sync YAML fixtures under `packages/core/metadata/appliedObjects/**/__fixtures__/sync/yaml/**/Свойства.yaml` and form YAML fixtures if tests fail with command scalar expectations.

- [ ] **Step 6: Run command and applied-object tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataCommand metadata/appliedObjects/__tests__/yamlRoundTrip.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit Task 5**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataCommand \
  packages/core/metadata/appliedObjects
git commit -m "feat!: :sparkles: сделать команды объектным YAML" -m "BREAKING CHANGE: Команды больше не принимают сокращение Команда: Группа. Используйте Команда: { Группа: ... }."
```

## Task 6: Remove Remaining Short YAML Flags

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommonAttribute/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSessionParameter/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataFilterCriterion/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDefinedType/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataConstant/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/rules.ts`
- Modify focused fixture/test files reported by the test commands in this task.

- [ ] **Step 1: Run the audit command**

Run:

```bash
rg "useAsShortValueYAML|\\| TypeDescriptionYAML|\\| MetadataCommandGroupYAML" packages/core/metadata -n
```

Expected after Tasks 1-5: matches only in these files:

```text
packages/core/metadata/appliedObjects/metadataCommonAttribute/rules.ts
packages/core/metadata/appliedObjects/metadataSessionParameter/rules.ts
packages/core/metadata/appliedObjects/metadataFilterCriterion/rules.ts
packages/core/metadata/appliedObjects/metadataDefinedType/rules.ts
packages/core/metadata/appliedObjects/metadataConstant/rules.ts
packages/core/metadata/forms/commonObjects/formParameter/rules.ts
```

- [ ] **Step 2: Remove remaining `useAsShortValueYAML` flags**

Remove the single `useAsShortValueYAML: true` line from each file:

```text
packages/core/metadata/appliedObjects/metadataConstant/rules.ts
packages/core/metadata/appliedObjects/metadataCommonAttribute/rules.ts
packages/core/metadata/appliedObjects/metadataFilterCriterion/rules.ts
packages/core/metadata/appliedObjects/metadataSessionParameter/rules.ts
packages/core/metadata/forms/commonObjects/formParameter/rules.ts
packages/core/metadata/appliedObjects/metadataDefinedType/rules.ts
```

- [ ] **Step 3: Update focused tests exposed by the audit**

Run focused tests for each touched item. Examples:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataConstant/fromYAML.test.ts metadata/appliedObjects/metadataConstant/toYAML.test.ts
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/appliedObjects/metadataSessionParameter/fromYAML.test.ts metadata/appliedObjects/metadataSessionParameter/toYAML.test.ts
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/commonObjects/formParameter/toYAML.test.ts metadata/forms/commonObjects/formParameter/fromYAML.test.ts
```

Expected: update scalar fixtures to object form until these pass.

- [ ] **Step 4: Confirm the scalar-short audit is empty**

Run:

```bash
rg "useAsShortValueYAML|export type .*YAML = .*\\| TypeDescriptionYAML|export type MetadataCommandYAML = .*\\|" packages/core/metadata -n
```

Expected: no matches. If a match remains, stop and either remove it or document why it is not item-level scalar shorthand before continuing.

- [ ] **Step 5: Commit Task 6**

Run:

```bash
git add packages/core/metadata
git commit -m "feat!: :sparkles: удалить оставшиеся сокращения YAML" -m "BREAKING CHANGE: Все metadataItem YAML-значения должны быть объектами. Скалярные сокращения больше не поддерживаются."
```

## Task 7: Update Generated YAML Fixtures

**Files:**
- Modify only YAML/TS fixtures that fail because expected YAML still uses scalar shorthand.
- Do not modify XML fixtures.

- [ ] **Step 1: Run broad core tests to find stale fixtures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle
```

Expected before fixture updates: failures in YAML snapshot/fixture tests that still expect scalar shorthand.

- [ ] **Step 2: Update YAML fixtures by changing scalars to object form**

For each failing YAML fixture, replace:

```yaml
Реквизиты:
  Организация: Справочник.Организации
```

with:

```yaml
Реквизиты:
  Организация:
    Тип: Справочник.Организации
```

Replace command scalars:

```yaml
Команды:
  Открыть: ПанельНавигацииВажное
```

with:

```yaml
Команды:
  Открыть:
    Группа: ПанельНавигацииВажное
```

For constants/session parameters/defined types/form parameters, use the field name from that item rule:

```yaml
Тип: Строка
```

inside the object rather than the scalar item value.

- [ ] **Step 3: Re-run core tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle
```

Expected: core passes.

- [ ] **Step 4: Commit Task 7**

Run:

```bash
git add packages/core/metadata
git commit -m "test: :white_check_mark: обновить YAML-фикстуры без сокращений"
```

## Task 8: Regenerate `/home/nikita/git/temp-yaml` From ERP XML

**Files:**
- External generated YAML project: `/home/nikita/git/temp-yaml`
- Source XML project: `/home/nikita/git/round-trip/erp`
- No repository files should be staged unless the import command reveals a code issue that needs a separate fix.

- [ ] **Step 1: Rebuild the real YAML project**

Run:

```bash
pnpm --filter @nakidka/cli dev import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: command exits `0`. It rewrites `/home/nikita/git/temp-yaml` from the XML source.

- [ ] **Step 2: Confirm generated YAML uses object form**

Run:

```bash
rg "^[[:space:]]+[А-Яа-яA-Za-z_][^:]*: (Строка|Булево|Дата|Число|Справочник|Документ|Перечисление|Регистр)" /home/nikita/git/temp-yaml -g "*.yaml" | head -n 50
```

Expected: no matches that are actual metadata item shorthand. If matches are legitimate scalar fields, inspect before changing code.

- [ ] **Step 3: Validate regenerated project**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validate-after-no-short-yaml.out
```

Expected: command may exit `1` if real diagnostics remain.

Then summarize:

```bash
tail -n 5 /tmp/nkdk-validate-after-no-short-yaml.out
perl -ne 'if(/^(.*?):\d+:\d+ (error|warning): (.*)$/){$f=$1; $sev=$2; $msg=$3; $kind=($f=~m#/Формы/[^/]+/Форма\.yaml$#)?"forms":"properties"; $c{"$kind\t$sev\t$msg"}++} END{for $k (sort {$c{$b}<=>$c{$a}} keys %c){print "$c{$k}\t$k\n"}}' /tmp/nkdk-validate-after-no-short-yaml.out | head -n 40
```

Expected: massive `Expected object` counts caused by `Реквизит: Тип` and `Команда: Группа` should be gone or sharply reduced to unrelated cases.

- [ ] **Step 4: Commit code-only completion if needed**

If Task 8 exposed code fixes, commit them separately:

```bash
git add packages/core packages/cli
git commit -m "fix: :bug: исправить экспорт полного YAML для ERP"
```

Do not commit `/home/nikita/git/temp-yaml` from this repository unless the user explicitly asks; it is outside this repo.

## Task 9: Full Verification

**Files:**
- No planned code edits.

- [ ] **Step 1: Ensure no short YAML mechanism remains**

Run:

```bash
rg "useAsShortValueYAML" packages/core/metadata
```

Expected: no matches.

Run:

```bash
rg "export type .*YAML = .*\\| TypeDescriptionYAML|export type MetadataCommandYAML = .*\\|" packages/core/metadata -n
```

Expected: no matches for item-level scalar shorthand. If matches remain, inspect and document why they are field-level values rather than item shorthand.

- [ ] **Step 2: Run all tests**

Run:

```bash
pnpm test
```

Expected: all workspace tests pass.

- [ ] **Step 3: Run final validation summary**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validate-final.out
tail -n 5 /tmp/nkdk-validate-final.out
```

Expected: command may exit `1` if non-shorthand diagnostics remain. Report exact `summary: ...` line and top remaining groups.

- [ ] **Step 4: Final commit if uncommitted changes remain**

Run:

```bash
git status --short
```

Expected: only intentional files changed. Commit remaining implementation changes:

```bash
git add packages/core packages/cli docs/superpowers/plans/2026-06-11-remove-short-yaml.md
git commit -m "feat!: :sparkles: отказаться от сокращенного YAML" -m "BREAKING CHANGE: YAML больше не поддерживает скалярные сокращения metadataItem. Используйте полный объектный формат с явными полями."
```

If the plan file was committed separately before implementation, omit it from this final `git add`.
