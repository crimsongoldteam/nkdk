# Form Singleton Noncanonical Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve noncanonical XML names of singleton form additions and their nested singleton elements during reference-based XML round-trip.

**Architecture:** Replace the current suffix-only hidden reference carrier with a name mode carrier: `suffix` for standard names relative to the reference owner, `exact` for noncanonical names. Pass the immediate XML owner name through the XML import pipeline so each singleton level decides against its own owner.

**Tech Stack:** TypeScript, Vitest, existing form element orchestration, XML/YAML fixture tests.

---

## File Structure

- Modify `packages/core/metadata/orchestration/formElement/singletonName.ts`
  - Store `{ kind: "suffix"; suffix }` or `{ kind: "exact"; name }` as non-enumerable reference metadata.
  - Keep compatibility helpers `attachReferenceNameSuffix`, `getReferenceNameSuffix`, and `applyReferenceNameSuffix`.
- Modify `packages/core/metadata/orchestration/formElement/singletonName.test.ts`
  - Add unit tests for exact mode and owner-relative standard names.
- Modify `packages/core/metadata/orchestration/property/fn.ts`
  - Add optional `ownerXmlName?: string` to `ImportFromXMLFunction`.
- Modify `packages/core/metadata/orchestration/property/fromXML.ts`
  - Pass the current XML element `_name` as `ownerXmlName` to property type import.
- Modify `packages/core/metadata/orchestration/formElement/fromXML.ts`
  - Accept `ownerXmlName` in `importSingleElementFromXML` and pass it to the singleton-name helper.
- Modify `packages/core/metadata/orchestration/formElement/ruleFactory.ts`
  - Forward `ownerXmlName` from registered singleton property import to `importSingleElementFromXML`.
- Create `packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.xml`
  - Minimal table XML with noncanonical `SearchStringAddition`, `ViewStatusAddition`, `SearchControlAddition`, and nested singleton names.
- Create `packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.ts`
  - TS/YAML expectations for the fixture.
- Create `packages/core/metadata/forms/elements/singletonNonCanonicalNameReference.test.ts`
  - Reference-aware XML tests and YAML no-public-name checks.

## Task 1: Singleton Name Mode

**Files:**
- Modify: `packages/core/metadata/orchestration/formElement/singletonName.ts`
- Modify: `packages/core/metadata/orchestration/formElement/singletonName.test.ts`

- [ ] **Step 1: Add failing unit tests**

In `singletonName.test.ts`, extend the import:

```ts
import {
  applyReferenceNameMode,
  applyReferenceNameSuffix,
  attachReferenceNameMode,
  attachReferenceNameSuffix,
  getReferenceNameMode,
  getReferenceNameSuffix,
  type SingletonNameStyle,
} from "./singletonName"
```

Add these tests inside `describe("singletonName", () => { ... })`:

```ts
it("stores suffix mode for a standard reference name relative to owner", () => {
  const reference = attachReferenceNameMode({
    model: { itemType: "ExtendedTooltip" },
    xmlName: "СтарыйРодительExtendedTooltip",
    ownerXmlName: "СтарыйРодитель",
    nameStyle: extendedTooltipStyle,
  })

  expect(getReferenceNameMode(reference)).toEqual({ kind: "suffix", suffix: "ExtendedTooltip" })
  expect(Object.keys(reference)).toEqual(["itemType"])
})

it("stores exact mode for a noncanonical reference name relative to owner", () => {
  const reference = attachReferenceNameMode({
    model: { itemType: "ExtendedTooltip" },
    xmlName: "ИсторическоеИмяExtendedTooltip",
    ownerXmlName: "СтарыйРодитель",
    nameStyle: extendedTooltipStyle,
  })

  expect(getReferenceNameMode(reference)).toEqual({
    kind: "exact",
    name: "ИсторическоеИмяExtendedTooltip",
  })
  expect(Object.keys(reference)).toEqual(["itemType"])
})

it("applies exact reference name before generated suffix replacement", () => {
  const reference = attachReferenceNameMode({
    model: { itemType: "ExtendedTooltip" },
    xmlName: "ИсторическоеИмяExtendedTooltip",
    ownerXmlName: "СтарыйРодитель",
    nameStyle: extendedTooltipStyle,
  })

  const result = applyReferenceNameMode({
    generatedName: "НовыйРодительРасширеннаяПодсказка",
    referenceElement: reference,
    nameStyle: extendedTooltipStyle,
  })

  expect(result).toBe("ИсторическоеИмяExtendedTooltip")
})

it("keeps owner rename behavior for standard reference names", () => {
  const reference = attachReferenceNameMode({
    model: { itemType: "ExtendedTooltip" },
    xmlName: "СтарыйРодительExtendedTooltip",
    ownerXmlName: "СтарыйРодитель",
    nameStyle: extendedTooltipStyle,
  })

  const result = applyReferenceNameMode({
    generatedName: "НовыйРодительРасширеннаяПодсказка",
    referenceElement: reference,
    nameStyle: extendedTooltipStyle,
  })

  expect(result).toBe("НовыйРодительExtendedTooltip")
})
```

- [ ] **Step 2: Run unit tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts -t "exact mode|owner rename|standard reference name relative"
```

Expected: FAIL because `attachReferenceNameMode`, `getReferenceNameMode`, and `applyReferenceNameMode` do not exist.

- [ ] **Step 3: Implement name mode carrier**

Replace the contents of `singletonName.ts` with:

```ts
const REFERENCE_NAME_MODE = Symbol("referenceNameMode")

export type SingletonNameStyle = {
  canonicalSuffix: string
  referenceSuffixes: readonly string[]
}

export type ReferenceNameMode =
  | { kind: "suffix"; suffix: string }
  | { kind: "exact"; name: string }

type ReferenceNameModeCarrier = {
  [REFERENCE_NAME_MODE]?: ReferenceNameMode
}

export const attachReferenceNameMode = <T extends object>(params: {
  model: T
  xmlName: string | undefined
  ownerXmlName?: string
  nameStyle: SingletonNameStyle | undefined
}): T => {
  const { model, xmlName, ownerXmlName, nameStyle } = params
  const mode = getModeFromXML({ xmlName, ownerXmlName, nameStyle })
  if (mode === undefined) return model

  Object.defineProperty(model, REFERENCE_NAME_MODE, {
    value: mode,
    enumerable: false,
    configurable: true,
  })

  return model
}

export const attachReferenceNameSuffix = <T extends object>(params: {
  model: T
  xmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): T => attachReferenceNameMode(params)

export const getReferenceNameMode = (referenceElement: unknown): ReferenceNameMode | undefined => {
  if (referenceElement === null || referenceElement === undefined || typeof referenceElement !== "object") {
    return undefined
  }

  return (referenceElement as ReferenceNameModeCarrier)[REFERENCE_NAME_MODE]
}

export const getReferenceNameSuffix = (referenceElement: unknown): string | undefined => {
  const mode = getReferenceNameMode(referenceElement)
  return mode?.kind === "suffix" ? mode.suffix : undefined
}

export const applyReferenceNameMode = (params: {
  generatedName: string
  referenceElement: unknown
  nameStyle: SingletonNameStyle | undefined
}): string => {
  const { generatedName, referenceElement, nameStyle } = params
  if (nameStyle === undefined) return generatedName

  const mode = getReferenceNameMode(referenceElement)
  if (mode === undefined) return generatedName
  if (mode.kind === "exact") return mode.name
  if (!generatedName.endsWith(nameStyle.canonicalSuffix)) return generatedName

  const baseName = generatedName.slice(0, generatedName.length - nameStyle.canonicalSuffix.length)
  return `${baseName}${mode.suffix}`
}

export const applyReferenceNameSuffix = applyReferenceNameMode

const getModeFromXML = (params: {
  xmlName: string | undefined
  ownerXmlName: string | undefined
  nameStyle: SingletonNameStyle | undefined
}): ReferenceNameMode | undefined => {
  const { xmlName, ownerXmlName, nameStyle } = params
  if (xmlName === undefined || nameStyle === undefined) return undefined

  const suffixes = [...nameStyle.referenceSuffixes].sort((left, right) => right.length - left.length)

  if (ownerXmlName !== undefined) {
    const standardSuffix = suffixes.find((suffix) => xmlName === `${ownerXmlName}${suffix}`)
    return standardSuffix !== undefined
      ? { kind: "suffix", suffix: standardSuffix }
      : { kind: "exact", name: xmlName }
  }

  const suffix = suffixes.find((candidate) => xmlName.endsWith(candidate))
  return suffix === undefined ? undefined : { kind: "suffix", suffix }
}
```

- [ ] **Step 4: Run unit tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit helper change**

Run:

```bash
git add packages/core/metadata/orchestration/formElement/singletonName.ts packages/core/metadata/orchestration/formElement/singletonName.test.ts
git commit -m "fix: :bug: различать точные имена singleton"
```

## Task 2: Owner XML Name Import Pipeline

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXML.ts`
- Modify: `packages/core/metadata/orchestration/formElement/fromXML.ts`
- Modify: `packages/core/metadata/orchestration/formElement/ruleFactory.ts`
- Modify: `packages/core/metadata/forms/elements/singletonNameReference.test.ts`

- [ ] **Step 1: Add failing pipeline regression test**

In `singletonNameReference.test.ts`, add this test:

```ts
it("keeps exact singleton name when it is noncanonical for the reference owner", () => {
  const rule = { type: "SingleSearchStringAddition" } satisfies PropertyRule
  const reference = importPropertyFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule,
    value: {
      _name: "ТаблицаЭПСтрокаПоиска",
      _id: "13",
      AdditionSource: {
        Item: "Подписи",
        Type: "SearchStringRepresentation",
      },
    },
    ownerXmlName: "Подписи",
  })

  const result = exportWithReference({
    context: withParent({ itemType: "Table", name: "Подписи" }),
    rule,
    value: { itemType: "SingleSearchStringAddition" },
    reference,
  })

  expect(result._name).toBe("ТаблицаЭПСтрокаПоиска")
})
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/singletonNameReference.test.ts -t "noncanonical for the reference owner"
```

Expected: FAIL because `ownerXmlName` is not accepted by `importPropertyFromXML` and not forwarded to singleton import.

- [ ] **Step 3: Extend the import function type**

In `property/fn.ts`, change `ImportFromXMLFunction` to:

```ts
export type ImportFromXMLFunction = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: any,
  ownerXmlName?: string
) => any | undefined
```

- [ ] **Step 4: Pass owner name from property import**

In `property/fromXML.ts`, add a helper near `getXMLValueByKey`:

```ts
const getOwnerXmlName = (xml: unknown): string | undefined => {
  if (xml === null || xml === undefined || typeof xml !== "object") return undefined
  const name = (xml as { _name?: unknown })._name
  return typeof name === "string" ? name : undefined
}
```

Add `ownerXmlName?: string` to `importPropertyFromXML` params:

```ts
export const importPropertyFromXML = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  value: any
  name?: string
  ownerXmlName?: string
}): any => {
  const { context, rule, value, name, ownerXmlName } = params
```

Pass it to type imports:

```ts
const result = typeimportFn(context, rule, value, ownerXmlName)
```

In `importPropertiesFromXML`, pass the current XML owner:

```ts
const ownerXmlName = getOwnerXmlName(xml)

let value =
  shouldImportForReference || currentRule.fromXML !== false
    ? importPropertyFromXML({
        context,
        rule: currentRule,
        value: xmlValue,
        name: key,
        ownerXmlName,
      })
    : undefined
```

- [ ] **Step 5: Forward owner name into singleton import**

In `formElement/fromXML.ts`, change the function signature:

```ts
export function importSingleElementFromXML<Rule extends ElementRule>(params: {
  context: ConfigurationContextFromXML
  elementRule: ElementRule
  xml: ElementXML
  nameStyle?: SingletonNameStyle
  ownerXmlName?: string
}): ToMetadata<Rule["itemType"]> | undefined {
  const { context, elementRule, xml, nameStyle, ownerXmlName } = params
```

Change the reference attach call:

```ts
return attachReferenceNameMode({
  model: result,
  xmlName: xml._name,
  ownerXmlName,
  nameStyle,
})
```

Update the import from `singletonName` to use `attachReferenceNameMode`.

In `formElement/ruleFactory.ts`, update the registered import function:

```ts
(
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: ElementXML,
  ownerXmlName?: string
): ToMetadata<Rule["itemType"]> | undefined => {
  return importSingleElementFromXML({
    context,
    elementRule: elementRule,
    xml,
    nameStyle,
    ownerXmlName,
  }) as ToMetadata<Rule["itemType"]> | undefined
}
```

Update the export import from `singletonName`:

```ts
import { applyReferenceNameMode, type SingletonNameStyle } from "./singletonName"
```

and call:

```ts
const name = applyReferenceNameMode({
  generatedName: extraParams.name,
  referenceElement,
  nameStyle,
})
```

- [ ] **Step 6: Run pipeline tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/singletonNameReference.test.ts metadata/orchestration/formElement/singletonName.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit pipeline change**

Run:

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/property/fromXML.ts packages/core/metadata/orchestration/formElement/fromXML.ts packages/core/metadata/orchestration/formElement/ruleFactory.ts packages/core/metadata/forms/elements/singletonNameReference.test.ts
git commit -m "fix: :bug: передать владельца singleton из XML"
```

## Task 3: Noncanonical Table Fixture

**Files:**
- Create: `packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.xml`
- Create: `packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.ts`
- Create: `packages/core/metadata/forms/elements/singletonNonCanonicalNameReference.test.ts`

- [ ] **Step 1: Add the XML fixture**

Create `packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.xml`:

```xml
<Table name="Подписи" id="1">
	<DataPath>Подписи</DataPath>
	<SearchStringAddition name="ТаблицаЭПСтрокаПоиска" id="2">
		<AdditionSource>
			<Item>Подписи</Item>
			<Type>SearchStringRepresentation</Type>
		</AdditionSource>
		<ContextMenu name="ТаблицаЭПСтрокаПоискаКонтекстноеМеню" id="3"/>
		<ExtendedTooltip name="ТаблицаЭПСтрокаПоискаРасширеннаяПодсказка" id="4"/>
	</SearchStringAddition>
	<ViewStatusAddition name="ТаблицаЭПСостояниеПросмотра" id="5">
		<AdditionSource>
			<Item>Подписи</Item>
			<Type>ViewStatusRepresentation</Type>
		</AdditionSource>
		<HorizontalLocation>Left</HorizontalLocation>
		<ContextMenu name="ТаблицаЭПСостояниеПросмотраКонтекстноеМеню" id="6"/>
		<ExtendedTooltip name="ТаблицаЭПСостояниеПросмотраРасширеннаяПодсказка" id="7"/>
	</ViewStatusAddition>
	<SearchControlAddition name="ТаблицаЭПУправлениеПоиском" id="8">
		<AdditionSource>
			<Item>Подписи</Item>
			<Type>SearchControl</Type>
		</AdditionSource>
		<ContextMenu name="ТаблицаЭПУправлениеПоискомКонтекстноеМеню" id="9"/>
		<ExtendedTooltip name="ТаблицаЭПУправлениеПоискомРасширеннаяПодсказка" id="10"/>
	</SearchControlAddition>
</Table>
```

- [ ] **Step 2: Add TS and YAML expectations**

Create `packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.ts`:

```ts
import type { Table, TablePartialYAML } from "../types"

export const nonCanonicalSingletonNames = {
  itemType: "Table",
  name: "Подписи",
  dataPath: "Подписи",
  searchStringRepresentation: {
    itemType: "SingleSearchStringAddition",
    contextMenu: { itemType: "ContextMenu", childItems: [] },
    extendedTooltip: { itemType: "ExtendedTooltip" },
  },
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
    horizontalAlign: "Left",
    contextMenu: { itemType: "ContextMenu", childItems: [] },
    extendedTooltip: { itemType: "ExtendedTooltip" },
  },
  searchControl: {
    itemType: "SingleSearchControlAddition",
    childItems: [],
    contextMenu: { itemType: "ContextMenu", childItems: [] },
    extendedTooltip: { itemType: "ExtendedTooltip" },
  },
} satisfies Table

export const nonCanonicalSingletonNamesYAML = {
  ПутьКДанным: "Подписи",
  ОтображениеСтрокиПоиска: {
    КонтекстноеМеню: {},
    РасширеннаяПодсказка: {},
  },
  ОтображениеСостоянияПросмотра: {
    ГоризонтальноеПоложение: "Лево",
    КонтекстноеМеню: {},
    РасширеннаяПодсказка: {},
  },
  УправлениеПоиском: {
    КонтекстноеМеню: {},
    РасширеннаяПодсказка: {},
  },
} satisfies TablePartialYAML
```

- [ ] **Step 3: Add reference-aware XML tests**

Create `packages/core/metadata/forms/elements/singletonNonCanonicalNameReference.test.ts`:

```ts
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { exportElementToXML, importElementFromXML, type ElementXML } from "~/metadata/orchestration"
import { exportElementToPartialYAML } from "~/metadata/orchestration/formElement/toYAML"
import { mockContext, mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/exporter"
import {
  nonCanonicalSingletonNames,
  nonCanonicalSingletonNamesYAML,
} from "./table/__fixtures__/nonCanonicalSingletonNames"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "table/__fixtures__")

const readTableXML = () =>
  readAndParseXMLFile<{ Table: ElementXML }>("nonCanonicalSingletonNames.xml", fixturesDir).Table

describe("singleton noncanonical XML names with reference", () => {
  it("imports table without public singleton names", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "Table",
      xml: readTableXML(),
    })

    expect(result).toEqual(nonCanonicalSingletonNames)
  })

  it("exports exact noncanonical names from reference", () => {
    const xml = readTableXML()
    const reference = importElementFromXML({
      context: mockContextFromXML({ forReference: true }),
      itemType: "Table",
      xml,
    })

    const result = exportElementToXML({
      context: mockContextToXML(),
      element: nonCanonicalSingletonNames,
      referenceElement: reference,
    })

    const xmlString = xmlExport({ Table: result }, false)
    expect(xmlString).toEqual(readXMLFileAsString("nonCanonicalSingletonNames.xml", fixturesDir).trimEnd())
  })

  it("exports YAML without public singleton Имя fields", () => {
    const result = exportElementToPartialYAML({ context: mockContext, element: nonCanonicalSingletonNames })

    expect(result).toEqual(nonCanonicalSingletonNamesYAML)
    expect(JSON.stringify(result)).not.toContain("\"Имя\"")
    expect(JSON.stringify(result)).not.toContain("ТаблицаЭП")
  })
})
```

- [ ] **Step 4: Run fixture tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/singletonNonCanonicalNameReference.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit fixture and tests**

Run:

```bash
git add packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.xml packages/core/metadata/forms/elements/table/__fixtures__/nonCanonicalSingletonNames.ts packages/core/metadata/forms/elements/singletonNonCanonicalNameReference.test.ts
git commit -m "test: :white_check_mark: покрыть нестандартные singleton-имена"
```

## Task 4: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Generate Langium files in a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/formElement/singletonName.test.ts metadata/forms/elements/singletonNameReference.test.ts metadata/forms/elements/singletonNonCanonicalNameReference.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS across all packages.
