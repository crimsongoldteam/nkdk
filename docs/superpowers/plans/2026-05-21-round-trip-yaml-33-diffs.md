# Round-Trip YAML 33 Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the 33 current `round-trip-yaml` XML diffs for `acc` by preserving the XML meaning that is lost through `XML -> model -> YAML -> model -> XML`.

**Architecture:** Keep changes local to existing metadata type rules and orchestration helpers. Prefer focused regression tests around the smallest affected type, then one integration check where the bug only appears through the real metadata path. Use reference metadata only for cases where the source XML explicitly had information omitted from concise YAML.

**Tech Stack:** TypeScript, Vitest, `yaml`, existing `@nakidka/core` metadata orchestration, `round-trip-yaml` skill script.

---

## Source Spec

Read this first:

- `docs/superpowers/specs/2026-05-21-round-trip-yaml-33-diffs-design.md`

Also read these before any code change under `packages/core/metadata/**`:

- `.agents/knowledge/metadata/INDEX.md`
- `.agents/architecture-orchestration.md` if a task touches `packages/core/metadata/orchestration/**`

Do not edit XML files under `/Users/nikita/git/round-trip-source`. They are the source of truth.

## File Map

- `packages/core/yaml/export.ts`: replace broad document `.trim()` with narrow final-newline handling.
- `packages/core/yaml/import.ts`: used by the newline-only YAML regression test.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`: preserve explicit DCS text type YAML and source empty typed values.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`: export source-preserved empty typed DCS values.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`: DCS explicit `Тип: Поле` and empty typed value import tests.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`: DCS typed XML export tests.
- `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`: integration test for `AppearanceFields.Текст`.
- `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`: delegate presentation export to shared `I8nText` YAML contract.
- `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`: verify existing import accepts language maps; adjust only if the failing test shows it does not.
- `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`: single non-default language presentation test.
- `packages/core/metadata/commonObjects/metadataPath/helper.ts`: add positional path conversion helper.
- `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`: use positional conversion for value and field paths.
- `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`: use the same positional conversion on YAML import.
- `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`: user-name path segment regression tests.
- `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`: inverse user-name path segment regression tests.
- `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`: ensure metadata item links do not convert user names.
- `packages/core/metadata/commonObjects/picture/toYAML.ts`: make raw picture refs with extra attributes use expanded YAML.
- `packages/core/metadata/commonObjects/picture/fromYAML.ts`: verify expanded raw refs import as raw refs; adjust if needed.
- `packages/core/metadata/commonObjects/picture/toYAML.test.ts`: raw ref with `LoadTransparent` and transparent pixel tests.
- `packages/core/metadata/orchestration/property/fromYAML.ts`: preserve explicit source values before applying model defaults when YAML omitted the key.
- `packages/core/metadata/orchestration/property/fromYAML.test.ts`: source-preservation regression for omitted YAML and default values.
- `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`: optional narrow test showing empty `I8nText` still omits from YAML.
- `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/rules.ts`: add reference-aware default behavior for `orderType` if supported by orchestration; otherwise use a focused type rule.
- `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.test.ts`: unit test for explicit reference `Asc` restoration.
- `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`: integration test for `DynamicList -> CalculatedFields -> CalculatedField -> orderExpressions`.

## Task 1: Prerequisite Reading And Baseline

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/architecture-orchestration.md`
- Read: `docs/superpowers/specs/2026-05-21-round-trip-yaml-33-diffs-design.md`

- [ ] **Step 1: Read metadata guidance**

Run:

```bash
sed -n '1,240p' .agents/knowledge/metadata/INDEX.md
```

Expected: identify any linked documents required for DCS, YAML import/export, or orchestration changes. Read only the referenced documents that apply to the files in this plan.

- [ ] **Step 2: Read orchestration guidance**

Run:

```bash
sed -n '1,260p' .agents/architecture-orchestration.md
```

Expected: understand how to change `packages/core/metadata/orchestration/property/fromYAML.ts` without breaking the property-rule invariants.

- [ ] **Step 3: Reproduce the current round-trip baseline**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: `DIFF_COUNT: 33` or fewer if another branch already fixed some groups. Save the grouped output in the session notes; do not edit source XML fixtures.

## Task 2: YAML Export Trimming

**Files:**
- Modify: `packages/core/yaml/export.ts`
- Test: create `packages/core/yaml/export.test.ts` if it does not exist

- [ ] **Step 1: Write failing tests**

Add these tests:

```ts
import { describe, expect, it } from "vitest"
import { exportToYAML } from "./export"
import { importFromYAML } from "./import"

describe("exportToYAML", () => {
  it("preserves newline-only block scalar values", () => {
    const yaml = exportToYAML({ Пояснение: "\n" })

    expect(importFromYAML<{ Пояснение: string }>(yaml)).toEqual({ Пояснение: "\n" })
    expect(yaml).toContain("Пояснение: |+")
  })

  it("does not add a service newline for ordinary YAML documents", () => {
    expect(exportToYAML({ Имя: "Тест" }).endsWith("\n")).toBe(false)
  })
})
```

- [ ] **Step 2: Verify the new test fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/yaml/export.test.ts
```

Expected before implementation: the newline-only scalar imports as `""`, not `"\n"`.

- [ ] **Step 3: Replace broad `.trim()`**

Change `packages/core/yaml/export.ts` to remove only one serializer-added final line ending when it is safe. Use this implementation shape:

```ts
import { stringify } from "yaml"

const removeDocumentFinalLineEnding = (yaml: string): string => {
  if (!yaml.endsWith("\n")) return yaml
  if (yaml.endsWith("|\n") || yaml.endsWith("|+\n") || yaml.endsWith("|-\n")) return yaml
  return yaml.slice(0, -1)
}

export const exportToYAML = <T>(data: T): string => {
  const yaml = stringify(data, {
    indent: 2,
    lineWidth: 0,
    keepUndefined: true,
    nullStr: "",
  })
  return removeDocumentFinalLineEnding(yaml)
}
```

If the test still fails for `"\n"`, inspect the exact string produced by `yaml.stringify` and narrow the guard so the final blank scalar line is retained.

- [ ] **Step 4: Verify the focused test passes**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/yaml/export.test.ts
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/yaml/export.ts packages/core/yaml/export.test.ts
git commit -m "fix(core): preserve YAML newline-only scalars"
```

## Task 3: DCS Explicit Field Values And Empty Typed Values

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`

- [ ] **Step 1: Write tests for explicit `Тип: Поле`**

Add a test in `dcsMetadataValue/fromYAML.test.ts`:

```ts
it("imports explicit DesignTimeValue field YAML as dcscor Field", () => {
  const result = importDcsMetadataValueFromYAML(
    mockContextFromYAML(),
    { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue" },
    {
      Тип: "Поле",
      Значение: "СписокФайлов.ФормаРСВ_Представление",
    }
  )

  expect(result).toEqual({
    type: "Field",
    value: "СписокФайлов.ФормаРСВ_Представление",
  })
})
```

Add a matching XML export test in `dcsMetadataValue/toXML.test.ts`:

```ts
it("exports explicit field value as dcscor Field even for DesignTimeValue rules", () => {
  const result = exportDcsMetadataValueToXML(
    mockContextToXML(),
    { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue" },
    { type: "Field", value: "СписокФайлов.ФормаРСВ_Представление" }
  )

  expect(result).toEqual({
    "_xsi:type": "dcscor:Field",
    "#text": "СписокФайлов.ФормаРСВ_Представление",
  })
})
```

- [ ] **Step 2: Write tests for empty typed DCS reference values**

Add a YAML import test:

```ts
it("preserves source empty LocalStringType when YAML omits value", () => {
  const result = importDcsMetadataValueFromYAML(
    mockContextFromYAML(),
    { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue" },
    undefined,
    { _xsiType: "v8:LocalStringType", items: {} } as never
  )

  expect(result).toEqual({ _xsiType: "v8:LocalStringType", items: {} })
})
```

Add an XML export test:

```ts
it("exports preserved empty LocalStringType as explicit empty dcscor value", () => {
  const result = exportDcsMetadataValueToXML(
    mockContextToXML(),
    { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue" },
    { _xsiType: "v8:LocalStringType", items: {} } as never
  )

  expect(result).toEqual({ "_xsi:type": "v8:LocalStringType" })
})
```

Use the actual model shape already produced by `fromXML.test.ts` for `empty-local-string.xml`; if it is `{ items: {} }` with no `_xsiType`, assert and preserve that shape instead of inventing a new marker.

- [ ] **Step 3: Verify DCS tests fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts
```

Expected before implementation: at least one test fails because explicit field or empty typed value is not preserved through the affected path.

- [ ] **Step 4: Implement minimal DCS import/export changes**

In `fromYAML.ts`, keep the existing `importExplicitTextValueFromYAML` branch and extend only the missing source-preservation case:

```ts
if (data === undefined && rule.valueType === "DesignTimeValue" && isExplicitEmptyLocalStringSource(sourceValue)) {
  return sourceValue
}
```

In `toXML.ts`, add a small predicate near `isExplicitTextValue`:

```ts
const isExplicitEmptyLocalStringValue = (data: MetadataDcsMetadataValue): data is I8nText =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  "items" in data &&
  Object.keys((data as I8nText).items).length === 0
```

Then handle it inside the `DesignTimeValue` branch before ordinary `I8nText` export:

```ts
if (isExplicitEmptyLocalStringValue(data)) {
  return { "dcscor:value": { "_xsi:type": "v8:LocalStringType" } }
}
```

Name predicates after the actual model shape discovered from tests.

- [ ] **Step 5: Verify focused DCS tests pass**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts
git commit -m "fix(core): preserve explicit DCS typed values"
```

## Task 4: Form Choice List Presentation Languages

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`

- [ ] **Step 1: Write failing YAML export test**

Add:

```ts
it("exports a single non-default presentation language as a map", () => {
  const result = exportFormChoiceListToYAML(mockContextToYAML(), {
    value: { type: "string", value: "x" },
    presentation: { items: { en: "Labor compensation expenses" } },
  })

  expect(result).toMatchObject({
    Представление: {
      en: "Labor compensation expenses",
    },
  })
})
```

- [ ] **Step 2: Write matching import test**

Add:

```ts
it("imports a single non-default presentation language map", () => {
  const result = importFormChoiceListFromYAML(mockContextFromYAML(), {
    Представление: {
      en: "Labor compensation expenses",
    },
  })

  expect(result.presentation).toEqual({
    items: {
      en: "Labor compensation expenses",
    },
  })
})
```

- [ ] **Step 3: Verify tests fail or expose current behavior**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
```

Expected before implementation: export test fails by returning `Представление: ""` or dropping the English text.

- [ ] **Step 4: Use the shared I8nText YAML exporter**

In `formChoiceList/toYAML.ts`, replace the local `presentationItems` logic with `exportI8nTextToYAML`:

```ts
const presentation = exportI8nTextToYAML({
  context,
  rule: { type: "I8nText" },
  value: data.presentation,
})
```

Keep the result key:

```ts
const result: MetadataFormChoiceListValueYAML = {
  Представление: presentation ?? "",
}
```

Import `exportI8nTextToYAML` from `~/metadata/commonObjects/i8nText/toYAML`.

- [ ] **Step 5: Verify focused tests pass**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
```

Expected: tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts
git commit -m "fix(core): preserve form choice list presentation language"
```

## Task 5: Positional Metadata Path Conversion

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataPath/helper.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`
- Test: `packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`

- [ ] **Step 1: Write failing tests for user-name segments**

Add assertions like these:

```ts
expect(exportMetadataValueStringToYAML(mockContextToYAML(), undefined, "CommonCommand.ПланСчетов")).toBe(
  "ОбщаяКоманда.ПланСчетов"
)

expect(exportMetadataFieldStringToYAML(mockContextToYAML(), undefined, "Document.Продажа.Attribute.Документ")).toBe(
  "Документ.Продажа.Реквизит.Документ"
)

expect(importMetadataValueStringFromYAML(mockContextFromYAML(), undefined, "ОбщаяКоманда.ПланСчетов")).toBe(
  "CommonCommand.ПланСчетов"
)
```

Add one positive conversion assertion so real type/category aliases still convert:

```ts
expect(importMetadataValueStringFromYAML(mockContextFromYAML(), undefined, "ПланСчетов.Хозрасчетный.ПустаяСсылка")).toBe(
  "ChartOfAccounts.Хозрасчетный.EmptyRef"
)
```

- [ ] **Step 2: Verify metadata path tests fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts
```

Expected before implementation: user-name segments that equal metadata aliases are converted incorrectly.

- [ ] **Step 3: Add positional conversion helper**

In `metadataPath/helper.ts`, add a helper that stops alias lookup after a leaf string rule:

```ts
export const convertPathByGrammarPosition = (rules: MetadataFieldsRules, path: string): string => {
  const parts = path.split(".")
  const result: string[] = []
  let currentRules: MetadataFieldsRules | undefined = rules

  for (const part of parts) {
    if (!currentRules || !(part in currentRules)) {
      result.push(part)
      currentRules = undefined
      continue
    }

    const rule = currentRules[part]
    if (typeof rule === "string") {
      result.push(rule)
      currentRules = undefined
      continue
    }

    result.push(rule.name)
    currentRules = rule.fields
  }

  return result.join(".")
}
```

If this matches existing `convertPath`, adjust the existing helper instead of duplicating it; the required behavior is that `CommonCommand.ПланСчетов` converts only the first segment.

- [ ] **Step 4: Apply helper in path import/export**

Change `metadataPath/toYAML.ts` and `metadataPath/fromYAML.ts` to call the positional helper for metadata value and field strings. Preserve the existing Enum special case in `importMetadataValueStringFromYAML`.

- [ ] **Step 5: Verify focused path tests pass**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts
```

Expected: user names are literal; category/type segments still convert.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataPath/helper.ts packages/core/metadata/commonObjects/metadataPath/toYAML.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.ts packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts
git commit -m "fix(core): make metadata path conversion positional"
```

## Task 6: Raw Picture References With Extra Attributes

**Files:**
- Modify: `packages/core/metadata/commonObjects/picture/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/picture/fromYAML.ts` only if import does not already support expanded raw refs
- Test: `packages/core/metadata/commonObjects/picture/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/picture/fromYAML.test.ts`

- [ ] **Step 1: Write raw-ref YAML export tests**

Add:

```ts
it("exports raw picture refs with LoadTransparent as expanded YAML", () => {
  expect(
    exportPictureToYAML(mockContextToYAML(), undefined, {
      rawRef: "0:00000000-0000-0000-0000-000000000000",
      loadTransparent: false,
    })
  ).toEqual({
    Ссылка: "0:00000000-0000-0000-0000-000000000000",
    ПрозрачныйФон: "Ложь",
  })
})

it("exports raw picture refs with transparent pixel as expanded YAML", () => {
  expect(
    exportPictureToYAML(mockContextToYAML(), undefined, {
      rawRef: "0:00000000-0000-0000-0000-000000000000",
      loadTransparent: true,
      transparentPixel: { x: 1, y: 2 },
    })
  ).toEqual({
    Ссылка: "0:00000000-0000-0000-0000-000000000000",
    ПрозрачныйФон: "Истина",
    ПрозрачныйПиксель: { x: 1, y: 2 },
  })
})
```

- [ ] **Step 2: Verify raw-ref tests fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/picture/toYAML.test.ts packages/core/metadata/commonObjects/picture/fromYAML.test.ts
```

Expected before implementation: `toYAML` returns only the raw string and loses extra attributes.

- [ ] **Step 3: Implement expanded raw-ref export**

In `picture/toYAML.ts`, replace the early raw-ref return:

```ts
if (isRawPictureRef(picture)) {
  const hasLoadTransparent = picture.loadTransparent !== undefined
  const hasTransparentPixel = picture.transparentPixel !== undefined
  if (!hasLoadTransparent && !hasTransparentPixel) return picture.rawRef

  const result: PictureYAMLExtended = { Ссылка: picture.rawRef }
  if (hasLoadTransparent) {
    result.ПрозрачныйФон = exportBooleanToYAML(context, undefined, picture.loadTransparent)
  }
  if (hasTransparentPixel) {
    result.ПрозрачныйПиксель = picture.transparentPixel
    if (result.ПрозрачныйФон === undefined) {
      result.ПрозрачныйФон = exportBooleanToYAML(context, undefined, picture.loadTransparent ?? false)
    }
  }
  return result
}
```

- [ ] **Step 4: Verify focused picture tests pass**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/picture/toYAML.test.ts packages/core/metadata/commonObjects/picture/fromYAML.test.ts
```

Expected: short raw refs still export as strings; raw refs with extra attributes export expanded and import back.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/picture/toYAML.ts packages/core/metadata/commonObjects/picture/fromYAML.ts packages/core/metadata/commonObjects/picture/toYAML.test.ts packages/core/metadata/commonObjects/picture/fromYAML.test.ts
git commit -m "fix(core): preserve raw picture reference attributes"
```

## Task 7: Explicit Empty Synonym Source Preservation

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Test: create or update `packages/core/metadata/orchestration/property/fromYAML.test.ts`
- Test: relevant metadata attribute test if one exists after searching `rg -n "MetadataAttribute|Синоним|Synonym" packages/core/metadata`

- [ ] **Step 1: Write orchestration-level failing test**

Create a small metadata rule in `property/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importPropertiesFromYAML } from "./fromYAML"
import { MetadataItemRule } from "./types"
import { mockContextFromYAML } from "~/tests/mockContext"

const rule = {
  itemType: "TestItem",
  properties: {
    name: { type: "string", yaml: "Имя" },
    synonym: {
      type: "I8nText",
      yaml: "Синоним",
      implicitValueYAML: ({ name }: { name?: string }) => ({ items: { ru: name } }),
      applyModelDefaultValueYAMLOnImport: { whenAnyYAMLKeyPresent: ["Имя"] },
    },
  },
} as const satisfies MetadataItemRule

describe("importPropertiesFromYAML source preservation", () => {
  it("keeps explicit empty source value when YAML omits a defaulted property", () => {
    const result = importPropertiesFromYAML({
      context: mockContextFromYAML(),
      metadataRule: rule,
      name: "ПравилаОтправкиДокументов",
      yaml: { Имя: "ПравилаОтправкиДокументов" },
      source: {
        itemType: "TestItem",
        synonym: { items: {} },
      } as never,
    })

    expect(result.synonym).toEqual({ items: {} })
  })
})
```

Adapt property names to the actual `MetadataItemRule` type if TypeScript requires `xml` fields.

- [ ] **Step 2: Verify the test fails**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/property/fromYAML.test.ts
```

Expected before implementation: result uses generated default synonym instead of `{ items: {} }`.

- [ ] **Step 3: Preserve source before defaults when YAML omitted the key**

In `getDefaultValueYAMLForImport`, change the first guard so source wins when it exists:

```ts
if (value !== undefined) return undefined
if (sourceValue !== undefined) return undefined
```

Then ensure `importPropertyFromYAML` still passes `sourceValue` into `getValueOrDefault` for omitted YAML. The expected behavior is:

```ts
YAML key present -> YAML value wins
YAML key omitted and source value present -> source value wins
YAML key omitted and no source value -> implicitValueYAML may apply
```

- [ ] **Step 4: Verify orchestration and synonym-related tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/orchestration/property/fromYAML.test.ts packages/core/metadata/commonObjects/i8nText/toYAML.test.ts
```

Expected: source-preservation test passes; existing `I8nText` YAML behavior remains stable.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/property/fromYAML.ts packages/core/metadata/orchestration/property/fromYAML.test.ts packages/core/metadata/commonObjects/i8nText/toYAML.test.ts
git commit -m "fix(core): preserve explicit empty synonym source"
```

## Task 8: Explicit Asc In Dynamic List Calculated Fields

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.ts` only if rule-level default preservation cannot express the behavior
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`

- [ ] **Step 1: Write unit test for reference explicit `Asc`**

Add:

```ts
it("restores explicit Asc orderType from reference when current value omits it", () => {
  const result = exportPropertyToXML({
    context: mockContextToXML(),
    rule: { type: "CalculatedFieldOrderExpression", xml: "dcssch:orderExpression" },
    value: {
      itemType: "CalculatedFieldOrderExpression",
      expression: "Дата",
      autoOrder: false,
    },
    referenceMetadata: {
      itemType: "CalculatedFieldOrderExpression",
      expression: "Дата",
      orderType: "Asc",
      autoOrder: false,
    },
  })

  expect(result).toMatchObject({
    expression: "Дата",
    orderType: "Asc",
    autoOrder: false,
  })
})
```

Use the actual XML object key shape from existing `toXML.test.ts`; namespace wrapping may mean the expected keys are plain `expression/orderType/autoOrder` inside a `dcssch:orderExpression` object.

- [ ] **Step 2: Write DynamicList integration test**

In `dynamicList/toXML.test.ts`, add a reference-aware test:

```ts
it("preserves explicit Asc orderType in calculated field order expressions from reference", () => {
  const { result } = testExportPropertyToXML({
    rule,
    value: {
      itemType: "DynamicList",
      calculatedFields: [
        {
          itemType: "CalculatedField",
          dataPath: "Дата",
          expression: "Дата",
          orderExpressions: [
            {
              itemType: "CalculatedFieldOrderExpression",
              expression: "Дата",
              autoOrder: false,
            },
          ],
        },
      ],
    },
    referenceMetadata: {
      itemType: "DynamicList",
      calculatedFields: [
        {
          itemType: "CalculatedField",
          dataPath: "Дата",
          expression: "Дата",
          orderExpressions: [
            {
              itemType: "CalculatedFieldOrderExpression",
              expression: "Дата",
              orderType: "Asc",
              autoOrder: false,
            },
          ],
        },
      ],
    },
    xmlRootTag: "Settings",
  })

  expect(result).toContain("<orderType xmlns=\"http://v8.1c.ru/8.1/data-composition-system/common\">Asc</orderType>")
})
```

Match the field names to `CalculatedField` types if they differ.

- [ ] **Step 3: Verify Asc tests fail**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts
```

Expected before implementation: `orderType Asc` is omitted through the dynamic list path.

- [ ] **Step 4: Implement reference-aware default restoration**

Prefer rule-level support. If orchestration already has a property option for preserving reference defaults, use it on `orderType` in `calculatedFieldOrderExpression/rules.ts`. The intended rule behavior is:

```ts
orderType: {
  type: "SystemEnumeration",
  typeSE: "DataCompositionSortDirection",
  xml: "orderType",
  yaml: "ТипУпорядочивания",
  order: 2,
  xmlNamespace: "http://v8.1c.ru/8.1/data-composition-system/common",
  defaultValueXML: "Asc",
  preserveReferenceDefaultXML: true,
}
```

If no such option exists, add a narrowly named helper in `calculatedFieldOrderExpression/toXML.ts` that copies `referenceMetadata.orderType` only when:

```ts
value.orderType === undefined &&
referenceMetadata?.orderType === "Asc" &&
value.expression === referenceMetadata.expression
```

Do not make newly authored YAML without `ТипУпорядочивания` always emit `<orderType>Asc</orderType>`.

- [ ] **Step 5: Verify focused Asc tests pass**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts
```

Expected: explicit reference `Asc` is restored; fresh export without reference remains concise.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/rules.ts packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toXML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts
git commit -m "fix(core): preserve explicit calculated field Asc order"
```

## Task 9: End-To-End Verification

**Files:**
- No source edits expected

- [ ] **Step 1: Run focused test group**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/yaml/export.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts packages/core/metadata/commonObjects/picture/toYAML.test.ts packages/core/metadata/commonObjects/picture/fromYAML.test.ts packages/core/metadata/orchestration/property/fromYAML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run YAML round-trip triage**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: `DIFF_COUNT: 0` for the `acc` source, or only diffs outside the eight groups documented in the spec. If any of the eight groups remain, stop and fix the responsible task before continuing.

- [ ] **Step 3: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

- [ ] **Step 4: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 5: Commit verification-only updates if any generated files changed**

If Langium generation changed files, inspect them:

```bash
git status --short
```

If changes are expected generated outputs, commit them with the relevant implementation commit or a final verification commit:

```bash
git add <generated-files>
git commit -m "chore(language): update generated Langium files"
```

Do not commit unrelated user changes.

## Self-Review

- Spec coverage: all eight design groups map to Tasks 2 through 8, with Task 9 covering triage and full verification.
- Placeholder scan: no `TBD`, `TODO`, or open-ended "handle edge cases" steps remain; each task has concrete files, code shape, commands, and expected results.
- Type consistency: sample code uses existing names from inspected modules. Where current local type names may differ in tests, the plan requires matching the actual existing fixture/type shape before implementation.
