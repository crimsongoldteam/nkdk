# PredefinedCode Typed YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve whether predefined item `Code` is numeric or string across `XML -> YAML -> XML`.

**Architecture:** Add a narrow `PredefinedCode` property type used only by `PredefinedItem.code`. The new type maps XML `xsi:type` to YAML scalar type: numeric XML becomes YAML number, untyped XML remains YAML string; export reverses that mapping.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration `registerTypeRule`, TypeBox JSON schema helpers, `pnpm --filter @nakidka/core exec vitest`.

---

## File Structure

- Create `packages/core/metadata/commonObjects/predefinedCode/types.ts`
  - Owns `PredefinedCode = string | number`, YAML type, and `PredefinedCodePropertyRule`.
- Create `packages/core/metadata/commonObjects/predefinedCode/fromXML.ts`
  - Imports XML scalar/object values and preserves string codes.
- Create `packages/core/metadata/commonObjects/predefinedCode/toXML.ts`
  - Exports numbers as typed XML and strings as plain XML text.
- Create `packages/core/metadata/commonObjects/predefinedCode/toJSONSchema.ts`
  - Exposes YAML schema as `string | number`.
- Create `packages/core/metadata/commonObjects/predefinedCode/index.ts`
  - Side-effect imports for type-rule registration.
- Create `packages/core/metadata/commonObjects/predefinedCode/fromXML.test.ts`
  - Focused import tests.
- Create `packages/core/metadata/commonObjects/predefinedCode/toXML.test.ts`
  - Focused export tests.
- Create `packages/core/metadata/commonObjects/predefinedItem/__fixtures__/typed-code.ts`
  - Integration fixture values for one numeric and one string code.
- Create `packages/core/metadata/commonObjects/predefinedItem/__fixtures__/typed-code.xml`
  - Integration XML with `<Code xsi:type="xs:decimal">0</Code>` and `<Code>0</Code>`.
- Modify `packages/core/metadata/orchestration/property/registry.ts`
  - Add `PredefinedCode` to compile-time property registry.
- Modify `packages/core/metadata/orchestration/property/types.ts`
  - Add `PredefinedCodePropertyRule` to the `PropertyRule` union.
- Modify `packages/core/metadata/commonObjects/predefinedItem/rules.ts`
  - Change `code` from `type: "string"` to `type: "PredefinedCode"`.
- Modify `packages/core/metadata/commonObjects/predefinedItem/index.ts`
  - Import `../predefinedCode` before `./types`.
- Modify `packages/core/metadata/commonObjects/index.ts`
  - Import `./predefinedCode` before `./predefinedItem`.
- Modify `packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts`
  - Add typed-code import and round-trip coverage; import `./index`.
- Modify `packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts`
  - Add typed-code export coverage; import `./index`.

## Task 1: Add Failing Focused PredefinedCode Tests

**Files:**
- Create: `packages/core/metadata/commonObjects/predefinedCode/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/predefinedCode/toXML.test.ts`

- [ ] **Step 1: Create failing import tests**

Create `packages/core/metadata/commonObjects/predefinedCode/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importPredefinedCodeFromXML } from "./fromXML"

const context = {} as never
const rule = { type: "PredefinedCode" } as never

describe("importPredefinedCodeFromXML", () => {
  it("imports typed decimal code as number", () => {
    const result = importPredefinedCodeFromXML(context, rule, {
      "_xsi:type": "xs:decimal",
      "#text": "0",
    })

    expect(result).toBe(0)
  })

  it("imports typed integer code as number", () => {
    const result = importPredefinedCodeFromXML(context, rule, {
      "_xsi:type": "xs:integer",
      "#text": "42",
    })

    expect(result).toBe(42)
  })

  it("imports untyped code as string", () => {
    const result = importPredefinedCodeFromXML(context, rule, "0")

    expect(result).toBe("0")
  })

  it("keeps untyped code text unchanged", () => {
    const result = importPredefinedCodeFromXML(context, rule, "103    ")

    expect(result).toBe("103    ")
  })
})
```

- [ ] **Step 2: Create failing export tests**

Create `packages/core/metadata/commonObjects/predefinedCode/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { exportPredefinedCodeToXML } from "./toXML"

const context = {} as never
const rule = { type: "PredefinedCode" } as never

describe("exportPredefinedCodeToXML", () => {
  it("exports number as typed decimal XML", () => {
    const result = exportPredefinedCodeToXML(context, rule, 0)

    expect(result).toEqual({
      "_xsi:type": "xs:decimal",
      "#text": "0",
    })
  })

  it("exports string as plain XML text", () => {
    const result = exportPredefinedCodeToXML(context, rule, "0")

    expect(result).toBe("0")
  })

  it("keeps string text unchanged", () => {
    const result = exportPredefinedCodeToXML(context, rule, "103    ")

    expect(result).toBe("103    ")
  })
})
```

- [ ] **Step 3: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/predefinedCode/fromXML.test.ts metadata/commonObjects/predefinedCode/toXML.test.ts
```

Expected: `FAIL` because `./fromXML` and `./toXML` do not exist yet.

## Task 2: Implement PredefinedCode Property Type

**Files:**
- Create: `packages/core/metadata/commonObjects/predefinedCode/types.ts`
- Create: `packages/core/metadata/commonObjects/predefinedCode/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/predefinedCode/toXML.ts`
- Create: `packages/core/metadata/commonObjects/predefinedCode/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/predefinedCode/index.ts`

- [ ] **Step 1: Add PredefinedCode types**

Create `packages/core/metadata/commonObjects/predefinedCode/types.ts`:

```ts
import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration"

export const PredefinedCodeJSONSchema = Type.Union([Type.String(), Type.Number()])

export type PredefinedCode = string | number
export type PredefinedCodeYAML = Static<typeof PredefinedCodeJSONSchema>

export interface PredefinedCodePropertyRule extends BasePropertyRule {
  type: "PredefinedCode"
}
```

- [ ] **Step 2: Add XML import handler**

Create `packages/core/metadata/commonObjects/predefinedCode/fromXML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PredefinedCode } from "./types"

const TYPED_NUMERIC_XSI = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

type PredefinedCodeXML =
  | number
  | string
  | { "#text"?: number | string; "_xsi:type"?: string }
  | undefined

export const importPredefinedCodeFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: PredefinedCodeXML
): PredefinedCode | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "object" && value !== null) {
    const text = value["#text"]
    const xsiType = value["_xsi:type"]

    if (xsiType !== undefined && TYPED_NUMERIC_XSI.has(xsiType)) {
      if (text === undefined || text === "") return undefined
      return typeof text === "number" ? text : Number(text)
    }

    return text === undefined ? undefined : String(text)
  }

  return typeof value === "number" ? value : String(value)
}

registerTypeRule("PredefinedCode", "importFromXML", importPredefinedCodeFromXML)
```

- [ ] **Step 3: Add XML export handler**

Create `packages/core/metadata/commonObjects/predefinedCode/toXML.ts`:

```ts
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PredefinedCode } from "./types"

export const exportPredefinedCodeToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: PredefinedCode | undefined
): string | { "_xsi:type": "xs:decimal"; "#text": string } | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "number") {
    return { "_xsi:type": "xs:decimal", "#text": String(value) }
  }

  return value
}

registerTypeRule("PredefinedCode", "exportToXML", exportPredefinedCodeToXML)
```

- [ ] **Step 4: Add JSON Schema handler**

Create `packages/core/metadata/commonObjects/predefinedCode/toJSONSchema.ts`:

```ts
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PredefinedCodeJSONSchema } from "./types"

registerTypeRule("PredefinedCode", "exportToJSONSchema", () => PredefinedCodeJSONSchema)
```

- [ ] **Step 5: Add side-effect index**

Create `packages/core/metadata/commonObjects/predefinedCode/index.ts`:

```ts
import "./fromXML"
import "./toJSONSchema"
import "./toXML"
```

- [ ] **Step 6: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/predefinedCode/fromXML.test.ts metadata/commonObjects/predefinedCode/toXML.test.ts
```

Expected: `PASS` for `fromXML.test.ts` and `toXML.test.ts`.

- [ ] **Step 7: Commit focused type implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/predefinedCode
git commit -m "feat: :sparkles: добавить тип PredefinedCode"
```

## Task 3: Register PredefinedCode in Orchestration Types

**Files:**
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`

- [ ] **Step 1: Add PredefinedCode to property registry imports**

In `packages/core/metadata/orchestration/property/registry.ts`, add this import near the existing predefined imports:

```ts
import { PredefinedCode, PredefinedCodeYAML } from "~/metadata/commonObjects/predefinedCode/types"
```

- [ ] **Step 2: Add PredefinedCode to `PropertyTypeRegistry`**

In `packages/core/metadata/orchestration/property/registry.ts`, add this entry next to `Predefined`/`PredefinedItem`:

```ts
  PredefinedCode: {
    item: PredefinedCode
    yaml: PredefinedCodeYAML
  }
```

- [ ] **Step 3: Add PredefinedCode to `PropertyRuleTypeKeys` object**

In `packages/core/metadata/orchestration/property/registry.ts`, add this key next to `Predefined`/`PredefinedItem`:

```ts
  PredefinedCode: "PredefinedCode",
```

- [ ] **Step 4: Add PredefinedCode rule type to property union**

In `packages/core/metadata/orchestration/property/types.ts`, add this import near other common object property-rule imports:

```ts
import { PredefinedCodePropertyRule } from "~/metadata/commonObjects/predefinedCode/types"
```

Then add `PredefinedCodePropertyRule` to the `PropertyRule` union near `NumberPropertyRule`:

```ts
  | NumberPropertyRule
  | PredefinedCodePropertyRule
  | StringOrNumberPropertyRule
```

- [ ] **Step 5: Run type-check for registry changes**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: `tsc --noEmit` exits with code `0`.

- [ ] **Step 6: Commit registry wiring**

Run:

```bash
git add packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: зарегистрировать PredefinedCode"
```

## Task 4: Integrate PredefinedCode into PredefinedItem

**Files:**
- Modify: `packages/core/metadata/commonObjects/predefinedItem/rules.ts`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/index.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`

- [ ] **Step 1: Update PredefinedItem code rule**

In `packages/core/metadata/commonObjects/predefinedItem/rules.ts`, replace the `code` rule with:

```ts
    code: {
      type: "PredefinedCode",
      xml: "Code",
      yaml: "Код",
      required: true,
    },
```

- [ ] **Step 2: Register PredefinedCode when predefinedItem is imported**

Replace `packages/core/metadata/commonObjects/predefinedItem/index.ts` with:

```ts
import "../predefinedCode"
import "./types"
```

- [ ] **Step 3: Register PredefinedCode in commonObjects index**

In `packages/core/metadata/commonObjects/index.ts`, add this import immediately before `import "./predefined"`:

```ts
import "./predefinedCode"
```

- [ ] **Step 4: Run type-check for rule integration**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: `tsc --noEmit` exits with code `0`.

- [ ] **Step 5: Commit rule integration**

Run:

```bash
git add packages/core/metadata/commonObjects/predefinedItem/rules.ts packages/core/metadata/commonObjects/predefinedItem/index.ts packages/core/metadata/commonObjects/index.ts
git commit -m "fix: :bug: различать тип кода предопределенных"
```

## Task 5: Add PredefinedItem Integration Tests

**Files:**
- Create: `packages/core/metadata/commonObjects/predefinedItem/__fixtures__/typed-code.ts`
- Create: `packages/core/metadata/commonObjects/predefinedItem/__fixtures__/typed-code.xml`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts`

- [ ] **Step 1: Add typed-code XML fixture**

Create `packages/core/metadata/commonObjects/predefinedItem/__fixtures__/typed-code.xml`:

```xml
﻿<Item id="11111111-1111-1111-1111-111111111111">
	<Name>Группа</Name>
	<Code xsi:type="xs:decimal">0</Code>
	<Description>Группа</Description>
	<IsFolder>true</IsFolder>
	<ChildItems>
		<Item id="22222222-2222-2222-2222-222222222222">
			<Name>СтроковыйКод</Name>
			<Code>0</Code>
			<Description>Строковый код</Description>
			<IsFolder>false</IsFolder>
		</Item>
	</ChildItems>
</Item>
```

- [ ] **Step 2: Add typed-code model fixture**

Create `packages/core/metadata/commonObjects/predefinedItem/__fixtures__/typed-code.ts`:

```ts
import type { PredefinedItem, PredefinedItemCollectionYAML } from "../types"

export const typedCode = {
  itemType: "PredefinedItem" as const,
  name: "Группа",
  code: 0,
  description: "Группа",
  isFolder: true,
  childItems: [
    {
      itemType: "PredefinedItem" as const,
      name: "СтроковыйКод",
      code: "0",
      description: "Строковый код",
      isFolder: false,
    },
  ],
} as const satisfies PredefinedItem

export const typedCodeYAML = {
  Группа: {
    Код: 0,
    Наименование: "Группа",
    ЭтоГруппа: "Истина",
    Элементы: {
      СтроковыйКод: {
        Код: "0",
        Наименование: "Строковый код",
      },
    },
  },
} as const satisfies PredefinedItemCollectionYAML
```

- [ ] **Step 3: Update fromXML integration test imports and cases**

In `packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts`, change:

```ts
import "./types"
```

to:

```ts
import "./index"
```

Add this import near the other fixture imports:

```ts
import { typedCode } from "./__fixtures__/typed-code"
```

Change the fixture list to:

```ts
const fixtures = ["group.xml", "item.xml", "typed-code.xml"] as const
```

Add this test after `imports item.xml`:

```ts
  it("imports typed-code.xml", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "typed-code.xml",
      xmlRootTag: "Item",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(typedCode)
  })
```

- [ ] **Step 4: Update toXML integration test imports and cases**

In `packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts`, change:

```ts
import "./types"
```

to:

```ts
import "./index"
```

Add this import near the other fixture imports:

```ts
import { typedCode } from "./__fixtures__/typed-code"
```

Change `cases` to:

```ts
const cases = [
  { name: "group.xml", value: group },
  { name: "item.xml", value: item },
  { name: "typed-code.xml", value: typedCode },
] as const
```

- [ ] **Step 5: Run PredefinedItem focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/predefinedItem/fromXML.test.ts metadata/commonObjects/predefinedItem/toXML.test.ts
```

Expected: `PASS`; `typed-code.xml` round-trip keeps both `<Code xsi:type="xs:decimal">0</Code>` and `<Code>0</Code>`.

- [ ] **Step 6: Commit integration tests**

Run:

```bash
git add packages/core/metadata/commonObjects/predefinedItem
git commit -m "test: :white_check_mark: покрыть тип кода предопределенных"
```

## Task 6: Verify Full Predefined Behavior and Round-Trip Diff

**Files:**
- No planned file edits.

- [ ] **Step 1: Run all related focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/predefinedCode/fromXML.test.ts metadata/commonObjects/predefinedCode/toXML.test.ts metadata/commonObjects/predefinedItem/fromXML.test.ts metadata/commonObjects/predefinedItem/toXML.test.ts metadata/commonObjects/predefined/toXML.test.ts metadata/commonObjects/predefined/fromXML.test.ts
```

Expected: `PASS` for all listed suites.

- [ ] **Step 2: Run core type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: `tsc --noEmit` exits with code `0`.

- [ ] **Step 3: Run YAML round-trip triage**

Run from repo root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: script exits with code `0`. The first five `Predefined.xml` diffs that only removed `xsi:type="xs:decimal"` from `<Code>` are gone. If new first diffs appear, summarize them as the next triage group instead of treating that as failure.

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intended `nakidka-core` files are modified or staged. The XML repo may contain diagnostic diffs left by `round-trip-yaml`; do not restore it unless the user asks.

- [ ] **Step 5: Commit final verification note only if code changed after prior commits**

If Task 6 required no file edits, do not create an empty commit. If it required a small fix, commit it with:

```bash
git add <changed-files>
git commit -m "fix: :bug: стабилизировать round-trip PredefinedCode"
```

## Self-Review

- Spec coverage: the plan implements local `PredefinedCode`, numeric XML import, untyped XML string import, numeric YAML export, string YAML export, schema registration, `PredefinedItem.code` integration, focused tests, integration tests, and round-trip triage verification.
- Placeholder scan: no unfinished markers or open-ended implementation steps remain.
- Type consistency: `PredefinedCode`, `PredefinedCodeYAML`, and `PredefinedCodePropertyRule` are defined before registry and rule usage; `PredefinedItem.code` uses the same `type: "PredefinedCode"` everywhere.
