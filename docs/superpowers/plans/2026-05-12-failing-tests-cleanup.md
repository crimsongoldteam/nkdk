# Failing Tests Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Последовательно устранить падения `pnpm test` и `pnpm --filter @nakidka/core type-check`.

**Architecture:** Исправления делаются маленькими независимыми шагами: сначала контракт `MetadataItemLink`, затем типы правил, затем несогласованные фикстуры. XML-фикстуры не изменяются; формат выгрузки настраивается через `rules.ts`.

**Tech Stack:** TypeScript, Vitest, pnpm, существующий слой `metadata/orchestration`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataRef/types.ts` — разрешить строковый и типизированный XML для одиночной ссылки.
- Modify: `packages/core/metadata/commonObjects/metadataRef/fromXML.ts` — читать оба XML-формата.
- Modify: `packages/core/metadata/commonObjects/metadataRef/toXML.ts` — выбирать строковый или типизированный XML по `rule.typedXML`.
- Create: `packages/core/metadata/commonObjects/metadataRef/fromXML.test.ts` — покрыть чтение строки и объекта.
- Create: `packages/core/metadata/commonObjects/metadataRef/toXML.test.ts` — покрыть экспорт по rule.
- Modify: `packages/core/metadata/forms/elements/button/rules.ts` — указать `typedXML: "xr:MDObjectRef"` для `parameter`.
- Modify: `packages/core/metadata/orchestration/property/types.ts` — легализовать общий флаг `typedXML?: string | true`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts` — добавить недостающие поля полной формы.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts` — согласовать singleton-части с публичными типами.
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts` — согласовать YAML-ключи с публичными типами.
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts` — убрать `name` из публичного `ExtendedTooltip`, если это reference-only поле.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts` — согласовать литерал с типом.

---

### Task 1: MetadataItemLink XML Contract

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRef/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRef/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRef/toXML.ts`
- Create: `packages/core/metadata/commonObjects/metadataRef/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/metadataRef/toXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/button/rules.ts`

- [ ] **Step 1: Write failing import tests**

Create `packages/core/metadata/commonObjects/metadataRef/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { importMetadataItemLinkFromXML } from "./fromXML"

describe("importMetadataItemLinkFromXML", () => {
  it("imports plain XML text", () => {
    const result = importMetadataItemLinkFromXML(mockContextFromXML(), undefined, "SettingsStorage.ХранилищеНастроек")

    expect(result).toBe("SettingsStorage.ХранилищеНастроек")
  })

  it("imports typed XML text", () => {
    const result = importMetadataItemLinkFromXML(mockContextFromXML(), undefined, {
      "#text": "CommonCommand.ПоказатьВСписке",
      "_xsi:type": "xr:MDObjectRef",
    })

    expect(result).toBe("CommonCommand.ПоказатьВСписке")
  })
})
```

- [ ] **Step 2: Write failing export tests**

Create `packages/core/metadata/commonObjects/metadataRef/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { exportMetadataItemLinkToXML } from "./toXML"

describe("exportMetadataItemLinkToXML", () => {
  it("exports plain XML text by default", () => {
    const result = exportMetadataItemLinkToXML(mockContextToXML(), undefined, "SettingsStorage.ХранилищеНастроек")

    expect(result).toBe("SettingsStorage.ХранилищеНастроек")
  })

  it("exports typed XML text when rule requests typed XML", () => {
    const rule = { type: "MetadataItemLink", typedXML: "xr:MDObjectRef" } as PropertyRule

    const result = exportMetadataItemLinkToXML(mockContextToXML(), rule, "CommonCommand.ПоказатьВСписке")

    expect(result).toEqual({
      "#text": "CommonCommand.ПоказатьВСписке",
      "_xsi:type": "xr:MDObjectRef",
    })
  })
})
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRef/fromXML.test.ts metadata/commonObjects/metadataRef/toXML.test.ts
```

Expected: failures for plain XML import/export support.

- [ ] **Step 4: Implement XML union type**

In `packages/core/metadata/commonObjects/metadataRef/types.ts`, replace `MetadataItemLinkXML` with:

```ts
export type MetadataItemLinkXML =
  | string
  | {
      "_xsi:type"?: "xr:MDObjectRef"
      "#text": string
    }
```

- [ ] **Step 5: Implement XML import**

In `packages/core/metadata/commonObjects/metadataRef/fromXML.ts`, update `importMetadataItemLinkFromXML`:

```ts
export function importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (!data) return undefined

  if (typeof data === "string") return data

  return data["#text"]
}
```

- [ ] **Step 6: Implement rule-controlled XML export**

In `packages/core/metadata/commonObjects/metadataRef/toXML.ts`, update `exportMetadataItemLinkToXML`:

```ts
export function exportMetadataItemLinkToXML(
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkXML | undefined {
  if (!data) return undefined

  if (typeof rule?.typedXML === "string") {
    return {
      "#text": data,
      "_xsi:type": rule.typedXML as "xr:MDObjectRef",
    }
  }

  return data
}
```

Update `exportMetadataItemLinksToXML` to keep collection items typed:

```ts
const itemRule = { type: "MetadataItemLink", typedXML: "xr:MDObjectRef" } as PropertyRule

return {
  "xr:Item": data.map((value) => exportMetadataItemLinkToXML(context, itemRule, value)!),
}
```

- [ ] **Step 7: Mark button parameter as typed**

In `packages/core/metadata/forms/elements/button/rules.ts`, update `parameter`:

```ts
parameter: {
  yaml: "Параметр",
  xml: "Parameter",
  type: "MetadataItemLink",
  typedXML: "xr:MDObjectRef",
  toEnterprise: false,
},
```

- [ ] **Step 8: Run targeted tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRef metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/elements/button
```

Expected: targeted tests pass.

- [ ] **Step 9: Commit Task 1**

```bash
git add packages/core/metadata/commonObjects/metadataRef packages/core/metadata/forms/elements/button/rules.ts
git commit -m "fix: :bug: управлять типом MetadataItemLink через rules"
```

---

### Task 2: typedXML Rule Type

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`

- [ ] **Step 1: Verify current type-check failure**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: `typedXML` is rejected in `metadata/commonObjects/metadataAttribute/rules.ts`.

- [ ] **Step 2: Add typedXML to BasePropertyRule**

In `packages/core/metadata/orchestration/property/types.ts`, add to `BasePropertyRule` near XML options:

```ts
  /**
   * Выгружать XML-значение с `_xsi:type`.
   * `true` используется типами с собственным фиксированным XML-типом, строка задает конкретный XML-тип из rules.ts.
   */
  typedXML?: true | string
```

- [ ] **Step 3: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: the `typedXML` error disappears; remaining errors belong to later tasks.

- [ ] **Step 4: Commit Task 2**

```bash
git add packages/core/metadata/orchestration/property/types.ts
git commit -m "fix: :bug: описать typedXML в правилах свойств"
```

---

### Task 3: ClientApplicationForm Required Fixture Fields

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`

- [ ] **Step 1: Inspect rule defaults**

Read `packages/core/metadata/forms/clientApplicationForm/rules.ts` around `autoTime`, `usePostingMode`, `repostOnWrite` and use their YAML names and default values.

- [ ] **Step 2: Add missing TS model fields**

In `fullClientApplicationForm` inside `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`, add:

```ts
autoTime: "DontUse",
usePostingMode: "Regular",
repostOnWrite: false,
```

- [ ] **Step 3: Add missing YAML fields**

In the full YAML fixture in the same file, add the matching YAML keys from `rules.ts`; use `"Ложь"` for `false` unless the rules define another default.

```ts
АвтоВремя: "НеИспользовать",
РежимПроведения: "Неоперативный",
ПерепроводитьПриЗаписи: "Ложь",
```

- [ ] **Step 4: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: required-field errors in `clientApplicationForm/__fixtures__/data.ts` disappear.

- [ ] **Step 5: Commit Task 3**

```bash
git add packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts
git commit -m "test: :white_check_mark: дополнить fixture формы"
```

---

### Task 4: Singleton Fixture Type Alignment

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`

- [ ] **Step 1: Verify public types**

Read:

```bash
sed -n '1,180p' packages/core/metadata/forms/elements/button/types.ts
sed -n '1,160p' packages/core/metadata/forms/elements/inputField/types.ts
sed -n '1,120p' packages/core/metadata/forms/elements/extendedTooltip/types.ts
```

Expected: confirm whether `contextMenu`, `extendedTooltip`, `ПутьКДанным`, and `name` are public fields or reference-only fields.

- [ ] **Step 2: Remove reference-only fields from public fixture**

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`, remove `contextMenu` and `extendedTooltip` from object literals whose type does not allow them. Keep reference-only singleton behavior covered by dedicated singleton tests.

- [ ] **Step 3: Align YAML fixture keys**

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`, replace or remove `ПутьКДанным` according to the YAML key defined by the element rule. Do not edit XML fixtures.

- [ ] **Step 4: Align fromYAML test**

In `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`, remove `name` from expected public `ExtendedTooltip` objects if `name` is reference-only.

- [ ] **Step 5: Run focused type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: singleton fixture type errors disappear.

- [ ] **Step 6: Run singleton tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/singletonNameReference.test.ts metadata/forms/elements/singletonNonCanonicalNameReference.test.ts metadata/orchestration/formElement/singletonName.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts
```

Expected: tests pass.

- [ ] **Step 7: Commit Task 4**

```bash
git add packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts
git commit -m "test: :white_check_mark: согласовать singleton fixture"
```

---

### Task 5: DynamicList YAML Literal

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`

- [ ] **Step 1: Locate the typed field**

Open `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts` around the error line and identify the field whose type only allows `"Ложь"`.

- [ ] **Step 2: Align the fixture literal**

If the field is a default-disabled flag, change:

```ts
ДинамическоеСчитываниеДанных: "Истина",
```

to:

```ts
ДинамическоеСчитываниеДанных: "Ложь",
```

If inspection shows another exact field, change only that field.

- [ ] **Step 3: Run dynamicList tests and type-check**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList
pnpm --filter @nakidka/core type-check
```

Expected: dynamicList tests pass and `type-check` passes.

- [ ] **Step 4: Commit Task 5**

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts
git commit -m "test: :white_check_mark: согласовать DynamicList YAML"
```

---

### Task 6: Final Verification

**Files:**
- No direct edits.

- [ ] **Step 1: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits successfully.

- [ ] **Step 2: Run full tests**

Run:

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: command exits successfully.

- [ ] **Step 4: Commit verification-only changes if any**

If verification generated tracked file changes, inspect them and commit only relevant generated files. Replace the path with the exact generated files shown by `git status --short`:

```bash
git status --short
git add packages/nkdk-language/src/language/generated
git commit -m "chore: :wrench: обновить сгенерированные файлы"
```

If there are no changes, do not commit.

---

## Self-Review

- Spec coverage: all five identified groups are covered by Tasks 1-5; final project verification is covered by Task 6.
- Placeholder scan: no unfinished markers are present.
- Type consistency: `typedXML` is introduced as a general rule option before relying on it to remove type-check errors.
