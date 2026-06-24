# Round Trip YAML First Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the first four accepted YAML round-trip discrepancies without changing XML fixtures or the agreed YAML contract.

**Architecture:** Each discrepancy is handled inside the existing focused converter module that currently loses the value. The implementation keeps YAML compact where already agreed, preserves unknown XML values as raw strings where needed, and keeps backward-compatible YAML reads for older generated files.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration helpers, `round-trip-yaml` diagnostic skill.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`: treat expanded `SettingsParameterValue` objects as values only when `Значение` is explicitly present.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`: add the regression test for `{ Использовать: "Ложь" }` without `Значение`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`: ensure quoted YAML strings are classified as `xs:string` before any design-time detection.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`: add the `.PDF` regression test.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`: export unknown `commandGroup` values as raw XML identifiers.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`: import unknown `ГруппаКоманд` values as raw XML identifiers.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts`: add the raw `CommandGroup.Печать` export regression test.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts`: add the raw `CommandGroup.Печать` import regression test.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`: widen `commandGroup`, XML `CommandGroup`, YAML `ГруппаКоманд`, and the JSON schema to allow raw XML identifiers.
- Modify `packages/core/metadata/commonObjects/font/types.ts`: add support for raw non-prefixed font refs and YAML field `Значение`.
- Modify `packages/core/metadata/commonObjects/font/toYAML.ts`: export raw refs as `Вид` with the Russian `FontType` value plus `Значение`.
- Modify `packages/core/metadata/commonObjects/font/fromYAML.ts`: import `Вид: ЭлементСтиля` plus `Значение: "0"` and keep `ВидXML` compatibility.
- Modify `packages/core/metadata/commonObjects/font/toYAML.test.ts`: add the raw ref export regression test.
- Modify `packages/core/metadata/commonObjects/font/fromYAML.test.ts`: add the raw ref import regression test.

## Required Reading

- [ ] **Step 1: Read metadata instructions**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Expected: the command prints the metadata knowledge index. Follow any documents it lists for YAML round-trip and sources of truth before editing `packages/core/metadata/**`.

- [ ] **Step 2: Regenerate Langium files in this fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code `0`.

### Task 1: SettingsParameterValue nil from reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`

- [ ] **Step 1: Write the failing test**

Add this test inside `describe("importParameterValueFromYAML (через importPropertyFromYAML)", () => { ... })` in `fromYAML.test.ts`:

```ts
it("imports expanded use-only SettingsParameterValue without treating it as value", () => {
  const result = testImportPropertyFromYAML({
    rule: { type: "SettingsParameterValue", valueType: "DesignTimeValue", yaml: "Текст" } as PropertyRule,
    value: {
      Использовать: "Ложь",
    },
  })

  expect(result).toEqual({
    parameter: "Текст",
    use: false,
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts
```

Expected before implementation: FAIL because the result contains `value: { items: { ru: "Ложь" } }` or another imported value derived from the whole YAML object.

- [ ] **Step 3: Implement minimal raw value detection**

In `fromYAML.ts`, replace:

```ts
const rawValue = y?.["Значение"] ?? yamlToParse
```

with:

```ts
const hasExplicitValue = y !== undefined && "Значение" in y
const rawValue = hasExplicitValue ? y["Значение"] : isExpandedSpvShape ? undefined : yamlToParse
```

Keep the surrounding `rawList`, `valueParts`, and `value` code unchanged.

- [ ] **Step 4: Run the focused tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

Expected: PASS. The existing `toXML.test.ts` case `restores nil value from reference when current value is absent` must remain green.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts
git commit -m "fix: :bug: исправить YAML nil DCS параметра"
```

Expected: commit succeeds.

### Task 2: DCS typed value quoted string

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`

- [ ] **Step 1: Write the `.PDF` regression test**

Add this test inside `describe("import DcsMetadataTypedValue from YAML", () => { ... })`:

```ts
it("imports quoted .PDF as string before design-time detection", () => {
  expect(
    testImportPropertyFromYAML({
      rule,
      value: "'.PDF'",
    })
  ).toEqual({ type: "string", value: ".PDF" })
})
```

- [ ] **Step 2: Run the test**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts
```

Expected: if the bug is still present, FAIL with `{ type: "DesignTimeValue", value: "'.PDF'" }`. If it already passes, still keep the regression test and continue to Step 4.

- [ ] **Step 3: Put quoted string detection before design-time detection**

In `detectTypeFromYAML`, ensure this check appears before `DcsMetadataTypedValueRegistry.DesignTimeValue.detect(...)`:

```ts
if (typeof value === "string" && value.startsWith("'") && value.endsWith("'")) return "string"
```

The relevant block should end in this order:

```ts
if (sourceValue?.type === "ref" && DcsMetadataTypedValueRegistry.ref.detect({ context, yaml: value })) return "ref"
if (DcsMetadataTypedValueRegistry.dateTime.detect({ context, yaml: value })) return "dateTime"
if (typeof value === "string" && value.startsWith("'") && value.endsWith("'")) return "string"
if (DcsMetadataTypedValueRegistry.DesignTimeValue.detect({ context, yaml: value })) return "DesignTimeValue"
if (DcsMetadataTypedValueRegistry.string.detect({ context, yaml: value })) return "string"
```

Do not change `DesignTimeValue.detect`.

- [ ] **Step 4: Run focused typed value tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts
```

Expected: PASS. Existing tests `imports YAML metadata reference as ref when source value was ref` and `keeps YAML metadata reference as DesignTimeValue without ref source` must remain green.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts
git commit -m "fix: :bug: сохранить quoted string в DCS typed value"
```

Expected: commit succeeds.

### Task 3: Raw CommandGroup in CommandInterface

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`

- [ ] **Step 1: Write the raw command group export test**

Add this test inside `describe("exportCommandInterfaceToYAML", () => { ... })`:

```ts
it("exports unknown command group as raw XML identifier", () => {
  const result = exportCommandInterfaceToYAML(mockContext, mockRule, {
    itemType: "CommandInterface",
    NavigationPanel: [],
    CommandBar: [
      {
        itemType: "CommandInterfaceItem",
        command: "0",
        type: "Auto",
        commandGroup: "CommandGroup.Печать" as never,
      },
    ],
  })

  expect(result).toEqual({
    КоманднаяПанель: [
      {
        Команда: "0",
        Тип: "Auto",
        ГруппаКоманд: "CommandGroup.Печать",
      },
    ],
  })
})
```

- [ ] **Step 2: Write the raw command group import test**

Add this test inside `describe("importCommandInterfaceFromYAML", () => { ... })`:

```ts
it("imports unknown command group as raw XML identifier", () => {
  const result = importCommandInterfaceFromYAML(mockContext, mockRule, {
    КоманднаяПанель: [
      {
        Команда: "0",
        Тип: "Auto",
        ГруппаКоманд: "CommandGroup.Печать" as never,
      },
    ],
  })

  expect(result).toEqual({
    itemType: "CommandInterface",
    NavigationPanel: [],
    CommandBar: [
      {
        itemType: "CommandInterfaceItem",
        command: "0",
        type: "Auto",
        commandGroup: "CommandGroup.Печать",
      },
    ],
  })
})
```

- [ ] **Step 3: Run the tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts
```

Expected before implementation: FAIL because export returns `ГруппаКоманд: undefined` or import omits `commandGroup`.

- [ ] **Step 4: Implement raw fallback in `toYAML.ts`**

Replace:

```ts
if (item.commandGroup) {
  result.ГруппаКоманд = StandardCommandsGroupToYAML[item.commandGroup]
}
```

with:

```ts
if (item.commandGroup) {
  result.ГруппаКоманд = StandardCommandsGroupToYAML[item.commandGroup] ?? item.commandGroup
}
```

- [ ] **Step 5: Implement raw fallback in `fromYAML.ts`**

Replace:

```ts
if (item.ГруппаКоманд) {
  result.commandGroup = StandardCommandsGroupFromYAML[item.ГруппаКоманд]
}
```

with:

```ts
if (item.ГруппаКоманд) {
  result.commandGroup = StandardCommandsGroupFromYAML[item.ГруппаКоманд] ?? item.ГруппаКоманд
}
```

- [ ] **Step 6: Widen command group types**

In `types.ts`, add a named alias near the imports:

```ts
type RawCommandGroup = string
```

Then update the model and XML fields:

```ts
commandGroup?: SE.StandardCommandsGroup | RawCommandGroup
```

```ts
CommandGroup?: SE.StandardCommandsGroup | RawCommandGroup
```

Update the YAML schema field:

```ts
ГруппаКоманд: Type.Optional(Type.String()),
```

Do not change XML output code; `toXML.ts` should continue writing the model value as-is.

- [ ] **Step 7: Run focused command interface tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/types.ts
git commit -m "fix: :bug: сохранить неизвестные CommandGroup"
```

Expected: commit succeeds. If `types.ts` was unchanged, `git add` will harmlessly ignore it.

### Task 4: Font raw ref YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/font/types.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.ts`

- [ ] **Step 1: Write raw ref export test**

Add this test inside `describe("exportFontToYAML", () => { ... })`:

```ts
it("exports raw non-prefixed ref with Russian font kind", () => {
  const result = exportFontToYAML(mockContext, mockRule, {
    ref: "0" as never,
    kind: "StyleItem",
    height: 10,
  })

  expect(result).toEqual({
    Вид: "ЭлементСтиля",
    Значение: "0",
    Размер: 10,
  })
})
```

- [ ] **Step 2: Write raw ref import test**

Add this test inside `describe("importFontFromYAML", () => { ... })`:

```ts
it("imports raw non-prefixed ref with Russian font kind", () => {
  const result = importFontFromYAML(mockContext, mockRule, {
    Вид: "ЭлементСтиля",
    Значение: "0",
    Размер: 10,
  } as never)

  expect(result).toEqual({
    ref: "0",
    kind: "StyleItem",
    height: 10,
  })
})
```

- [ ] **Step 3: Run the tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/font/toYAML.test.ts packages/core/metadata/commonObjects/font/fromYAML.test.ts
```

Expected before implementation: FAIL because export writes `ВидXML: "StyleItem"` without `Значение`, and import does not restore `ref: "0"`.

- [ ] **Step 4: Update font types**

In `types.ts`, change the ref and YAML declarations to include raw non-prefixed refs and Russian font type values:

```ts
export type RawFontRef = RawPrefixedFontRef | string
export type FontRef = SE.StyleFonts | SE.WindowsFonts | RawFontRef
```

Update `FontFullYAML`:

```ts
export interface FontFullYAML {
  Вид?: SE.StyleFontsYAML | SE.WindowsFontsYAML | SE.FontTypeYAML | RawPrefixedFontRef
  ВидXML?: SE.FontType
  Значение?: string
  Имя?: string
  Масштаб?: number
  Размер?: number
  Наклонный?: StringboolYAML
  Подчеркивание?: StringboolYAML
  Полужирный?: StringboolYAML
  Зачеркивание?: StringboolYAML
}
```

Update `FontJSONSchema`:

```ts
Значение: Type.Optional(Type.String()),
```

- [ ] **Step 5: Export raw ref with Russian `Вид` and `Значение`**

In `toYAML.ts`, keep the existing import shape and update only the export logic:

```ts
import { Font, FontFullYAML, FontRef, FontYAML, RawPrefixedFontRef, isRawPrefixedFontRef } from "./types"
```

Replace the `if (ref !== undefined) ... else ...` block with:

```ts
if (ref !== undefined) {
  result.Вид = ref
} else if (font.ref !== undefined) {
  result.Вид = SE.FontTypeToYAML[font.kind]
  result.Значение = font.ref
} else {
  result.ВидXML = font.kind
}
```

Update `convertRefToYAML` return type:

```ts
): SE.StyleFontsYAML | SE.WindowsFontsYAML | RawPrefixedFontRef | undefined => {
```

The raw non-prefixed ref is intentionally not returned from `convertRefToYAML`; it is handled by the new `else if (font.ref !== undefined)` branch.

- [ ] **Step 6: Import `Вид` plus `Значение`**

In `fromYAML.ts`, before the existing `if (fullData.Вид !== undefined)` block, add:

```ts
if (fullData.Вид !== undefined && fullData.Значение !== undefined) {
  const kind = SE.FontTypeFromYAML[fullData.Вид as SE.FontTypeYAML]
  if (kind !== undefined) {
    result.kind = kind
    result.ref = fullData.Значение
  }
}
```

Then change the existing `if (fullData.Вид !== undefined)` to:

```ts
if (result.kind === undefined && fullData.Вид !== undefined) {
```

Keep the fallback:

```ts
if (result.kind === undefined) {
  result.kind = fullData.ВидXML ?? "Absolute"
}
```

This preserves old YAML with `ВидXML`.

- [ ] **Step 7: Run focused font tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/font/fromXML.test.ts packages/core/metadata/commonObjects/font/toXML.test.ts packages/core/metadata/commonObjects/font/toYAML.test.ts packages/core/metadata/commonObjects/font/fromYAML.test.ts
```

Expected: PASS. Existing known style and Windows font fixtures must still export through compact `Вид`.

- [ ] **Step 8: Commit Task 4**

Run:

```bash
git add packages/core/metadata/commonObjects/font/types.ts packages/core/metadata/commonObjects/font/toYAML.ts packages/core/metadata/commonObjects/font/fromYAML.ts packages/core/metadata/commonObjects/font/toYAML.test.ts packages/core/metadata/commonObjects/font/fromYAML.test.ts
git commit -m "fix: :bug: сохранить raw ref шрифта в YAML"
```

Expected: commit succeeds.

### Task 5: Round-trip verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run the focused metadata test set**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts packages/core/metadata/commonObjects/font/fromXML.test.ts packages/core/metadata/commonObjects/font/toXML.test.ts packages/core/metadata/commonObjects/font/toYAML.test.ts packages/core/metadata/commonObjects/font/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type-check for touched package**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 3: Re-run YAML round-trip triage**

Run from the worktree root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: the first four accepted discrepancies no longer appear in the first batch. If the total diff count remains non-zero, keep the next unrelated diff for the next analysis cycle.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 5: Confirm no temporary files are staged**

Run:

```bash
git status --short
```

Expected: no uncommitted source changes. If round-trip output or temporary files appear, leave them untracked and do not commit them.

## Self-Review

- Spec coverage: Task 1 covers `xsi:nil` restoration through reference XML; Task 2 covers quoted `.PDF` as `xs:string`; Task 3 covers raw `CommandGroup.Печать`; Task 4 covers raw font `ref="0"` with Russian YAML fields.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: all code snippets use existing converter names and existing test helpers from the current files. The only new public YAML field is `Значение` for `FontFullYAML`, matching the accepted design.
