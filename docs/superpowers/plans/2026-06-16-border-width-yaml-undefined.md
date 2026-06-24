# Border Width YAML Undefined Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop generated `Border` YAML from emitting empty `Ширина:` when border width is absent.

**Architecture:** Keep the fix inside the shared `Border` type rule. XML import/export already treats absent width as absent; YAML export should mirror that behavior by adding keys only when values exist. JSON Schema and `fromYAML` remain strict so hand-written empty numeric values still fail validation.

**Tech Stack:** TypeScript, Vitest, existing metadata type-rule registry, CLI validation via `packages/cli`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/border/__fixtures__/data.ts`
  - Add a reusable style-only border fixture with XML, YAML, internal model, and enterprise preview expectations.
- Modify: `packages/core/metadata/commonObjects/border/fromXML.test.ts`
  - Use the style-only fixture for XML ref import.
- Modify: `packages/core/metadata/commonObjects/border/toXML.test.ts`
  - Use the style-only fixture for XML ref export and round-trip.
- Modify: `packages/core/metadata/commonObjects/border/fromYAML.test.ts`
  - Add YAML import test for `{ Имя: "ЭлементСтиля.TestBorder" }`.
- Modify: `packages/core/metadata/commonObjects/border/toYAML.test.ts`
  - Add failing test that style-only border exports without `Ширина`.
- Modify: `packages/core/metadata/commonObjects/border/toYAML.ts`
  - Build `BorderYAML` incrementally and omit undefined keys.

## Task 1: Add style-only Border fixture and failing YAML export test

**Files:**
- Modify: `packages/core/metadata/commonObjects/border/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/border/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/border/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/border/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/border/toYAML.test.ts`

- [ ] **Step 1: Extend the Border fixture shape**

In `packages/core/metadata/commonObjects/border/__fixtures__/data.ts`, replace the imports and `BorderTestCase` interface with:

```ts
import { Border, BorderEnterprise, BorderYAML } from "~/metadata/commonObjects/border/types"

export interface BorderTestCase {
  name: string
  border: Border
  preview: BorderEnterprise
  xml?: string
  yaml?: BorderYAML
}
```

- [ ] **Step 2: Add the style-only fixture**

In `borderTestCases`, insert this case after `empty border`:

```ts
  {
    name: "border by style ref",
    border: { ref: "TestBorder" },
    preview: { Type: "Border" },
    xml: `<Border ref="style:TestBorder"/>`,
    yaml: { Имя: "ЭлементСтиля.TestBorder" },
  },
```

- [ ] **Step 3: Update fromXML ref test to use the fixture**

In `packages/core/metadata/commonObjects/border/fromXML.test.ts`, add the fixture import:

```ts
import { borderTestCases } from "~/metadata/commonObjects/border/__fixtures__/data"
```

Then replace the `should import Border by ref` test with:

```ts
  it("should import Border by ref", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.xml).toBeDefined()

    const xml = importContentFromXML<{ Border: BorderXML }>(fixture!.xml!)
    const result = importBorderFromXML(mockContextFromXML(), mockRule, xml.Border)

    expect(result).toEqual(fixture!.border)
  })
```

- [ ] **Step 4: Update toXML ref and round-trip tests to use the fixture**

In `packages/core/metadata/commonObjects/border/toXML.test.ts`, add the fixture import:

```ts
import { borderTestCases } from "~/metadata/commonObjects/border/__fixtures__/data"
```

Then replace `should export border by ref` with:

```ts
  it("should export border by ref", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.xml).toBeDefined()

    const result = { Border: exportBorderToXML(mockContext, mockRule, fixture!.border) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(fixture!.xml)
  })
```

Replace `should export and import border by ref correctly (round-trip)` with:

```ts
  it("should export and import border by ref correctly (round-trip)", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.xml).toBeDefined()

    const xml = importContentFromXML<{ Border: BorderXML }>(fixture!.xml!)
    const imported = importBorderFromXML(mockContextFromXML(), mockRule, xml.Border)
    const exported = exportBorderToXML(mockContext, mockRule, imported)
    const resultXml = xmlExport({ Border: exported }, false)

    expect(resultXml).toEqual(fixture!.xml)
  })
```

- [ ] **Step 5: Add YAML import test for style-only border**

In `packages/core/metadata/commonObjects/border/fromYAML.test.ts`, add the fixture import:

```ts
import { borderTestCases } from "~/metadata/commonObjects/border/__fixtures__/data"
```

Then add this test after `should return undefined when data is undefined`:

```ts
  it("imports project style item refs without width", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.yaml).toBeDefined()

    const result = importBorderFromYAML(mockContext, mockRule, fixture!.yaml)

    expect(result).toEqual(fixture!.border)
  })
```

- [ ] **Step 6: Add failing YAML export test for style-only border**

In `packages/core/metadata/commonObjects/border/toYAML.test.ts`, add the fixture import:

```ts
import { borderTestCases } from "~/metadata/commonObjects/border/__fixtures__/data"
```

Then add this test after `should return undefined when data is undefined`:

```ts
  it("should export border by style ref without empty width", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.yaml).toBeDefined()

    const result = exportBorderToYAML(mockContext, mockRule, fixture!.border)

    expect(result).toEqual(fixture!.yaml)
    expect(result).not.toHaveProperty("Ширина")
  })
```

- [ ] **Step 7: Run focused Border tests and verify the new test fails**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/commonObjects/border/fromXML.test.ts metadata/commonObjects/border/toXML.test.ts metadata/commonObjects/border/fromYAML.test.ts metadata/commonObjects/border/toYAML.test.ts
```

Expected: FAIL only in `should export border by style ref without empty width` because received YAML still contains `Ширина: undefined`.

## Task 2: Omit undefined Border YAML keys

**Files:**
- Modify: `packages/core/metadata/commonObjects/border/toYAML.ts`
- Verify: `packages/core/metadata/commonObjects/border/*.test.ts`

- [ ] **Step 1: Replace Border YAML export with incremental object construction**

In `packages/core/metadata/commonObjects/border/toYAML.ts`, replace `exportBorderToYAML` with:

```ts
export const exportBorderToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Border | undefined
): BorderYAML | undefined => {
  if (!data) return undefined

  const result: BorderYAML = {}

  if (data.ref !== undefined) {
    result.Имя = exportStyleItemRefToYAML(data.ref)
  }

  if (data.width !== undefined) {
    result.Ширина = data.width
  }

  const borderType = exportSystemEnumerationToYAMLDeprecated<SE.ControlBorderTypeYAML>(
    context,
    { type: "SystemEnumeration", typeSE: "ControlBorderType" },
    data.controlBorderType
  )
  if (borderType !== undefined) {
    result.ТипРамки = borderType
  }

  return result
}
```

- [ ] **Step 2: Run focused Border tests and verify they pass**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/commonObjects/border/fromXML.test.ts metadata/commonObjects/border/toXML.test.ts metadata/commonObjects/border/fromYAML.test.ts metadata/commonObjects/border/toYAML.test.ts metadata/commonObjects/border/toEnterprise.test.ts
```

Expected: PASS for all listed Border tests.

- [ ] **Step 3: Run the broader commonObjects tests that cover type registration**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/core exec vitest run metadata/commonObjects/border
```

Expected: PASS.

- [ ] **Step 4: Commit the focused Border fix**

```bash
git add packages/core/metadata/commonObjects/border/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/border/fromXML.test.ts \
  packages/core/metadata/commonObjects/border/toXML.test.ts \
  packages/core/metadata/commonObjects/border/fromYAML.test.ts \
  packages/core/metadata/commonObjects/border/toYAML.test.ts \
  packages/core/metadata/commonObjects/border/toYAML.ts
git commit -m "fix: :bug: не выводить пустую ширину рамки в YAML"
```

## Task 3: Verify ERP regression and full suite

**Files:**
- No code changes expected.

- [ ] **Step 1: Re-import ERP XML to YAML**

Run:

```bash
rm -rf /home/nikita/git/temp-yaml/*
pnpm -s --dir /home/nikita/git/nkdk/packages/cli exec tsx src/cli.ts import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: import completes successfully. If `rm` or `tsx` is blocked by the sandbox, rerun the same command with required approval instead of changing the command shape.

- [ ] **Step 2: Validate the formerly failing ERP form**

Run:

```bash
pnpm -s --dir /home/nikita/git/nkdk/packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml --file 'Обработка/ПанельАдминистрированияУХ/Формы/Казначейство/Форма.yaml'
```

Expected: output does not contain `Expected number` for lines 127, 160, 194, 204, 249, 275, or 284.

- [ ] **Step 3: Confirm generated YAML no longer contains empty Border width**

Run:

```bash
rg -n "Ширина:\\s*$" /home/nikita/git/temp-yaml/Обработка/ПанельАдминистрированияУХ/Формы/Казначейство/Форма.yaml
```

Expected: no matches for empty `Ширина:` in that form.

- [ ] **Step 4: Run the full repository test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 5: Commit verification notes only if files changed**

If Task 3 produced no repository file changes, do not create an empty commit. Record the exact verification commands and outcomes in the final response.
