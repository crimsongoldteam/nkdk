# Form Input And Parameter Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `InputField.TypeDomainEnabled` and empty form parameter `<Type/>` nodes through XML/YAML/model round-trips.

**Architecture:** `TypeDomainEnabled` is a regular `InputField` property because it has a YAML name, XML node, model field, and enterprise field. Empty form parameter type is represented by an absent `FormParameter.type` in the model, while XML export still emits an empty `<Type/>` node to preserve the 1C XML shape.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser` through project XML helpers, Nakidka metadata `rules.ts` property registry.

---

## File Structure

- `packages/core/metadata/forms/elements/inputField/rules.ts` owns the `InputField` and `TableInputField` property definitions.
- `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts` owns the model, YAML, and enterprise all-fields fixtures for input fields.
- `packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml` and `fullTable.xml` own XML all-fields fixtures for `InputField` and `TableInputField`.
- `packages/core/metadata/forms/commonObjects/formParameter/__fixtures__/` will own module-local XML and TS fixtures for form parameters.
- `packages/core/metadata/forms/commonObjects/formParameter/types.ts` defines the model/XML/YAML surface for form parameters.
- `packages/core/metadata/forms/commonObjects/formParameter/fromXML.ts`, `toXML.ts`, `fromYAML.ts`, and `toYAML.ts` convert form parameters.
- `packages/core/metadata/forms/commonObjects/formParameter/fromXML.test.ts` and `toXML.test.ts` verify XML import/export, using local `__fixtures__`.
- `packages/core/tests/fixtures/formParameter/` will be removed for this module after all references are migrated.

## Task 1: Preserve `InputField.TypeDomainEnabled`

**Files:**
- Modify: `packages/core/metadata/forms/elements/inputField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`

- [ ] **Step 1: Add the rule property**

In `packages/core/metadata/forms/elements/inputField/rules.ts`, add `typeDomainEnabled` next to `listChoiceMode`:

```typescript
    listChoiceMode: { yaml: "РежимВыбораИзСписка", type: "boolean" },
    typeDomainEnabled: {
      yaml: "РазрешитьСоставнойТип",
      type: "boolean",
      defaultValueYAML: true,
    },
```

Remove the old commented-out `typeDomainEnabled` block near `textEdit`.

- [ ] **Step 2: Add model/YAML/enterprise expectations**

In `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`, update the all-fields fixtures:

```typescript
  listChoiceMode: true,
  typeDomainEnabled: false,
  markNegatives: true,
```

```typescript
  РежимПароля: "Истина",
  РазрешитьСоставнойТип: "Ложь",
  СвязиПараметровВыбора: "РеквизитПодвала(РеквизитПодвала)",
```

```typescript
  InputHint: "Подсказка ввода",
  ListChoiceMode: true,
  TypeDomainEnabled: false,
  MarkNegatives: true,
```

- [ ] **Step 3: Add XML expectations**

In `packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml`, add:

```xml
	<ListChoiceMode>true</ListChoiceMode>
	<TypeDomainEnabled>false</TypeDomainEnabled>
	<MultipleValuesFont ref="style:NormalTextFont" kind="StyleItem"/>
```

In `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`, add before the closing tag:

```xml
	<Width>200</Width>
	<Wrap>false</Wrap>
	<TypeDomainEnabled>false</TypeDomainEnabled>
</TableInputField>
```

Keep the existing no-final-newline convention in `fullTable.xml`.

- [ ] **Step 4: Run focused form element tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "InputField|TableInputField"
```

Expected: selected `InputField` and `TableInputField` tests pass. If the pattern selects zero tests, run the same files without `-t` and confirm all pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/forms/elements/inputField/rules.ts \
  packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts \
  packages/core/metadata/forms/elements/inputField/__fixtures__/full.xml \
  packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml
git commit -m "fix: :bug: сохранить TypeDomainEnabled поля ввода"
```

## Task 2: Move FormParameter Fixtures To Module

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/formParameter/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/commonObjects/formParameter/__fixtures__/full.xml`
- Create: `packages/core/metadata/forms/commonObjects/formParameter/__fixtures__/withoutType.xml`
- Delete: `packages/core/tests/fixtures/formParameter/data.ts`
- Delete: `packages/core/tests/fixtures/formParameter/full.xml`
- Delete: `packages/core/tests/fixtures/formParameter/withoutType.xml`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/toXML.test.ts`

- [ ] **Step 1: Create local TS fixture**

Create `packages/core/metadata/forms/commonObjects/formParameter/__fixtures__/data.ts`:

```typescript
import type { FormParameters, FormParametersYAML } from "../types"

export const fullFormParameters: FormParameters = [
  {
    name: "КлючевойПараметр",
    type: {
      type: ["boolean"],
    },
    keyParameter: true,
  },
  {
    name: "Параметр",
    type: {
      type: ["boolean"],
    },
  },
]

export const fullFormParametersYAML: FormParametersYAML = {
  КлючевойПараметр: {
    Тип: "Булево",
    Ключевой: true,
  },
  Параметр: {
    Тип: "Булево",
  },
}

export const withoutTypeFormParameters: FormParameters = [
  {
    name: "ПараметрБезТипа",
  },
]
```

- [ ] **Step 2: Create local XML fixtures**

Create `packages/core/metadata/forms/commonObjects/formParameter/__fixtures__/full.xml`:

```xml
<Parameter name="КлючевойПараметр">
	<Type>
		<v8:Type>xs:boolean</v8:Type>
	</Type>
	<KeyParameter>true</KeyParameter>
</Parameter>
<Parameter name="Параметр">
	<Type>
		<v8:Type>xs:boolean</v8:Type>
	</Type>
</Parameter>
```

Create `packages/core/metadata/forms/commonObjects/formParameter/__fixtures__/withoutType.xml`:

```xml
<Parameter name="ПараметрБезТипа">
	<Type/>
</Parameter>
```

- [ ] **Step 3: Point XML import test at local fixtures**

Modify `packages/core/metadata/forms/commonObjects/formParameter/fromXML.test.ts`:

```typescript
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { fullFormParameters, withoutTypeFormParameters } from "./__fixtures__/data"
import { importFormParametersFromXML } from "./fromXML"
import { FormParametersXML } from "./types"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = resolve(__dirname, "__fixtures__")

describe("importFormParametersFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFormParametersFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import form parameters correctly", () => {
    const xmlData = readAndParseXMLFile<{ Parameter: FormParametersXML }>("full.xml", fixturesDir)
    const result = importFormParametersFromXML(mockContextFromXML(), mockRule, xmlData)
    expect(result).toEqual(fullFormParameters)
  })

  it("should import form parameter without type", () => {
    const xmlData = readAndParseXMLFile<{ Parameter: FormParametersXML }>("withoutType.xml", fixturesDir)
    const result = importFormParametersFromXML(mockContextFromXML(), mockRule, xmlData)
    expect(result).toEqual(withoutTypeFormParameters)
  })
})
```

- [ ] **Step 4: Point XML export test at local fixtures**

Modify `packages/core/metadata/forms/commonObjects/formParameter/toXML.test.ts`:

```typescript
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { fullFormParameters, withoutTypeFormParameters } from "./__fixtures__/data"
import { exportFormParametersToXML } from "./toXML"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = resolve(__dirname, "__fixtures__")

describe("exportFormParametersToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportFormParametersToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export form parameters correctly", () => {
    const expectedResult = readXMLFileAsString("full.xml", fixturesDir)
    const xmlData = exportFormParametersToXML(mockContext, mockRule, fullFormParameters)
    const result = xmlExport(xmlData!, false)
    expect(result).toEqual(expectedResult.trim())
  })

  it("should export form parameter without type", () => {
    const expectedResult = readXMLFileAsString("withoutType.xml", fixturesDir)
    const xmlData = exportFormParametersToXML(mockContext, mockRule, withoutTypeFormParameters)
    const result = xmlExport(xmlData!, false)
    expect(result).toEqual(expectedResult.trim())
  })
})
```

- [ ] **Step 5: Delete old shared fixtures**

Delete these files after the tests import from local fixtures:

```text
packages/core/tests/fixtures/formParameter/data.ts
packages/core/tests/fixtures/formParameter/full.xml
packages/core/tests/fixtures/formParameter/withoutType.xml
```

- [ ] **Step 6: Run failing tests before implementation**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formParameter/fromXML.test.ts metadata/forms/commonObjects/formParameter/toXML.test.ts
```

Expected before Task 3: the new `without type` tests fail because the model currently treats `type` as mandatory and XML export emits `<Parameter name="ПараметрБезТипа"/>` instead of preserving `<Type/>`.

## Task 3: Support Empty FormParameter Type

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formParameter/toYAML.ts`

- [ ] **Step 1: Make type optional in public shapes**

Modify `packages/core/metadata/forms/commonObjects/formParameter/types.ts`:

```typescript
export interface FormParameter {
  name: string
  type?: TypeDescription
  keyParameter?: boolean
}
```

```typescript
export interface FormParameterXML {
  _name: string
  Type?: TypeDescriptionXML
  KeyParameter?: boolean
}
```

```typescript
export const FormParameterJSONSchema = Type.Object({
  Тип: Type.Optional(TypeDescriptionJSONSchema),
  Ключевой: Type.Optional(Type.Boolean()),
})
```

- [ ] **Step 2: Mark the XML default shape**

Modify `packages/core/metadata/forms/commonObjects/formParameter/rules.ts`:

```typescript
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      useAsShortValueYAML: true,
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 3: Import XML without writing `type: undefined`**

Modify `packages/core/metadata/forms/commonObjects/formParameter/fromXML.ts`:

```typescript
const importFormParameterFromXML = (params: {
  context: ConfigurationContextFromXML
  xml: FormParameterXML
}): FormParameter => {
  const { context, xml } = params
  const type = importTypeDescriptionFromXML(context, undefined, xml.Type)
  const result: FormParameter = {
    name: xml._name,
  }

  if (type !== undefined) {
    result.type = type
  }

  if (xml.KeyParameter !== undefined) {
    result.keyParameter = xml.KeyParameter
  }

  return result
}
```

- [ ] **Step 4: Export XML with an empty `Type` node**

Modify `packages/core/metadata/forms/commonObjects/formParameter/toXML.ts`:

```typescript
const exportFormParameterToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameter: FormParameter
): FormParameterXML => {
  const result: FormParameterXML = {
    _name: parameter.name,
    Type: exportTypeDescriptionToXML(context, undefined, parameter.type) ?? {},
  }

  if (parameter.keyParameter !== undefined) {
    result.KeyParameter = parameter.keyParameter
  }

  return result
}
```

- [ ] **Step 5: Keep YAML symmetric for missing type**

Modify `packages/core/metadata/forms/commonObjects/formParameter/fromYAML.ts`:

```typescript
  return Object.entries(data).map(([name, parameter]) => {
    const type = importTypeDescriptionFromYAML(context, undefined, parameter.Тип)
    const result: FormParameter = {
      name,
    }

    if (type !== undefined) {
      result.type = type
    }

    if (parameter.Ключевой !== undefined) {
      result.keyParameter = parameter.Ключевой
    }

    return result
  })
```

Modify `packages/core/metadata/forms/commonObjects/formParameter/toYAML.ts`:

```typescript
  for (const parameter of parameters) {
    const enterpriseParameter: FormParameterYAML = {}
    const type = exportTypeDescriptionToYAML(context, undefined, parameter.type)

    if (type !== undefined) {
      enterpriseParameter.Тип = type
    }

    if (parameter.keyParameter !== undefined) {
      enterpriseParameter.Ключевой = parameter.keyParameter
    }

    result[parameter.name] = enterpriseParameter
  }
```

- [ ] **Step 6: Run focused formParameter tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formParameter/fromXML.test.ts metadata/forms/commonObjects/formParameter/toXML.test.ts
```

Expected: `2` test files pass, `6` tests pass.

- [ ] **Step 7: Run TypeScript check for touched package**

Run:

```bash
pnpm --filter '@nakidka/core' exec tsc --noEmit
```

Expected: command exits with code `0`. If unrelated pre-existing type failures appear, capture the first failure and stop for review.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/formParameter \
  packages/core/tests/fixtures/formParameter/data.ts \
  packages/core/tests/fixtures/formParameter/full.xml \
  packages/core/tests/fixtures/formParameter/withoutType.xml
git commit -m "fix: :bug: сохранить пустой тип параметра формы"
```

## Task 4: Final Verification

**Files:**
- No additional file edits expected.

- [ ] **Step 1: Run combined focused test set**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formParameter/fromXML.test.ts metadata/forms/commonObjects/formParameter/toXML.test.ts metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts
```

Expected: all selected files pass.

- [ ] **Step 2: Inspect remaining changes**

Run:

```bash
git status --short
```

Expected: only intentional committed work remains clean. If the branch still has uncommitted files, inspect them and either commit them with the task they belong to or stop.

- [ ] **Step 3: Do not run full project test in this plan**

Full `pnpm test` is intentionally left for the user because the round-trip workflow requested narrow verification only.
