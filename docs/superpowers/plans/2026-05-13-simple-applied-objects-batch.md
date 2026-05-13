# Simple Applied Objects Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add round-trip XML/YAML/sync support for the selected simple applied metadata objects, excluding `metadataExternalDataSource`.

**Architecture:** Follow the existing `metadataConstant` pattern: each applied object gets a focused `rules.ts`, `types.ts`, fixture-derived TS/YAML data, and standard XML/YAML/sync tests. Shared gaps are handled first with small rule types: `CommonAttributeContent` for common attribute content and `StyleItemValue` for style item values. Opaque external XML files reuse the existing `Template` sync mechanism because it copies files without parsing.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser`, project metadata orchestration rules, `pnpm`.

---

## Reference Documents

- Spec: `docs/superpowers/specs/2026-05-13-simple-applied-objects-batch-design.md`
- Project rules: `AGENTS.md`
- Metadata knowledge:
  - `.agents/knowledge/metadata/INDEX.md`
  - `.agents/knowledge/metadata/sources-of-truth.md`
  - `.agents/knowledge/metadata/applied-object-implementation.md`
  - `.agents/knowledge/metadata/registries.md`
  - `.agents/knowledge/metadata/yaml-contract.md`
- Main pattern: `packages/core/metadata/appliedObjects/metadataConstant/*`
- Useful neighbor rules:
  - `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
  - `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
  - `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts`
  - `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`

## File Structure

Create these applied-object directories:

- `packages/core/metadata/appliedObjects/metadataDefinedType/`
- `packages/core/metadata/appliedObjects/metadataEventSubscription/`
- `packages/core/metadata/appliedObjects/metadataSessionParameter/`
- `packages/core/metadata/appliedObjects/metadataFunctionalOptionsParameter/`
- `packages/core/metadata/appliedObjects/metadataStyleItem/`
- `packages/core/metadata/appliedObjects/metadataCommonAttribute/`
- `packages/core/metadata/appliedObjects/metadataBot/`
- `packages/core/metadata/appliedObjects/metadataWSReference/`
- `packages/core/metadata/appliedObjects/metadataFilterCriterion/`
- `packages/core/metadata/appliedObjects/metadataSettingsStorage/`

Each applied-object directory should contain:

- `rules.ts`: declarative `MetadataItemRule`
- `types.ts`: inferred model/YAML types, XML interfaces, `registerMetadataItemRule`
- `index.ts`: `export * from "./types"` and import side effects when needed
- `__fixtures__/full.ts` and `__fixtures__/minimal.ts` when the object has `full.xml`/`minimal.xml`
- `fromXML.test.ts`
- `toXML.test.ts`
- `fromYAML.test.ts`
- `toYAML.test.ts`
- `convertFromXML.test.ts`
- `syncToXML.test.ts`

Create these shared common-object directories:

- `packages/core/metadata/commonObjects/commonAttributeContent/`
- `packages/core/metadata/commonObjects/styleItemValue/`

Modify these registries and startup imports:

- `packages/core/metadata/orchestration/metadataItem/registry.ts`
- `packages/core/metadata/orchestration/property/registry.ts`
- `packages/core/metadata/commonObjects/index.ts`
- `packages/core/metadata/appliedObjects/index.ts`

Do not modify XML fixtures. Existing XML and sync fixtures are sources of truth.

---

### Task 1: Baseline And Metadata Rules Refresh

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/knowledge/metadata/sources-of-truth.md`
- Read: `.agents/knowledge/metadata/applied-object-implementation.md`
- Read: `.agents/knowledge/metadata/registries.md`
- Read: `.agents/knowledge/metadata/yaml-contract.md`

- [ ] **Step 1: Confirm clean branch**

Run:

```bash
git status --short
```

Expected: only the plan file may be untracked or modified.

- [ ] **Step 2: Confirm generated language files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits `0` and prints `Langium generator finished successfully`.

- [ ] **Step 3: Confirm baseline tests still pass**

Run:

```bash
pnpm test
```

Expected: all package tests pass. If this fails before code changes, stop and record the failing package and test name before implementing.

- [ ] **Step 4: Commit only the plan if it is not already committed**

Run:

```bash
git status --short
git add docs/superpowers/plans/2026-05-13-simple-applied-objects-batch.md
git commit -m "docs: :memo: описать план простых applied objects"
```

Expected: one docs commit with only the plan file.

---

### Task 2: Add `CommonAttributeContent`

**Files:**
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/types.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/toXML.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/toXML.test.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/commonAttributeContent/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing XML tests**

Create `fromXML.test.ts` with two cases:

```ts
import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { CommonAttributeContent } from "./types"

const rule = { type: "CommonAttributeContent" } as const

const fullXML = {
  "xr:Item": [
    { "xr:Metadata": "ChartOfAccounts.ПланСчетовВсеСвойства", "xr:Use": "Use", "xr:ConditionalSeparation": "" },
    { "xr:Metadata": "Catalog.СправочникОбщиеРеквизиты", "xr:Use": "Use", "xr:ConditionalSeparation": "" },
    { "xr:Metadata": "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", "xr:Use": "DontUse", "xr:ConditionalSeparation": "" },
  ],
}

const full: CommonAttributeContent = [
  { metadata: "ChartOfAccounts.ПланСчетовВсеСвойства", use: "Use", conditionalSeparation: "" },
  { metadata: "Catalog.СправочникОбщиеРеквизиты", use: "Use", conditionalSeparation: "" },
  { metadata: "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", use: "DontUse", conditionalSeparation: "" },
]

describe("CommonAttributeContent XML", () => {
  it("imports content items", () => {
    expect(testImportPropertyFromXML({ rule, value: fullXML })).toEqual(full)
  })

  it("exports content items", () => {
    expect(testExportPropertyToXML({ rule, value: full })).toEqual(fullXML)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/commonAttributeContent/fromXML.test.ts metadata/commonObjects/commonAttributeContent/toXML.test.ts
```

Expected: fail because files or rule exports do not exist.

- [ ] **Step 3: Implement types**

Create `types.ts`:

```ts
import * as SE from "~/metadata/systemEnumerations/types"

export interface CommonAttributeContentItem {
  metadata: string
  use: SE.CommonAttributeUse
  conditionalSeparation?: string
}

export type CommonAttributeContent = CommonAttributeContentItem[]

export interface CommonAttributeContentItemXML {
  "xr:Metadata": string
  "xr:Use": SE.CommonAttributeUse
  "xr:ConditionalSeparation"?: string
}

export interface CommonAttributeContentXML {
  "xr:Item"?: CommonAttributeContentItemXML | CommonAttributeContentItemXML[]
}

export interface CommonAttributeContentItemYAML {
  Объект: string
  Использование: SE.CommonAttributeUseYAML
  УсловноеРазделение?: string
}

export type CommonAttributeContentYAML = CommonAttributeContentItemYAML[]
```

- [ ] **Step 4: Implement XML handlers**

Create `fromXML.ts`:

```ts
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

const toArray = <T>(value: T | T[] | undefined): T[] => (value === undefined ? [] : Array.isArray(value) ? value : [value])

export const importCommonAttributeContentFromXML = (
  _context: unknown,
  _rule: unknown,
  xml: CommonAttributeContentXML | undefined
): CommonAttributeContent | undefined => {
  if (!xml) return undefined
  return toArray(xml["xr:Item"]).map((item) => ({
    metadata: item["xr:Metadata"],
    use: item["xr:Use"],
    conditionalSeparation: item["xr:ConditionalSeparation"] ?? "",
  }))
}

registerTypeRule("CommonAttributeContent", "importFromXML", importCommonAttributeContentFromXML as never)
```

Create `toXML.ts`:

```ts
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CommonAttributeContent, CommonAttributeContentXML } from "./types"

export const exportCommonAttributeContentToXML = (
  _context: unknown,
  _rule: unknown,
  value: CommonAttributeContent | undefined
): CommonAttributeContentXML | undefined => {
  if (!value) return undefined
  return {
    "xr:Item": value.map((item) => ({
      "xr:Metadata": item.metadata,
      "xr:Use": item.use,
      "xr:ConditionalSeparation": item.conditionalSeparation ?? "",
    })),
  }
}

registerTypeRule("CommonAttributeContent", "exportToXML", exportCommonAttributeContentToXML as never)
```

- [ ] **Step 5: Implement YAML handlers**

Create `fromYAML.ts`:

```ts
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/fromYAML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

export const importCommonAttributeContentFromYAML = (
  context: unknown,
  _rule: unknown,
  yaml: CommonAttributeContentYAML | undefined
): CommonAttributeContent | undefined => {
  if (!yaml) return undefined
  return yaml.map((item) => ({
    metadata: item.Объект,
    use: importSystemEnumerationFromYAML({
      context: context as never,
      rule: { type: "SystemEnumeration", typeSE: "CommonAttributeUse" } as never,
      value: item.Использование,
    }) as never,
    conditionalSeparation: item.УсловноеРазделение ?? "",
  }))
}

registerTypeRule("CommonAttributeContent", "importFromYAML", importCommonAttributeContentFromYAML as never)
```

Create `toYAML.ts`:

```ts
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/toYAML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { CommonAttributeContent, CommonAttributeContentYAML } from "./types"

export const exportCommonAttributeContentToYAML = (
  context: unknown,
  _rule: unknown,
  value: CommonAttributeContent | undefined
): CommonAttributeContentYAML | undefined => {
  if (!value) return undefined
  return value.map((item) => ({
    Объект: item.metadata,
    Использование: exportSystemEnumerationToYAML(
      context as never,
      { type: "SystemEnumeration", typeSE: "CommonAttributeUse" } as never,
      item.use
    ) as never,
    УсловноеРазделение: item.conditionalSeparation ?? "",
  }))
}

registerTypeRule("CommonAttributeContent", "exportToYAML", exportCommonAttributeContentToYAML as never)
```

Keep the `as never` casts inside these four handler files only.

- [ ] **Step 6: Register type and startup imports**

Modify `property/registry.ts`:

```ts
import {
  CommonAttributeContent,
  CommonAttributeContentYAML,
} from "~/metadata/commonObjects/commonAttributeContent/types"
```

Add to `PropertyTypeRegistry`:

```ts
  CommonAttributeContent: {
    item: CommonAttributeContent
    yaml: CommonAttributeContentYAML
  }
```

Add to `PropertyRuleTypeKeys`:

```ts
  CommonAttributeContent: "CommonAttributeContent",
```

Modify `commonObjects/index.ts`:

```ts
import "./commonAttributeContent/fromXML"
import "./commonAttributeContent/toXML"
import "./commonAttributeContent/fromYAML"
import "./commonAttributeContent/toYAML"
```

- [ ] **Step 7: Add YAML tests**

Create YAML tests that prove this YAML shape:

```yaml
- Объект: ПланСчетов.ПланСчетовВсеСвойства
  Использование: Использовать
  УсловноеРазделение: ""
- Объект: Справочники.СправочникОбщиеРеквизиты
  Использование: Использовать
  УсловноеРазделение: ""
- Объект: ПланыВидовРасчета.ПланРасчетаВсеСвойства
  Использование: НеИспользовать
  УсловноеРазделение: ""
```

Expected model values must use internal metadata paths:

```ts
[
  { metadata: "ChartOfAccounts.ПланСчетовВсеСвойства", use: "Use", conditionalSeparation: "" },
  { metadata: "Catalog.СправочникОбщиеРеквизиты", use: "Use", conditionalSeparation: "" },
  { metadata: "ChartOfCalculationTypes.ПланРасчетаВсеСвойства", use: "DontUse", conditionalSeparation: "" },
]
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/commonAttributeContent
```

Expected: pass.

- [ ] **Step 9: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/commonAttributeContent packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить CommonAttributeContent"
```

---

### Task 3: Add `StyleItemValue`

**Files:**
- Create: `packages/core/metadata/commonObjects/styleItemValue/types.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/toXML.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/toXML.test.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/styleItemValue/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing XML tests for all three current shapes**

Use these XML values:

```ts
const fontXML = {
  "_xsi:type": "v8ui:Font",
  _faceName: "Devanagari MT",
  _height: 16,
  _bold: true,
  _italic: true,
  _underline: true,
  _strikeout: true,
  _kind: "Absolute",
  _scale: 99,
}

const colorXML = {
  "_xsi:type": "v8ui:Color",
  "#text": "#8A31E2",
}

const borderXML = {
  "_xsi:type": "v8ui:Border",
  _width: 5,
  "v8ui:style": {
    "_xsi:type": "v8ui:ControlBorderType",
    "#text": "Overline",
  },
}
```

Expected model values:

```ts
const fontValue = {
  type: "Font",
  value: {
    faceName: "Devanagari MT",
    height: 16,
    bold: true,
    italic: true,
    underline: true,
    strikeout: true,
    kind: "Absolute",
    scale: 99,
  },
}

const colorValue = { type: "Color", value: { type: "Absolute", value: "#8A31E2" } }
const borderValue = { type: "Border", value: { width: 5, controlBorderType: "Overline" } }
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/styleItemValue
```

Expected: fail because `StyleItemValue` is not registered.

- [ ] **Step 3: Implement the type**

Create `types.ts`:

```ts
import { Border, BorderXML, BorderYAML } from "~/metadata/commonObjects/border/types"
import { Color, ColorXML, ColorYAML } from "~/metadata/commonObjects/color/types"
import { Font, FontXML, FontYAML } from "~/metadata/commonObjects/font/types"

export type StyleItemValue =
  | { type: "Font"; value: Font }
  | { type: "Color"; value: Color }
  | { type: "Border"; value: Border }

export type StyleItemValueXML =
  | (FontXML & { "_xsi:type": "v8ui:Font" })
  | ({ "_xsi:type": "v8ui:Color"; "#text"?: ColorXML })
  | (BorderXML & { "_xsi:type": "v8ui:Border" })

export type StyleItemValueYAML =
  | { Вид: "Шрифт"; Значение: FontYAML }
  | { Вид: "Цвет"; Значение: ColorYAML }
  | { Вид: "Рамка"; Значение: BorderYAML }
```

- [ ] **Step 4: Implement XML handlers by delegating to existing common types**

In `fromXML.ts`, call existing import handlers through `importPropertyFromXML`:

```ts
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { StyleItemValue, StyleItemValueXML } from "./types"

export const importStyleItemValueFromXML = (context: any, _rule: unknown, value: StyleItemValueXML | undefined): StyleItemValue | undefined => {
  if (!value) return undefined
  if (value["_xsi:type"] === "v8ui:Font") {
    return { type: "Font", value: importPropertyFromXML({ context, rule: { type: "Font" }, value }) as any }
  }
  if (value["_xsi:type"] === "v8ui:Color") {
    return { type: "Color", value: importPropertyFromXML({ context, rule: { type: "Color" }, value: value["#text"] }) as any }
  }
  if (value["_xsi:type"] === "v8ui:Border") {
    return { type: "Border", value: importPropertyFromXML({ context, rule: { type: "Border" }, value }) as any }
  }
  throw new Error(`StyleItemValue: неподдержанный xsi:type ${(value as any)["_xsi:type"]}`)
}

registerTypeRule("StyleItemValue", "importFromXML", importStyleItemValueFromXML as any)
```

In `toXML.ts`, delegate in the opposite direction and add `_xsi:type`:

```ts
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { StyleItemValue } from "./types"

export const exportStyleItemValueToXML = (context: any, _rule: unknown, value: StyleItemValue | undefined) => {
  if (!value) return undefined
  if (value.type === "Font") {
    return { ...(exportPropertyToXML({ context, rule: { type: "Font" }, value: value.value }) as object), "_xsi:type": "v8ui:Font" }
  }
  if (value.type === "Color") {
    return { "_xsi:type": "v8ui:Color", "#text": exportPropertyToXML({ context, rule: { type: "Color" }, value: value.value }) }
  }
  return { ...(exportPropertyToXML({ context, rule: { type: "Border" }, value: value.value }) as object), "_xsi:type": "v8ui:Border" }
}

registerTypeRule("StyleItemValue", "exportToXML", exportStyleItemValueToXML as any)
```

Keep casts inside this adapter only. The helper signatures to use are `importPropertyFromXML({ context, rule, value })`
and `exportPropertyToXML({ context, rule, value })`.

- [ ] **Step 5: Implement YAML handlers**

Map YAML `Вид` values to internal type tags:

```ts
const kindFromYAML = { Шрифт: "Font", Цвет: "Color", Рамка: "Border" } as const
const kindToYAML = { Font: "Шрифт", Color: "Цвет", Border: "Рамка" } as const
```

Delegate `Значение` to the corresponding `Font`, `Color`, or `Border` YAML handler.

- [ ] **Step 6: Register type**

Modify `property/registry.ts`:

```ts
import { StyleItemValue, StyleItemValueYAML } from "~/metadata/commonObjects/styleItemValue/types"
```

Add:

```ts
  StyleItemValue: {
    item: StyleItemValue
    yaml: StyleItemValueYAML
  }
```

Add to keys:

```ts
  StyleItemValue: "StyleItemValue",
```

Modify `commonObjects/index.ts`:

```ts
import "./styleItemValue/fromXML"
import "./styleItemValue/toXML"
import "./styleItemValue/fromYAML"
import "./styleItemValue/toYAML"
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/styleItemValue metadata/commonObjects/font metadata/commonObjects/color metadata/commonObjects/border
```

Expected: pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/styleItemValue packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить значение элемента стиля"
```

---

### Task 4: Add Registry Entries For Applied Objects

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`

- [ ] **Step 1: Add imports to `metadataItem/registry.ts`**

Add imports for:

```ts
import { MetadataBot, MetadataBotYAML } from "../../appliedObjects/metadataBot/types"
import { MetadataCommonAttribute, MetadataCommonAttributeYAML } from "../../appliedObjects/metadataCommonAttribute/types"
import { MetadataDefinedType, MetadataDefinedTypeYAML } from "../../appliedObjects/metadataDefinedType/types"
import { MetadataEventSubscription, MetadataEventSubscriptionYAML } from "../../appliedObjects/metadataEventSubscription/types"
import { MetadataFilterCriterion, MetadataFilterCriterionYAML } from "../../appliedObjects/metadataFilterCriterion/types"
import {
  MetadataFunctionalOptionsParameter,
  MetadataFunctionalOptionsParameterYAML,
} from "../../appliedObjects/metadataFunctionalOptionsParameter/types"
import { MetadataSessionParameter, MetadataSessionParameterYAML } from "../../appliedObjects/metadataSessionParameter/types"
import { MetadataSettingsStorage, MetadataSettingsStorageYAML } from "../../appliedObjects/metadataSettingsStorage/types"
import { MetadataStyleItem, MetadataStyleItemYAML } from "../../appliedObjects/metadataStyleItem/types"
import { MetadataWSReference, MetadataWSReferenceYAML } from "../../appliedObjects/metadataWSReference/types"
```

- [ ] **Step 2: Add `MetadataItemTypeRegistry` entries**

Add entries:

```ts
  MetadataDefinedType: { metadata: MetadataDefinedType; yaml: MetadataDefinedTypeYAML }
  MetadataEventSubscription: { metadata: MetadataEventSubscription; yaml: MetadataEventSubscriptionYAML }
  MetadataSessionParameter: { metadata: MetadataSessionParameter; yaml: MetadataSessionParameterYAML }
  MetadataFunctionalOptionsParameter: { metadata: MetadataFunctionalOptionsParameter; yaml: MetadataFunctionalOptionsParameterYAML }
  MetadataStyleItem: { metadata: MetadataStyleItem; yaml: MetadataStyleItemYAML }
  MetadataCommonAttribute: { metadata: MetadataCommonAttribute; yaml: MetadataCommonAttributeYAML }
  MetadataBot: { metadata: MetadataBot; yaml: MetadataBotYAML }
  MetadataWSReference: { metadata: MetadataWSReference; yaml: MetadataWSReferenceYAML }
  MetadataFilterCriterion: { metadata: MetadataFilterCriterion; yaml: MetadataFilterCriterionYAML }
  MetadataSettingsStorage: { metadata: MetadataSettingsStorage; yaml: MetadataSettingsStorageYAML }
```

- [ ] **Step 3: Add imports and entries to `property/registry.ts`**

Add the same imports using `~/metadata/appliedObjects/.../types`, then add each type to `PropertyTypeRegistry`:

```ts
  MetadataDefinedType: { item: MetadataDefinedType; yaml: MetadataDefinedTypeYAML }
  MetadataEventSubscription: { item: MetadataEventSubscription; yaml: MetadataEventSubscriptionYAML }
  MetadataSessionParameter: { item: MetadataSessionParameter; yaml: MetadataSessionParameterYAML }
  MetadataFunctionalOptionsParameter: { item: MetadataFunctionalOptionsParameter; yaml: MetadataFunctionalOptionsParameterYAML }
  MetadataStyleItem: { item: MetadataStyleItem; yaml: MetadataStyleItemYAML }
  MetadataCommonAttribute: { item: MetadataCommonAttribute; yaml: MetadataCommonAttributeYAML }
  MetadataBot: { item: MetadataBot; yaml: MetadataBotYAML }
  MetadataWSReference: { item: MetadataWSReference; yaml: MetadataWSReferenceYAML }
  MetadataFilterCriterion: { item: MetadataFilterCriterion; yaml: MetadataFilterCriterionYAML }
  MetadataSettingsStorage: { item: MetadataSettingsStorage; yaml: MetadataSettingsStorageYAML }
```

Add matching keys to `PropertyRuleTypeKeys`.

- [ ] **Step 4: Add startup imports**

Modify `appliedObjects/index.ts`:

```ts
import "./metadataDefinedType"
import "./metadataEventSubscription"
import "./metadataSessionParameter"
import "./metadataFunctionalOptionsParameter"
import "./metadataStyleItem"
import "./metadataCommonAttribute"
import "./metadataBot"
import "./metadataWSReference"
import "./metadataFilterCriterion"
import "./metadataSettingsStorage"
```

- [ ] **Step 5: Run typecheck-like test**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected now: fail because object type files do not exist. This confirms registry work will be completed by later object tasks.

Do not commit this task by itself unless all imported object files already exist. If this task is done before object files, keep registry edits staged together with the first object batch.

---

### Task 5: Add Thin TypeDescription Objects

**Files:**
- Create all standard files in:
  - `packages/core/metadata/appliedObjects/metadataDefinedType/`
  - `packages/core/metadata/appliedObjects/metadataSessionParameter/`
- Modify registries from Task 4 for these two objects if not already modified.

- [ ] **Step 1: Write failing tests for `metadataDefinedType`**

Use the `metadataConstant` test shape. Expected fixture model:

```ts
export const full = {
  uuid: "426da0c0-ee05-4af5-a132-c7874136d3bf",
  name: "ОпределяемыйТипВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: {
    type: ["string", "decimal"],
    numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" },
    stringQualifiers: { length: 10, allowedLength: "Variable" },
  },
}
```

Derive the exact minimal object from `minimal.xml`; do not edit XML. The minimal `Type` is empty in XML, so the model should match the existing `TypeDescription` import behavior for an empty node.

- [ ] **Step 2: Write failing tests for `metadataSessionParameter`**

Expected full model:

```ts
export const full = {
  uuid: "23f00a54-467a-4f24-bc62-12b1da877d58",
  name: "ПараметрСеансаВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: {
    type: ["string"],
    stringQualifiers: { length: 10, allowedLength: "Variable" },
  },
}
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataDefinedType metadata/appliedObjects/metadataSessionParameter
```

Expected: fail because rules/types do not exist.

- [ ] **Step 4: Implement `rules.ts` for both objects**

Use this pattern, changing names and XML paths:

```ts
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataDefinedTypeRules = {
  itemType: "MetadataDefinedType",
  itemTypePrefix: "ОпределяемыйТип",
  xmlDir: "DefinedTypes",
  properties: {
    xmlRoot: { type: "XMLRoot", container: "DefinedType", rootAttributes: V8_MDCLASSES_ROOT, forReferenceOnly: true, toYAML: false, fromYAML: false },
    internalInfo: { type: "InternalInfo", xmlParents: [], forReferenceOnly: true, items: [{ name: "DefinedType", category: "DefinedType" }] },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: { type: "string", xmlParents: properties, required: true },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    type: { yaml: "Тип", type: "TypeDescription", xmlParents: properties, useAsShortValueYAML: true, defaultValueXMLRaw: "" },
    objectBelonging: { yaml: "ПринадлежностьОбъекта", type: "SystemEnumeration", typeSE: "ObjectBelonging", defaultValueYAML: "Native", toYAML: false, fromYAML: false, xmlParents: properties },
    extendedConfigurationObject: { yaml: "ОбъектРасширяемойКонфигурации", type: "string", runtimeOnly: true },
  },
} as const satisfies MetadataItemRule
```

For `MetadataSessionParameterRules`, use:

```ts
itemType: "MetadataSessionParameter"
itemTypePrefix: "ПараметрСеанса"
xmlDir: "SessionParameters"
xmlRoot.container: "SessionParameter"
```

and omit `internalInfo`.

- [ ] **Step 5: Implement `types.ts` and `index.ts`**

Use this pattern:

```ts
import { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { InternalInfoItemsXML } from "~/metadata/commonObjects/internalInfo/types"
import { TypeDescriptionXML } from "~/metadata/commonObjects/typeDescription/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataDefinedTypeRules } from "./rules"

export type MetadataDefinedType = MetadataTypeByRule<typeof MetadataDefinedTypeRules>
export type MetadataDefinedTypeYAML = YAMLTypeByRule<typeof MetadataDefinedTypeRules>

export interface MetadataDefinedTypeXML {
  _version: string
  DefinedType: {
    _uuid: string
    InternalInfo?: InternalInfoItemsXML<[{ name: string; category: "DefinedType" }]>
    Properties: {
      Name: string
      Synonym?: I8nTextXML
      Comment?: string
      ObjectBelonging?: SE.ObjectBelonging
      Type?: TypeDescriptionXML
    }
  }
}

registerMetadataItemRule({ propertyType: "MetadataDefinedType", itemRule: MetadataDefinedTypeRules })
```

For `SessionParameterXML`, use `SessionParameter` and no `InternalInfo`.

Create `index.ts`:

```ts
export * from "./types"
```

- [ ] **Step 6: Add YAML fixtures and tests**

For each object create `fullYAML` and `minimalYAML` in fixture TS files. Keep `name` supplied by the applied-object key, so YAML fixture should not include `Имя` unless the existing pattern for this object requires it.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataDefinedType metadata/appliedObjects/metadataSessionParameter
```

Expected: pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataDefinedType packages/core/metadata/appliedObjects/metadataSessionParameter packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить простые типовые applied objects"
```

---

### Task 6: Add Event And Functional Options Parameter Objects

**Files:**
- Create all standard files in:
  - `packages/core/metadata/appliedObjects/metadataEventSubscription/`
  - `packages/core/metadata/appliedObjects/metadataFunctionalOptionsParameter/`
- Modify registries from Task 4 for these two objects if not already modified.

- [ ] **Step 1: Write failing `metadataEventSubscription` tests**

Expected full object:

```ts
export const full = {
  uuid: "f308a688-ea0d-48b8-8e0d-4d2b3a1d8649",
  name: "ПодпискаНаСобытиеВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  source: { type: ["CatalogObject.СправочникПолный"] },
  event: "OnSetNewCode",
  handler: "CommonModule.ОбщийМодульПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойстваПриУстановкеНовогоКода",
}
```

- [ ] **Step 2: Write failing `metadataFunctionalOptionsParameter` tests**

Expected full object:

```ts
export const full = {
  uuid: "b1b060fb-0c54-4f59-aa82-d911f59a8ec1",
  name: "ПараметрФункциональныхОпцийВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  use: [
    "Catalog.СправочникПолный",
    "InformationRegister.РегистрСведений1.Dimension.Измерение1",
  ],
}
```

- [ ] **Step 3: Implement rules**

`MetadataEventSubscriptionRules`:

```ts
source: { yaml: "Источник", type: "TypeDescription", xmlParents: properties }
event: { yaml: "Событие", type: "string", xmlParents: properties }
handler: { yaml: "Обработчик", type: "string", xmlParents: properties }
```

`MetadataFunctionalOptionsParameterRules`:

```ts
use: { yaml: "Использование", type: "MetadataItemLinks", xml: "Use", xmlParents: properties, defaultValueXMLRaw: "" }
```

Both objects use `objectBelonging` hidden from YAML and `extendedConfigurationObject` runtime-only.

- [ ] **Step 4: Implement types and index files**

Use inferred types and XML interfaces with the exact container names:

```ts
EventSubscription: { _uuid: string; Properties: { Name: string; Source: TypeDescriptionXML; Event: string; Handler: string } }
FunctionalOptionsParameter: { _uuid: string; Properties: { Name: string; Use?: MetadataItemLinksXML } }
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataEventSubscription metadata/appliedObjects/metadataFunctionalOptionsParameter
```

Expected: pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataEventSubscription packages/core/metadata/appliedObjects/metadataFunctionalOptionsParameter packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить подписки и параметры опций"
```

---

### Task 7: Add `MetadataStyleItem`

**Files:**
- Create all standard files in `packages/core/metadata/appliedObjects/metadataStyleItem/`
- Modify registries from Task 4 for this object if not already modified.

- [ ] **Step 1: Write failing tests**

Use `font.xml`, `color.xml`, and `border.xml` in `fromXML.test.ts` and `toXML.test.ts`. Expected model for font:

```ts
{
  uuid: "8eb9a3b4-df02-441f-afe4-0a914000ab48",
  name: "ЭлементСтиляШрифтВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: "Font",
  value: {
    type: "Font",
    value: {
      faceName: "Devanagari MT",
      height: 16,
      bold: true,
      italic: true,
      underline: true,
      strikeout: true,
      kind: "Absolute",
      scale: 99,
    },
  },
}
```

Expected model for color:

```ts
{
  uuid: "2ce00ad3-04a3-46cc-a4fd-c8feda134b6b",
  name: "ЭлементСтиляЦвет",
  synonym: { items: { ru: "Элемент стиля цвет" } },
  comment: "",
  type: "Color",
  value: { type: "Color", value: { type: "Absolute", value: "#8A31E2" } },
}
```

Expected model for border:

```ts
{
  uuid: "acbdd14e-1bf2-4950-8b19-77b1fe8ee4ee",
  name: "ЭлементСтиляРамка",
  synonym: { items: { ru: "Элемент стиля рамка" } },
  comment: "",
  type: "Border",
  value: { type: "Border", value: { width: 5, controlBorderType: "Overline" } },
}
```

- [ ] **Step 2: Implement rules**

Use:

```ts
type: { yaml: "Тип", type: "SystemEnumeration", typeSE: "StyleElementType", xmlParents: properties }
value: { yaml: "Значение", type: "StyleItemValue", xml: "Value", xmlParents: properties }
```

Do not set `defaultValueYAML` for `type`.

- [ ] **Step 3: Add sync tests**

`syncToXML.test.ts` must expect:

```ts
expectedFiles: ["ЭлементСтиляШрифтВсеСвойства.xml"]
```

`convertFromXML.test.ts` must compare `Свойства.yaml`; if existing YAML fixture is empty, first update `__fixtures__/sync/data.ts` and `sync/nkdk/.../Свойства.yaml` from the expected export produced by the rules. Do not change XML.

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataStyleItem
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataStyleItem packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить элемент стиля"
```

---

### Task 8: Add `MetadataCommonAttribute`

**Files:**
- Create all standard files in `packages/core/metadata/appliedObjects/metadataCommonAttribute/`
- Modify registries from Task 4 for this object if not already modified.

- [ ] **Step 1: Write failing tests**

Expected full object must include:

```ts
{
  uuid: "afb3d8b6-c846-4eec-8242-2ec9a5dae4eb",
  name: "ОбщийРеквизитВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  passwordMode: true,
  markNegatives: true,
  multiLine: true,
  extendedEdit: true,
  minValue: 4,
  maxValue: 96,
  fillFromFillingValue: false,
  fillValue: { type: "string", value: "Значение" },
  fillChecking: "ShowError",
  choiceFoldersAndItems: "Items",
  quickChoice: "Auto",
  createOnInput: "DontUse",
  choiceHistoryOnInput: "DontUse",
  autoUse: "DontUse",
  dataSeparation: "DontUse",
  separatedDataUse: "Independently",
  usersSeparation: "DontUse",
  authenticationSeparation: "DontUse",
  configurationExtensionsSeparation: "DontUse",
  indexing: "DontIndex",
  fullTextSearch: "DontUse",
  dataHistory: "Use",
}
```

Also include `type`, `format`, `editFormat`, `toolTip`, `mask`, `linkByType`, and `content` values from `full.xml`.

- [ ] **Step 2: Implement rules by composing known property blocks**

Use the same rule types and defaults as the spec:

```ts
fillValue: { yaml: "ЗначениеЗаполнения", type: "MetadataValue", xmlParents: properties, defaultValueXMLRaw: { "_xsi:type": "xs:string" } }
content: { yaml: "Состав", type: "CommonAttributeContent", xml: "Content", xmlParents: properties, defaultValueXMLRaw: "" }
fullTextSearch: { yaml: "ПолнотекстовыйПоиск", type: "SystemEnumeration", typeSE: "UseFullTextSearch", defaultValueXML: "Use", defaultValueYAML: "Use", xmlParents: properties }
```

For `minValue` and `maxValue`, use:

```ts
defaultValueXMLRaw: { "_xsi:nil": true }
```

No YAML default is set for `minValue`, `maxValue`, `fillValue`, `content`, or string references.

- [ ] **Step 3: Add YAML fixture**

Create `fullYAML` with Russian keys from rules and ensure `ЗначениеЗаполнения` round-trips through `MetadataValue`. Use the YAML shape that `MetadataValue` already exports for `{ type: "string", value: "Значение" }`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonAttribute metadata/commonObjects/commonAttributeContent metadata/commonObjects/metadataValue
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataCommonAttribute packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить общий реквизит"
```

---

### Task 9: Add `MetadataBot` And `MetadataWSReference`

**Files:**
- Create all standard files in:
  - `packages/core/metadata/appliedObjects/metadataBot/`
  - `packages/core/metadata/appliedObjects/metadataWSReference/`
- Modify registries from Task 4 for these objects if not already modified.

- [ ] **Step 1: Implement `MetadataBotRules`**

Use:

```ts
predefined: { yaml: "Предопределенный", type: "boolean", defaultValueXML: true, defaultValueYAML: true, xmlParents: properties }
picture: { yaml: "Картинка", type: "Picture", xmlParents: properties, defaultValueXMLRaw: "" }
module: { type: "Module", nkdkPath: "Модуль.bsl", xmlPath: "Ext/Module.bsl" }
```

Sync expected files:

```ts
["БотВсеСвойства.xml", "Ext/Module.bsl"]
```

- [ ] **Step 2: Implement `MetadataWSReferenceRules`**

Use:

```ts
locationURL: { yaml: "URL", xml: "LocationURL", type: "string", xmlParents: properties }
wsDefinition: { type: "Template", nkdkPath: "WSDefinition.xml", xmlPath: "Ext/WSDefinition.xml" }
```

`Template` is used because existing module/template sync copies files byte-for-byte without parsing.

Sync expected files:

```ts
["WSСсылкаВсеСвойства.xml", "Ext/WSDefinition.xml"]
```

- [ ] **Step 3: Add tests and fixtures**

For both objects, use standard tests. For `WSReference`, assert that `convertFromXML` copies `WSDefinition.xml` to the nkdk object directory and `syncToXML` copies it back to `Ext/WSDefinition.xml`.

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataBot metadata/appliedObjects/metadataWSReference
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataBot packages/core/metadata/appliedObjects/metadataWSReference packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить бота и WS-ссылку"
```

---

### Task 10: Add `MetadataFilterCriterion` And `MetadataSettingsStorage`

**Files:**
- Create all standard files in:
  - `packages/core/metadata/appliedObjects/metadataFilterCriterion/`
  - `packages/core/metadata/appliedObjects/metadataSettingsStorage/`
- Modify registries from Task 4 for these objects if not already modified.

- [ ] **Step 1: Implement `MetadataFilterCriterionRules`**

Use:

```ts
type: { yaml: "Тип", type: "TypeDescription", xmlParents: properties, defaultValueXMLRaw: "" }
useStandardCommands: { yaml: "ИспользоватьСтандартныеКоманды", type: "boolean", defaultValueXML: true, defaultValueYAML: true, xmlParents: properties }
content: { yaml: "Состав", type: "MetadataItemLinks", xml: "Content", xmlParents: properties, defaultValueXMLRaw: "" }
defaultForm: { yaml: "ОсновнаяФорма", type: "string", xmlParents: properties, referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" }
auxiliaryForm: { yaml: "ВспомогательнаяФорма", type: "string", xmlParents: properties, referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" }
managerModule: { type: "Module", nkdkPath: "МодульМенеджера.bsl", xmlPath: "Ext/ManagerModule.bsl" }
listPresentation: { yaml: "ПредставлениеСписка", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" }
extendedListPresentation: { yaml: "РасширенноеПредставлениеСписка", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" }
explanation: { yaml: "Пояснение", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" }
commands: { yaml: "Команды", type: "MetadataCommands", xml: "Command", xmlParents: ["ChildObjects"] }
forms: { yaml: "Формы", type: "ChildFormNames", xml: "Form", folderName: "Формы", forReferenceOnly: true, xmlParents: ["ChildObjects"] }
```

Sync expected files:

```ts
[
  "КритерийОтбораВсеСвойства.xml",
  "Ext/ManagerModule.bsl",
  "Commands/Команда1/Ext/CommandModule.bsl",
  "Forms/ФормаСписка.xml",
  "Forms/ФормаСписка/Ext/Form.xml",
  "Forms/ФормаСписка/Ext/Form/Module.bsl",
]
```

- [ ] **Step 2: Implement `MetadataSettingsStorageRules`**

Use:

```ts
defaultSaveForm: { yaml: "ОсновнаяФормаСохранения", type: "string", xmlParents: properties, referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" }
defaultLoadForm: { yaml: "ОсновнаяФормаЗагрузки", type: "string", xmlParents: properties, referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" }
auxiliarySaveForm: { yaml: "ВспомогательнаяФормаСохранения", type: "string", xmlParents: properties, referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" }
auxiliaryLoadForm: { yaml: "ВспомогательнаяФормаЗагрузки", type: "string", xmlParents: properties, referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" }
managerModule: { type: "Module", nkdkPath: "МодульМенеджера.bsl", xmlPath: "Ext/ManagerModule.bsl" }
forms: { yaml: "Формы", type: "ChildFormNames", xml: "Form", folderName: "Формы", forReferenceOnly: true, xmlParents: ["ChildObjects"] }
templates: { yaml: "Шаблоны", type: "ChildTemplateNames", xml: "Template", folderName: "Шаблоны", forReferenceOnly: true, xmlParents: ["ChildObjects"] }
```

Sync expected files:

```ts
[
  "ХранилищеНастроекВсеСвойства.xml",
  "Forms/ФормаЗагрузки.xml",
  "Forms/ФормаЗагрузки/Ext/Form.xml",
  "Forms/ФормаСохранения.xml",
  "Forms/ФормаСохранения/Ext/Form.xml",
  "Templates/Макет.xml",
  "Templates/Макет/Ext/Template.txt",
]
```

Do not expect `Ext/ManagerModule.bsl` because no current fixture contains it.

- [ ] **Step 3: Add tests and fixtures**

Use standard tests. Ensure `convertFromXML.test.ts` checks copied form/template files by reading paths from output directories, following the `metadataConstant` sync assertions style.

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataFilterCriterion metadata/appliedObjects/metadataSettingsStorage
```

Expected: pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataFilterCriterion packages/core/metadata/appliedObjects/metadataSettingsStorage packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить критерий отбора и хранилище настроек"
```

---

### Task 11: Final Verification And Cleanup

**Files:**
- Review: `packages/core/metadata/appliedObjects/index.ts`
- Review: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Review: `packages/core/metadata/orchestration/property/registry.ts`
- Review: all created object directories

- [ ] **Step 1: Registry search**

Run:

```bash
rg -n "MetadataDefinedType|MetadataEventSubscription|MetadataSessionParameter|MetadataFunctionalOptionsParameter|MetadataStyleItem|MetadataCommonAttribute|MetadataBot|MetadataWSReference|MetadataFilterCriterion|MetadataSettingsStorage" packages/core/metadata/orchestration packages/core/metadata/appliedObjects packages/core/metadata/commonObjects
```

Expected: each type appears in its `types.ts`, `rules.ts`, registry entries, tests, and startup import.

- [ ] **Step 2: Check excluded object is untouched**

Run:

```bash
git diff --name-only develop...HEAD | rg "metadataExternalDataSource" || true
```

Expected: no output.

- [ ] **Step 3: Run generated files command**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: success.

- [ ] **Step 4: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 5: Run diff hygiene checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intentional files appear.

- [ ] **Step 6: Final commit if needed**

If verification changes generated files or test fixtures, commit them:

```bash
git add packages/core docs/superpowers
git commit -m "test: :white_check_mark: проверить простые applied objects"
```

Expected: commit created only if there were remaining changes after the feature commits.

---

## Self-Review Notes

- Spec coverage: all included objects from the spec are covered by Tasks 5-10; shared risks are covered by Tasks 2-3; registries and startup imports are covered by Task 4; final verification is covered by Task 11.
- Exclusion coverage: `metadataExternalDataSource` is explicitly checked in Task 11.
- Default policy coverage: each task references `minimal.xml` defaults and keeps empty strings/lists/`xsi:nil` as XML defaults.
- Risk coverage: `CommonAttributeContent`, `StyleItemValue`, opaque `WSDefinition.xml`, child form/template/command sync, and absent `SettingsStorage` manager module are each assigned to a task.
