# ERP Explicit Empty Values Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить два оставшихся `erp` YAML round-trip diff: пустой `FormChoiceListDesTimeValue` в `ChoiceParameters` и пустой `dcscor:value xsi:type="xs:string"` в DCS SettingsParameterValue.

**Architecture:** Сохраняем смысл пустых XML-форм в YAML явно. Для `ChoiceParameters` верхний `formChoiceListDesTimeValue` получает такой же маркер `Тип: ЗначениеСпискаВыбора`, как элементы `FixedArray`; для DCS пустой `xs:string` импортируется как `{ type: "string", value: "" }`, используя уже существующий YAML-договор `Тип: Строка`.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core`, XML/YAML metadata orchestration, `pnpm`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
  - Обновляет ожидаемый YAML для верхних `formChoiceListDesTimeValue`.
  - Добавляет модель и YAML для пустого верхнего `FormChoiceListDesTimeValue`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`
  - Проверяет явный `Тип: ЗначениеСпискаВыбора` при экспорте верхних `formChoiceListDesTimeValue`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
  - Проверяет импорт явной пустой формы и сохранение старого смысла пустого объекта.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.ts`
  - Добавляет явный экспорт верхнего `formChoiceListDesTimeValue`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts`
  - Добавляет распознавание `Тип: ЗначениеСпискаВыбора`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/types.ts`
  - Расширяет JSON Schema/YAML type для явного `ЗначениеСпискаВыбора`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.test.ts`
  - Добавляет XML -> модель -> YAML -> модель -> XML сценарий для пустого `FormChoiceListDesTimeValue` без новых XML-фикстур.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts`
  - Добавляет проверку импорта пустого `xs:string` как пустой строки и отличие от отсутствующего `dcscor:value`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
  - Учит DCS primitive XML import сохранять присутствующий пустой `xs:string`.

Do not modify existing XML fixtures.

---

### Task 1: ChoiceParameters Explicit FormChoiceList YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/types.ts`

- [ ] **Step 1: Update failing YAML expectations for existing form choice parameters**

In `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`, change the three existing YAML constants so every top-level `formChoiceListDesTimeValue` includes `Тип: "ЗначениеСпискаВыбора"`.

Replace:

```ts
export const formBooleanChoiceParametersYAML: ChoiceParametersYAML = {
  БезПроизводныхЗначений: {
    Значение: "Истина",
  },
}
```

with:

```ts
export const formBooleanChoiceParametersYAML: ChoiceParametersYAML = {
  БезПроизводныхЗначений: {
    Тип: "ЗначениеСпискаВыбора",
    Значение: "Истина",
  },
}
```

Replace:

```ts
export const formEnumChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипСчета": {
    Значение: "Перечисление.ТипыСчетов.НераспределеннаяПрибыль",
  },
}
```

with:

```ts
export const formEnumChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипСчета": {
    Тип: "ЗначениеСпискаВыбора",
    Значение: "Перечисление.ТипыСчетов.НераспределеннаяПрибыль",
  },
}
```

Replace:

```ts
export const formChoiceFixedArrayChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипДоговора": {
    Значение: [
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СПоставщиком",
      },
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СКомитентом",
      },
    ],
  },
}
```

with:

```ts
export const formChoiceFixedArrayChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипДоговора": {
    Тип: "ЗначениеСпискаВыбора",
    Значение: [
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СПоставщиком",
      },
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СКомитентом",
      },
    ],
  },
}
```

- [ ] **Step 2: Add empty top-level FormChoiceList fixtures**

In the same file, after `formEnumChoiceParametersYAML`, add:

```ts
export const emptyFormChoiceParameter: ChoiceParameters = [
  {
    name: "ВыборДействующихМаршрутныхКарт",
    value: {
      type: "formChoiceListDesTimeValue",
    },
  },
]

export const emptyFormChoiceParametersYAML: ChoiceParametersYAML = {
  ВыборДействующихМаршрутныхКарт: {
    Тип: "ЗначениеСпискаВыбора",
  },
}
```

- [ ] **Step 3: Wire the new fixtures into YAML tests**

In `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`, add `emptyFormChoiceParameter` and `emptyFormChoiceParametersYAML` to the import list from `__fixtures__/data`.

Add this test after the form enum export test:

```ts
  it("exports empty top-level form choice value with explicit type", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, emptyFormChoiceParameter)

    expect(result).toEqual(emptyFormChoiceParametersYAML)
  })
```

In `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`, add the same two imports and add this test after the form enum import test:

```ts
  it("imports empty explicit top-level form choice value", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, emptyFormChoiceParametersYAML)

    expect(result).toEqual(emptyFormChoiceParameter)
  })
```

Keep the existing test named `imports empty object choice parameter as parameter without value`; it proves `{}` remains parameter-without-value.

- [ ] **Step 4: Run choiceParameters YAML tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- сhoiceParameters/toYAML.test.ts сhoiceParameters/fromYAML.test.ts
```

Expected: FAIL. The export tests should show missing `Тип: "ЗначениеСпискаВыбора"` for top-level form choice values; the new import test should return a non-form-choice value or throw before implementation.

- [ ] **Step 5: Implement explicit top-level FormChoiceList export**

In `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.ts`, replace the imports:

```ts
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import { ChoiceParameters, ChoiceParametersYAML } from "./types"
```

with:

```ts
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import { exportFormChoiceListToYAML } from "../metadataValue/formChoiceList/toYAML"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersYAML } from "./types"
```

Then add this helper above `exportChoiceParametersToYAML`:

```ts
const exportChoiceParameterValueToYAML = (
  context: ConfigurationContext,
  param: ChoiceParameter
): ChoiceParametersYAML[string] => {
  if (param.value?.type === "formChoiceListDesTimeValue") {
    return {
      Тип: "ЗначениеСпискаВыбора",
      ...exportFormChoiceListToYAML(context, param.value),
    } as ChoiceParametersYAML[string]
  }

  return exportMetadataValueToYAML(context, undefined, param.value) as ChoiceParametersYAML[string]
}
```

Replace the `Object.fromEntries` body:

```ts
  return Object.fromEntries(
    data.map((param) => [param.name, exportMetadataValueToYAML(context, undefined, param.value)])
  )
```

with:

```ts
  return Object.fromEntries(data.map((param) => [param.name, exportChoiceParameterValueToYAML(context, param)]))
```

- [ ] **Step 6: Implement explicit top-level FormChoiceList import**

In `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts`, replace the imports:

```ts
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersYAML } from "./types"
```

with:

```ts
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import { importFormChoiceListFromYAML } from "../metadataValue/formChoiceList/fromYAML"
import type { MetadataFormChoiceListValueYAML } from "../metadataValue/types"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersYAML } from "./types"
```

Add these helpers above `export const importChoiceParametersFromYAML`:

```ts
const isExplicitFormChoiceListValueYAML = (value: unknown): value is MetadataFormChoiceListValueYAML & {
  Тип: "ЗначениеСпискаВыбора"
} =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  (value as Record<string, unknown>).Тип === "ЗначениеСпискаВыбора"

const importChoiceParameterValueFromYAML = (
  context: ConfigurationContext,
  value: Exclude<ChoiceParametersYAML[string], null | undefined>
): ChoiceParameter["value"] => {
  if (isExplicitFormChoiceListValueYAML(value)) {
    const { Тип: _type, ...formChoiceListValue } = value
    return importFormChoiceListFromYAML(context, formChoiceListValue as MetadataFormChoiceListValueYAML)
  }

  return importMetadataValueFromYAML(context, undefined, value as never)
}
```

Then replace:

```ts
    const value = importMetadataValueFromYAML(
      context,
      undefined,
      markedValue as Exclude<ChoiceParametersYAML[string], null>
    )
```

with:

```ts
    const value =
      markedValue === undefined
        ? undefined
        : importChoiceParameterValueFromYAML(
            context,
            markedValue as Exclude<ChoiceParametersYAML[string], null | undefined>
          )
```

- [ ] **Step 7: Extend ChoiceParameters YAML schema and type**

In `packages/core/metadata/commonObjects/сhoiceParameters/types.ts`, replace:

```ts
import { MetadataValue, MetadataValueJSONSchema, MetadataValueXML, MetadataValueYAML } from "../metadataValue/types"
```

with:

```ts
import {
  MetadataExplicitFormChoiceListValueYAMLJSONSchema,
  MetadataValue,
  MetadataValueJSONSchema,
  MetadataValueXML,
  MetadataValueYAML,
} from "../metadataValue/types"
```

Replace:

```ts
export const ChoiceParametersJSONSchema = Type.Record(
  Type.String(),
  Type.Union([MetadataValueJSONSchema, Type.Object({}, { additionalProperties: false }), Type.Undefined(), Type.Null()])
)

export type ChoiceParametersYAML = Record<string, MetadataValueYAML | Record<string, never> | null | undefined>
```

with:

```ts
export const ChoiceParametersJSONSchema = Type.Record(
  Type.String(),
  Type.Union([
    MetadataExplicitFormChoiceListValueYAMLJSONSchema,
    MetadataValueJSONSchema,
    Type.Object({}, { additionalProperties: false }),
    Type.Undefined(),
    Type.Null(),
  ])
)

export type ChoiceParametersYAML = Record<
  string,
  | MetadataValueYAML
  | {
      Тип: "ЗначениеСпискаВыбора"
      Представление?: unknown
      Значение?: unknown
    }
  | Record<string, never>
  | null
  | undefined
>
```

- [ ] **Step 8: Run choiceParameters YAML tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- сhoiceParameters/toYAML.test.ts сhoiceParameters/fromYAML.test.ts
```

Expected: PASS for both files.

- [ ] **Step 9: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/toYAML.ts packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.ts packages/core/metadata/commonObjects/сhoiceParameters/types.ts
git commit -m "fix: :bug: сохранить FormChoiceList в ChoiceParameters"
```

---

### Task 2: ChoiceParameters XML/YAML Round-Trip Coverage

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.test.ts`

- [ ] **Step 1: Add XML/YAML round-trip test for empty FormChoiceListDesTimeValue**

In `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.test.ts`, add these imports:

```ts
import { mockContext, mockContextFromXML, mockRule } from "~/tests/mockContext"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { exportChoiceParametersToYAML } from "./toYAML"
import { importChoiceParametersFromYAML } from "./fromYAML"
import { exportChoiceParametersToXML } from "./toXML"
import { xmlExport } from "~/xml/export/exporter"
```

Replace the existing `mockContextFromXML, mockRule` import from `~/tests/mockContext` with the combined import shown above. If `xmlExport` is already imported after Task 1 changes, do not duplicate it.

Add this test near the other form choice tests:

```ts
  it("preserves empty FormChoiceListDesTimeValue through YAML", () => {
    const xmlData = readAndParseXMLFixture<{ ChoiceParameters: ChoiceParametersXML }>(
      import.meta.url,
      "form/empty.xml"
    )

    const imported = importChoiceParametersFromXML(mockContextFromXML(), mockRule, xmlData.ChoiceParameters)
    const yamlObject = exportChoiceParametersToYAML(mockContext, mockRule, imported)
    const yamlText = exportToYAML(yamlObject)
    const reparsedYaml = importFromYAML<ChoiceParametersYAML>(yamlText)
    const importedFromYaml = importChoiceParametersFromYAML(mockContext, mockRule, reparsedYaml)
    const exportedXML = exportChoiceParametersToXML(mockContext, mockRule, importedFromYaml)
    const result = xmlExport({ ChoiceParameters: exportedXML }, false)

    expect(yamlObject).toEqual({
      ВыборДействующихМаршрутныхКарт: {
        Тип: "ЗначениеСпискаВыбора",
      },
    })
    expect(result).toContain('<app:value xsi:type="FormChoiceListDesTimeValue">')
    expect(result).toContain("<Presentation/>")
    expect(result).toContain('<Value xsi:nil="true"/>')
  })
```

Also add `ChoiceParametersYAML` to the existing type import from `./types`:

```ts
import { ChoiceParametersXML, ChoiceParametersYAML } from "./types"
```

- [ ] **Step 2: Create the minimal XML fixture for this test**

Create `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/empty.xml` with:

```xml
<ChoiceParameters>
	<app:item name="ВыборДействующихМаршрутныхКарт">
		<app:value xsi:type="FormChoiceListDesTimeValue">
			<Presentation/>
			<Value xsi:nil="true"/>
		</app:value>
	</app:item>
</ChoiceParameters>
```

This is a new minimal fixture for the new behavior. Do not edit existing XML fixtures.

- [ ] **Step 3: Run the new round-trip test**

Run:

```bash
pnpm --filter @nakidka/core test -- сhoiceParameters/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters/fromXML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/empty.xml
git commit -m "test: :white_check_mark: покрыть пустой FormChoiceList"
```

---

### Task 3: Empty DCS xs:string XML Import

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`

- [ ] **Step 1: Write failing tests for empty xs:string and missing value**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts`, add these imports if missing:

```ts
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
```

Add these tests after the existing `imports userSettingPresentation xs:string as I8nText` test or near the other SettingsParameterValue XML tests:

```ts
  it("imports empty xs:string value as explicit empty string", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule

    const imported = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcscor:item",
      xmlString: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>НоменклатураВключение</dcscor:parameter>
	<dcscor:value xsi:type="xs:string"/>
</dcscor:item>`,
    })

    expect(imported).toEqual({
      parameter: "НоменклатураВключение",
      use: false,
      value: { type: "string", value: "" },
    })

    const yamlObject = testExportPropertyToYAML({
      rule,
      value: imported,
    })
    const yamlText = exportToYAML(yamlObject)
    const reparsedYaml = importFromYAML<typeof yamlObject>(yamlText)
    const importedFromYaml = testImportPropertyFromYAML({
      rule,
      value: reparsedYaml.НоменклатураВключение,
    })

    expect(yamlObject).toEqual({
      НоменклатураВключение: {
        Использовать: "Ложь",
        Тип: "Строка",
        Значение: "",
      },
    })
    expect(importedFromYaml).toEqual(imported)
  })

  it("keeps missing dcscor:value as missing value", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule

    const imported = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcscor:item",
      xmlString: `<dcscor:item xsi:type="dcsset:SettingsParameterValue">
	<dcscor:use>false</dcscor:use>
	<dcscor:parameter>НоменклатураВключение</dcscor:parameter>
</dcscor:item>`,
    })

    expect(imported).toEqual({
      parameter: "НоменклатураВключение",
      use: false,
    })
    expect(Object.prototype.hasOwnProperty.call(imported, "value")).toBe(false)
  })
```

- [ ] **Step 2: Run parameterValue fromXML test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- parameterValue/fromXML.test.ts
```

Expected: FAIL. The first new test should show `value` missing instead of `{ type: "string", value: "" }`. The second test should already pass or continue passing.

- [ ] **Step 3: Implement empty xs:string preservation in DCS MetadataValue XML import**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`, add this helper near `getXsiType`:

```ts
const isEmptyXsStringValue = (root: unknown, xsi: string | undefined): boolean =>
  xsi === "xs:string" &&
  typeof root === "object" &&
  root !== null &&
  !Array.isArray(root) &&
  !Object.prototype.hasOwnProperty.call(root, "#text")
```

Then, inside `importDcsMetadataValueFromDcsXMLInternal`, after:

```ts
  const xsi = getXsiType(root)
```

add:

```ts
  if (isEmptyXsStringValue(root, xsi)) {
    return { type: "string", value: "" }
  }
```

This must be before the `metadataPrimitive` branch so `importMetadataValueFromXML` does not collapse the empty XML node to `undefined`.

- [ ] **Step 4: Run parameterValue tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- parameterValue/fromXML.test.ts parameterValue/toYAML.test.ts parameterValue/fromYAML.test.ts parameterValue/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts
git commit -m "fix: :bug: сохранить пустой xs:string в DCS"
```

---

### Task 4: Full Verification and Round-Trip

**Files:**
- No code files expected.
- May produce dirty files in `/Users/nikita/git/round-trip`; do not commit or edit that repository.

- [ ] **Step 1: Run focused core tests**

Run:

```bash
pnpm --filter @nakidka/core test -- сhoiceParameters parameterValue dcsMetadataValue settingsParameterValueCollection
```

Expected: PASS.

- [ ] **Step 2: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for `@nakidka/core` and `@nakidka/cli`.

- [ ] **Step 3: Run YAML round-trip diagnostic**

Run from repository root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected:
- The diff in `erp/Catalogs/РесурсныеСпецификации/Forms/ФормаЭлемента/Ext/Form.xml` for `FormChoiceListDesTimeValue` should disappear.
- The diff in `erp/DataProcessors/УправлениеПродажамиНаМаркетплейсах/Forms/ВыгрузкаТоварногоКаталога/Ext/Form.xml` for missing `<dcscor:value xsi:type="xs:string"/>` should disappear.
- If `DIFF_COUNT` is not zero, record the new first diff path and category for the user.

- [ ] **Step 4: Inspect repository status**

Run:

```bash
git status --short --branch
```

Expected: clean working tree in `/Users/nikita/git/nkdk` after committed tasks. Ignore dirty files in `/Users/nikita/git/round-trip` unless the user explicitly asks to clean that external repository.

- [ ] **Step 5: Final report**

Report:
- Commit hashes created by Tasks 1-3.
- `pnpm test` result.
- `round-trip-yaml` `DIFF_COUNT` and selected diff if any.
- Whether both targeted `erp` diffs disappeared.

Do not claim completion unless the verification commands have actually passed.

---

## Self-Review

Spec coverage:
- Explicit top-level `FormChoiceListDesTimeValue` in `ChoiceParameters`: covered by Tasks 1 and 2.
- Empty `dcscor:value xsi:type="xs:string"` as explicit empty string: covered by Task 3.
- Missing `dcscor:value` must stay missing: covered by Task 3.
- Full tests and round-trip diagnostic: covered by Task 4.

Placeholder scan:
- No `TBD`, `TODO`, or unspecified “write tests” steps remain.

Type consistency:
- `Тип: "ЗначениеСпискаВыбора"` reuses existing `MetadataExplicitFormChoiceListValueYAMLJSONSchema`.
- `Тип: "Строка"` and `Значение: ""` reuse existing `Field`-context explicit string behavior.
- `ChoiceParametersYAML` type is widened only for the explicit form choice object.
