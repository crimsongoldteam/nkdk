# Singleton Name Suffix Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the XML-reference suffix style for generated form singleton names while keeping the base name derived from the current parent element.

**Architecture:** Add one small orchestration helper for singleton XML name suffixes, wire it through `registerElementAsType`, and register suffix policies in each singleton rule. Reference import stores the matched suffix in a non-enumerable symbol; XML export replaces only the canonical suffix in the generated name.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration APIs, `pnpm --filter '@nakidka/core' exec vitest`.

---

## File Structure

- Create `packages/core/metadata/orchestration/formElement/singletonName.ts`
  - Owns the non-enumerable reference suffix symbol.
  - Extracts a known suffix from `xml._name`.
  - Applies a reference suffix to a generated canonical name.
- Create `packages/core/metadata/orchestration/formElement/singletonName.test.ts`
  - Unit coverage for suffix extraction, non-enumerability, fallback behavior, and base-name preservation.
- Modify `packages/core/metadata/orchestration/formElement/ruleFactory.ts`
  - Extends `registerElementAsType` with optional singleton name style metadata.
  - Stores reference suffixes during XML reference import.
  - Applies reference suffixes during XML export before `exportSingleElementToXML`.
- Modify singleton `rules.ts` files:
  - `packages/core/metadata/forms/elements/extendedTooltip/rules.ts`
  - `packages/core/metadata/forms/elements/contextMenu/rules.ts`
  - `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`
  - `packages/core/metadata/forms/elements/searchControlAddition/rules.ts`
  - `packages/core/metadata/forms/elements/viewStatusAddition/rules.ts`
  - `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`
- Create `packages/core/metadata/forms/elements/singletonNameReference.test.ts`
  - Integration coverage through `importPropertyFromXML` and `exportPropertyToXML`.
  - Covers `ExtendedTooltip`, `ContextMenu`, `SingleSearchStringAddition`, `ViewStatusAddition`, `SingleSearchControlAddition`, `TableAutoCommandBar`, and root `AutoCommandBar`.

## Task 1: Singleton Name Helper

**Files:**
- Create: `packages/core/metadata/orchestration/formElement/singletonName.ts`
- Test: `packages/core/metadata/orchestration/formElement/singletonName.test.ts`

- [ ] **Step 1: Write failing unit tests**

Create `packages/core/metadata/orchestration/formElement/singletonName.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  applyReferenceNameSuffix,
  attachReferenceNameSuffix,
  getReferenceNameSuffix,
  type SingletonNameStyle,
} from "./singletonName"

const extendedTooltipStyle = {
  canonicalSuffix: "РасширеннаяПодсказка",
  referenceSuffixes: ["РасширеннаяПодсказка", "ExtendedTooltip"],
} as const satisfies SingletonNameStyle

describe("singletonName", () => {
  it("stores a known reference suffix as non-enumerable metadata", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СписокExtendedTooltip",
      nameStyle: extendedTooltipStyle,
    })

    expect(getReferenceNameSuffix(reference)).toBe("ExtendedTooltip")
    expect(Object.keys(reference)).toEqual(["itemType"])
  })

  it("replaces only the canonical suffix and keeps the generated base name", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СтарыйРодительExtendedTooltip",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameSuffix({
      generatedName: "НовыйРодительРасширеннаяПодсказка",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(result).toBe("НовыйРодительExtendedTooltip")
  })

  it("keeps the generated name when reference suffix is unknown", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СписокUnknownTooltip",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameSuffix({
      generatedName: "СписокРасширеннаяПодсказка",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(getReferenceNameSuffix(reference)).toBeUndefined()
    expect(result).toBe("СписокРасширеннаяПодсказка")
  })

  it("keeps the generated name when the generated name has no canonical suffix", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СписокExtendedTooltip",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameSuffix({
      generatedName: "СписокДругоеИмя",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(result).toBe("СписокДругоеИмя")
  })
})
```

- [ ] **Step 2: Run the helper tests to verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts
```

Expected: FAIL with a module resolution error for `./singletonName`.

- [ ] **Step 3: Implement the helper**

Create `packages/core/metadata/orchestration/formElement/singletonName.ts`:

```ts
const REFERENCE_NAME_SUFFIX = Symbol("referenceNameSuffix")

export type SingletonNameStyle = {
  canonicalSuffix: string
  referenceSuffixes: readonly string[]
}

type ReferenceNameSuffixCarrier = {
  [REFERENCE_NAME_SUFFIX]?: string
}

export const attachReferenceNameSuffix = <T extends object>(params: {
  model: T
  xmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): T => {
  const { model, xmlName, nameStyle } = params
  const referenceSuffix = getKnownSuffix(xmlName, nameStyle)
  if (referenceSuffix === undefined) return model

  Object.defineProperty(model, REFERENCE_NAME_SUFFIX, {
    value: referenceSuffix,
    enumerable: false,
    configurable: true,
  })

  return model
}

export const getReferenceNameSuffix = (referenceElement: unknown): string | undefined => {
  if (referenceElement === null || referenceElement === undefined || typeof referenceElement !== "object") {
    return undefined
  }

  return (referenceElement as ReferenceNameSuffixCarrier)[REFERENCE_NAME_SUFFIX]
}

export const applyReferenceNameSuffix = (params: {
  generatedName: string
  referenceElement: unknown
  nameStyle: SingletonNameStyle | undefined
}): string => {
  const { generatedName, referenceElement, nameStyle } = params
  if (nameStyle === undefined) return generatedName

  const referenceSuffix = getReferenceNameSuffix(referenceElement)
  if (referenceSuffix === undefined) return generatedName
  if (!generatedName.endsWith(nameStyle.canonicalSuffix)) return generatedName

  const baseName = generatedName.slice(0, generatedName.length - nameStyle.canonicalSuffix.length)
  return `${baseName}${referenceSuffix}`
}

const getKnownSuffix = (
  xmlName: string | undefined,
  nameStyle: SingletonNameStyle | undefined
): string | undefined => {
  if (xmlName === undefined || nameStyle === undefined) return undefined

  return [...nameStyle.referenceSuffixes]
    .sort((left, right) => right.length - left.length)
    .find((suffix) => xmlName.endsWith(suffix))
}
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit helper changes**

Run:

```bash
git add packages/core/metadata/orchestration/formElement/singletonName.ts packages/core/metadata/orchestration/formElement/singletonName.test.ts
git commit -m "feat: :sparkles: добавить стиль имени синглтонов"
```

Expected: commit succeeds.

## Task 2: Wire Helper Through registerElementAsType

**Files:**
- Modify: `packages/core/metadata/orchestration/formElement/ruleFactory.ts:1-149`
- Modify: `packages/core/metadata/orchestration/formElement/fromXML.ts:12-35`
- Test: `packages/core/metadata/orchestration/formElement/singletonName.test.ts`

- [ ] **Step 1: Extend `importSingleElementFromXML` to accept name style**

In `packages/core/metadata/orchestration/formElement/fromXML.ts`, add this import:

```ts
import { attachReferenceNameSuffix, type SingletonNameStyle } from "./singletonName"
```

Update the parameter type for `importSingleElementFromXML`:

```ts
export function importSingleElementFromXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextFromXML
  elementRule: ElementRule
  xml: ElementXML
  nameStyle?: SingletonNameStyle
}): ToMetadata<Rule["itemType"]> | undefined {
```

Update the destructuring and return block:

```ts
  const { context, elementRule, xml, nameStyle } = params
```

```ts
  if (!forReference && isEmptyMetadataItem({ context, rule: elementRule, element: result })) return undefined

  if (forReference) {
    return attachReferenceNameSuffix({
      model: result,
      xmlName: xml._name,
      nameStyle,
    })
  }

  return result
```

- [ ] **Step 2: Wire name style in `ruleFactory.ts`**

In `packages/core/metadata/orchestration/formElement/ruleFactory.ts`, add this import:

```ts
import { applyReferenceNameSuffix, type SingletonNameStyle } from "./singletonName"
```

Update `registerElementAsType` params:

```ts
export const registerElementAsType = <Rule extends ElementRule & { itemType: SingleElementType }>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  nameStyle?: SingletonNameStyle
}): void => {
  const { propertyType, elementRule, toXML, nameStyle } = params
  const itemType = elementRule.itemType

  registerImportFromXML({ propertyType, elementRule, nameStyle })
  registerExportToYAML(propertyType)
  registerimportFromYAML(propertyType, itemType)
  registerExportToXML({ propertyType, toXML, elementRule, nameStyle })
}
```

Replace the `registerImportFromXML` signature and body header:

```ts
const registerImportFromXML = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
  nameStyle?: SingletonNameStyle
}): void => {
  const { propertyType, elementRule, nameStyle } = params
```

Pass `nameStyle` into `importSingleElementFromXML`:

```ts
      return importSingleElementFromXML({
        context,
        elementRule: elementRule,
        xml,
        nameStyle,
      }) as ToMetadata<Rule["itemType"]> | undefined
```

Update the `registerExportToXML` params type:

```ts
const registerExportToXML = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  toXML: ToXMLFn<ToMetadata<Rule["itemType"]>>
  elementRule: Rule
  nameStyle?: SingletonNameStyle
}): void => {
  const { propertyType, toXML, elementRule, nameStyle } = params
```

Update the export function body:

```ts
    const { context, value, referenceMetadata } = params
    const element = value as ToMetadata<Rule["itemType"]> | undefined
    const referenceElement = referenceMetadata as ToMetadata<Rule["itemType"]> | undefined
    const extraParams = toXML({ context, element })
    const name = applyReferenceNameSuffix({
      generatedName: extraParams.name,
      referenceElement,
      nameStyle,
    })

    return exportSingleElementToXML({
      context,
      element,
      rule: elementRule,
      referenceElement,
      additionalParams: {
        ...extraParams,
        name,
      },
    })
```

- [ ] **Step 3: Run helper tests and typecheck-by-test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit orchestration wiring**

Run:

```bash
git add packages/core/metadata/orchestration/formElement/ruleFactory.ts packages/core/metadata/orchestration/formElement/fromXML.ts
git commit -m "feat: :sparkles: учитывать постфикс синглтона из XML"
```

Expected: commit succeeds.

## Task 3: Register Suffix Policies

**Files:**
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/rules.ts:79-88`
- Modify: `packages/core/metadata/forms/elements/contextMenu/rules.ts:36-45`
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/rules.ts:94-104`
- Modify: `packages/core/metadata/forms/elements/searchControlAddition/rules.ts:98-108`
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/rules.ts:59-68`
- Modify: `packages/core/metadata/forms/elements/autoCommandBar/rules.ts:48-66`

- [ ] **Step 1: Add name style to `ExtendedTooltip`**

In `packages/core/metadata/forms/elements/extendedTooltip/rules.ts`, update the `registerElementAsType` call:

```ts
registerElementAsType({
  propertyType: "ExtendedTooltip",
  elementRule: ExtendedTooltipRules,
  nameStyle: {
    canonicalSuffix: "РасширеннаяПодсказка",
    referenceSuffixes: ["РасширеннаяПодсказка", "ExtendedTooltip"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parent = getParentFromContext(context)
    const name = getExtendedTooltipName(parent)
    return { name }
  },
})
```

- [ ] **Step 2: Add name style to `ContextMenu`**

In `packages/core/metadata/forms/elements/contextMenu/rules.ts`, update the `registerElementAsType` call:

```ts
registerElementAsType({
  propertyType: "ContextMenu",
  elementRule: ContextMenuRules,
  nameStyle: {
    canonicalSuffix: "КонтекстноеМеню",
    referenceSuffixes: ["КонтекстноеМеню", "ContextMenu"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parent = getParentFromContext(context)
    const name = getContextMenuName(parent)
    return { name }
  },
})
```

- [ ] **Step 3: Add name style to `SingleSearchStringAddition`**

In `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`, update the `registerElementAsType` call:

```ts
registerElementAsType({
  propertyType: "SingleSearchStringAddition",
  elementRule: SingleSearchStringAdditionRules,
  nameStyle: {
    canonicalSuffix: "СтрокаПоиска",
    referenceSuffixes: ["СтрокаПоиска", "SearchString"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    if (!context.exportToXML.itemsTree) throw new Error("elementContext is not defined")
    const parent = getParentFromContext(context, ["Table"])
    const name = getSearchStringAdditionName(parent)
    return { name }
  },
})
```

- [ ] **Step 4: Add name style to `SingleSearchControlAddition`**

In `packages/core/metadata/forms/elements/searchControlAddition/rules.ts`, update the `registerElementAsType` call:

```ts
registerElementAsType({
  propertyType: "SingleSearchControlAddition",
  elementRule: SingleSearchControlAdditionRules,
  nameStyle: {
    canonicalSuffix: "УправлениеПоиском",
    referenceSuffixes: ["УправлениеПоиском", "SearchControl"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    if (!context.exportToXML.itemsTree) throw new Error("elementContext is not defined")
    const parent = getParentFromContext(context, ["Table"])
    const name = getSearchControlAdditionName(parent)
    return { name }
  },
})
```

- [ ] **Step 5: Add name style to `ViewStatusAddition`**

In `packages/core/metadata/forms/elements/viewStatusAddition/rules.ts`, update the `registerElementAsType` call:

```ts
registerElementAsType({
  propertyType: "ViewStatusAddition",
  elementRule: ViewStatusAdditionRules,
  nameStyle: {
    canonicalSuffix: "СостояниеПросмотра",
    referenceSuffixes: ["СостояниеПросмотра", "ViewStatus"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parent = getParentFromContext(context, ["Table", "PDFDocumentField"])
    const name = getViewStatusAdditionName(parent)
    return { name }
  },
})
```

- [ ] **Step 6: Add name styles to `AutoCommandBar` and `TableAutoCommandBar`**

In `packages/core/metadata/forms/elements/autoCommandBar/rules.ts`, update both `registerElementAsType` calls:

```ts
registerElementAsType({
  propertyType: "AutoCommandBar",
  elementRule: AutoCommandBarRules,
  nameStyle: {
    canonicalSuffix: "ФормаКоманднаяПанель",
    referenceSuffixes: ["ФормаКоманднаяПанель", "FormCommandBar"],
  },
  toXML: () => ({
    id: "-1",
    name: "ФормаКоманднаяПанель",
  }),
})

registerElementAsType({
  propertyType: "TableAutoCommandBar",
  elementRule: AutoCommandBarRules,
  nameStyle: {
    canonicalSuffix: "КоманднаяПанель",
    referenceSuffixes: ["КоманднаяПанель", "CommandBar"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parentTable = getParentFromContext(context, ["Table"])
    const elementName = getAutoCommandBarName(parentTable)
    return { name: elementName }
  },
})
```

- [ ] **Step 7: Run existing singleton tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/extendedTooltip/toXML.test.ts metadata/forms/elements/contextMenu/helper.test.ts metadata/forms/elements/autoCommandBar/fromNKDK.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit suffix policy registrations**

Run:

```bash
git add packages/core/metadata/forms/elements/extendedTooltip/rules.ts packages/core/metadata/forms/elements/contextMenu/rules.ts packages/core/metadata/forms/elements/searchStringAddition/rules.ts packages/core/metadata/forms/elements/searchControlAddition/rules.ts packages/core/metadata/forms/elements/viewStatusAddition/rules.ts packages/core/metadata/forms/elements/autoCommandBar/rules.ts
git commit -m "feat: :sparkles: описать постфиксы form-синглтонов"
```

Expected: commit succeeds.

## Task 4: Integration Tests for XML Reference Suffixes

**Files:**
- Create: `packages/core/metadata/forms/elements/singletonNameReference.test.ts`

- [ ] **Step 1: Write failing integration tests**

Create `packages/core/metadata/forms/elements/singletonNameReference.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML, importPropertyFromXML, type PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"

const withParent = (parent: { itemType: "Button" | "Table" | "PDFDocumentField"; name: string }) => {
  const context = mockContextToXML()
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      itemsTree: [{ ...parent, path: "" }],
    },
  } satisfies ConfigurationContextWithExportToXML
}

const importReference = (rule: PropertyRule, value: unknown): unknown => {
  return importPropertyFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule,
    value,
  })
}

const exportWithReference = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  reference: unknown
}): any => {
  const { context, rule, value, reference } = params
  return exportPropertyToXML({
    context,
    rule,
    value,
    referenceMetadata: reference,
  })
}

describe("singleton XML name suffix from reference", () => {
  it("keeps ExtendedTooltip reference suffix and current parent name", () => {
    const rule = { type: "ExtendedTooltip" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СтарыйExtendedTooltip",
      _id: "9",
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Button", name: "Новый" }),
      rule,
      value: { itemType: "ExtendedTooltip" },
      reference,
    })

    expect(result._name).toBe("НовыйExtendedTooltip")
    expect(Object.keys(reference as object)).toEqual(["id", "itemType"])
  })

  it("keeps ContextMenu reference suffix and current parent name", () => {
    const rule = { type: "ContextMenu" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СтарыйContextMenu",
      _id: "2",
      ChildItems: [],
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Button", name: "Новый" }),
      rule,
      value: { itemType: "ContextMenu", childItems: [] },
      reference,
    })

    expect(result._name).toBe("НовыйContextMenu")
  })

  it("keeps SearchString suffix and nested singleton suffixes", () => {
    const rule = { type: "SingleSearchStringAddition" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокSearchString",
      _id: "13",
      AdditionSource: {
        Item: "Список",
        Type: "SearchStringRepresentation",
      },
      ContextMenu: {
        _name: "СписокSearchStringContextMenu",
        _id: "14",
        ChildItems: [],
      },
      ExtendedTooltip: {
        _name: "СписокSearchStringExtendedTooltip",
        _id: "15",
      },
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: {
        itemType: "SingleSearchStringAddition",
        contextMenu: { itemType: "ContextMenu", childItems: [] },
        extendedTooltip: { itemType: "ExtendedTooltip" },
      },
      reference,
    })

    expect(result._name).toBe("НовыйСписокSearchString")
    expect(result.ContextMenu._name).toBe("НовыйСписокSearchStringContextMenu")
    expect(result.ExtendedTooltip._name).toBe("НовыйСписокSearchStringExtendedTooltip")
  })

  it("keeps ViewStatus reference suffix", () => {
    const rule = { type: "ViewStatusAddition" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокViewStatus",
      _id: "16",
      AdditionSource: {
        Item: "Список",
        Type: "ViewStatusRepresentation",
      },
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: { itemType: "ViewStatusAddition" },
      reference,
    })

    expect(result._name).toBe("НовыйСписокViewStatus")
  })

  it("keeps SearchControl reference suffix", () => {
    const rule = { type: "SingleSearchControlAddition" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокSearchControl",
      _id: "19",
      AdditionSource: {
        Item: "Список",
        Type: "SearchControl",
      },
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: { itemType: "SingleSearchControlAddition", childItems: [] },
      reference,
    })

    expect(result._name).toBe("НовыйСписокSearchControl")
  })

  it("keeps TableAutoCommandBar CommandBar suffix", () => {
    const rule = { type: "TableAutoCommandBar" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокCommandBar",
      _id: "3",
      Autofill: false,
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: { itemType: "AutoCommandBar", autofill: false, childItems: [] },
      reference,
    })

    expect(result._name).toBe("НовыйСписокCommandBar")
  })

  it("keeps root AutoCommandBar FormCommandBar name", () => {
    const rule = { type: "AutoCommandBar" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "FormCommandBar",
      _id: "-1",
    })

    const result = exportWithReference({
      context: mockContextToXML(),
      rule,
      value: { itemType: "AutoCommandBar", childItems: [] },
      reference,
    })

    expect(result._name).toBe("FormCommandBar")
    expect(result._id).toBe("-1")
  })
})
```

- [ ] **Step 2: Run integration tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/singletonNameReference.test.ts
```

Expected before Task 2 and Task 3 implementation: FAIL because exported names use canonical Russian suffixes. Expected after implementation: PASS, 7 tests.

- [ ] **Step 3: Fix any type errors in the new test without changing assertions**

If TypeScript rejects object literals because `PropertyRule` is a union, keep the exact assertions and narrow the test helper by changing only local test types:

```ts
const rule = { type: "ExtendedTooltip" } as PropertyRule
```

Apply that cast only in the new test file and only for `rule` constants.

- [ ] **Step 4: Run integration tests again**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/singletonNameReference.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit integration tests**

Run:

```bash
git add packages/core/metadata/forms/elements/singletonNameReference.test.ts
git commit -m "test: :white_check_mark: покрыть постфиксы синглтонов"
```

Expected: commit succeeds.

## Task 5: Verification and Regression Check

**Files:**
- No source files expected beyond previous tasks.

- [ ] **Step 1: Run focused orchestration and singleton tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts metadata/forms/elements/singletonNameReference.test.ts metadata/forms/elements/extendedTooltip/toXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all packages pass. In the current worktree baseline was 397 `core` test files passed and 9 skipped before implementation; the exact counts may increase after adding tests.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
```

Expected:

```text
 M packages/core/metadata/orchestration/formElement/fromXML.ts
 M packages/core/metadata/orchestration/formElement/ruleFactory.ts
 M packages/core/metadata/forms/elements/autoCommandBar/rules.ts
 M packages/core/metadata/forms/elements/contextMenu/rules.ts
 M packages/core/metadata/forms/elements/extendedTooltip/rules.ts
 M packages/core/metadata/forms/elements/searchControlAddition/rules.ts
 M packages/core/metadata/forms/elements/searchStringAddition/rules.ts
 M packages/core/metadata/forms/elements/viewStatusAddition/rules.ts
?? packages/core/metadata/orchestration/formElement/singletonName.ts
?? packages/core/metadata/orchestration/formElement/singletonName.test.ts
?? packages/core/metadata/forms/elements/singletonNameReference.test.ts
```

If `ruleFactory.ts` and `fromXML.ts` are already committed from earlier tasks, `git status --short` may be clean after Step 2. That is acceptable.

- [ ] **Step 4: Commit any remaining verification changes**

If files remain modified after focused commits, run:

```bash
git add packages/core/metadata/orchestration/formElement/fromXML.ts packages/core/metadata/orchestration/formElement/ruleFactory.ts packages/core/metadata/orchestration/formElement/singletonName.ts packages/core/metadata/orchestration/formElement/singletonName.test.ts packages/core/metadata/forms/elements/autoCommandBar/rules.ts packages/core/metadata/forms/elements/contextMenu/rules.ts packages/core/metadata/forms/elements/extendedTooltip/rules.ts packages/core/metadata/forms/elements/searchControlAddition/rules.ts packages/core/metadata/forms/elements/searchStringAddition/rules.ts packages/core/metadata/forms/elements/viewStatusAddition/rules.ts packages/core/metadata/forms/elements/singletonNameReference.test.ts
git commit -m "fix: :bug: сохранить постфиксы имён синглтонов"
```

Expected: commit succeeds or `git status --short` is already clean because previous task commits captured every change.

## Final Validation

- [ ] `pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts metadata/forms/elements/singletonNameReference.test.ts metadata/forms/elements/extendedTooltip/toXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts` passes.
- [ ] `pnpm test` passes from the worktree root.
- [ ] `git status --short` is clean after the final commit.
