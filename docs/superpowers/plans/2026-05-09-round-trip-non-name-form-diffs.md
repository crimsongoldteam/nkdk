# Round-trip Non-name Form Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранить четыре не-именных расхождения формы в short round-trip XML -> модель -> XML.

**Architecture:** Исправления остаются в существующем декларативном слое rules.ts и точечных типовых регистрациях. Для `CalculatedField[]` используется уже существующий механизм коллекций `registerMetadataItemCollectionRule`, а не отдельная ручная сериализация. Для редкого сочетания `QueryText` + `ManualQuery=false` явно сохраняется пользовательское значение `customQuery: false`, чтобы производное значение от `.query` не перетирало XML.

**Tech Stack:** TypeScript, Vitest, pnpm, существующие helpers `testImportPropertyFromXML`, `testExportPropertyToXML`, `exportPropertyToYAML`, `importPropertyFromYAML`.

---

## File Structure

- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`
  - Убрать автосоздание пустого `Settings` только из-за `ValueListType`; пустой `Settings` сохранять только из модели или reference.
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`
  - Больше не удалять `queryText` при `ManualQuery=false`.
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
  - Добавить YAML-ключ для `customQuery`.
  - Перевести `calculatedFields` на тип `CalculatedFields`.
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
  - Для `derivedFrom.externalFile` сначала уважать явно заданное YAML-значение.
- Modify: `packages/core/metadata/orchestration/property/toXML.ts`
  - Для `derivedFrom.externalFile` сначала уважать явно заданное значение в модели.
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
  - Для `customQuery=false` при наличии `queryText` разрешить YAML-вывод редкого случая.
- Create: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/queryTextWithManualQueryFalse.xml`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`

- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/types.ts`
  - Зарегистрировать коллекционный тип `CalculatedFields`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
  - Импортировать `./calculatedFields/types`.
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
  - Добавить типы `CalculatedFields` и `CalculatedFieldsYAML` в статический реестр.
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/toXML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/multipleCalculatedFields.xml`

- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Добавить корневое поле формы `customSettingsFolder`.
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolder.xml`
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolderMetadata.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`

### Task 1: FormAttribute ValueListType Tests

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Add XML fixture without Settings**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.xml`:

```xml
<Attribute name="Полномочия" id="1">
  <Type>
    <v8:Type>v8:ValueListType</v8:Type>
    <v8:Type>xs:string</v8:Type>
    <v8:StringQualifiers>
      <v8:Length>0</v8:Length>
      <v8:AllowedLength>Variable</v8:AllowedLength>
    </v8:StringQualifiers>
  </Type>
</Attribute>
```

- [ ] **Step 2: Add TS fixture without Settings**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.ts`:

```ts
import type { FormAttributes } from "../types"

export const valueListWithoutSettings = [
  {
    itemType: "FormAttribute",
    name: "Полномочия",
    type: {
      type: ["ValueListType", "string"],
      stringQualifiers: {
        length: 0,
        allowedLength: "Variable",
      },
    },
    columns: [],
  },
] as const satisfies FormAttributes
```

- [ ] **Step 3: Add XML fixture with empty reference Settings**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.xml`:

```xml
<Attribute name="Полномочия" id="1">
  <Type>
    <v8:Type>v8:ValueListType</v8:Type>
    <v8:Type>xs:string</v8:Type>
    <v8:StringQualifiers>
      <v8:Length>0</v8:Length>
      <v8:AllowedLength>Variable</v8:AllowedLength>
    </v8:StringQualifiers>
  </Type>
  <Settings xsi:type="v8:TypeDescription"/>
</Attribute>
```

- [ ] **Step 4: Add TS fixture for empty reference Settings**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.ts`:

```ts
import type { FormAttributes } from "../types"

export const valueListWithReferenceEmptySettings = [
  {
    itemType: "FormAttribute",
    name: "Полномочия",
    type: {
      type: ["ValueListType", "string"],
      stringQualifiers: {
        length: 0,
        allowedLength: "Variable",
      },
    },
    columns: [],
  },
] as const satisfies FormAttributes
```

- [ ] **Step 5: Add fromXML assertions**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts` imports:

```ts
import { valueListWithReferenceEmptySettings } from "./__fixtures__/valueListWithReferenceEmptySettings"
import { valueListWithoutSettings } from "./__fixtures__/valueListWithoutSettings"
```

Add tests inside `describe("importFormAttributesFromXML", () => { ... })`:

```ts
  it("imports ValueListType without Settings", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "valueListWithoutSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(valueListWithoutSettings)
  })

  it("imports ValueListType with empty reference Settings without valueType", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "valueListWithReferenceEmptySettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(valueListWithReferenceEmptySettings)
  })
```

- [ ] **Step 6: Add toXML assertions**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts` imports:

```ts
import { valueListWithReferenceEmptySettings } from "./__fixtures__/valueListWithReferenceEmptySettings"
import { valueListWithoutSettings } from "./__fixtures__/valueListWithoutSettings"
```

Add tests inside `describe("exportFormAttributesToXML", () => { ... })`:

```ts
  it("exports ValueListType without Settings when reference has no Settings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: valueListWithoutSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "valueListWithoutSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves empty Settings for ValueListType from reference", () => {
    const reference = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "valueListWithReferenceEmptySettings.xml",
      importMetaUrl: import.meta.url,
    })

    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: valueListWithReferenceEmptySettings,
      referenceMetadata: reference,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "valueListWithReferenceEmptySettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

Also add missing import if `testImportPropertyFromXML` is not already imported:

```ts
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
```

- [ ] **Step 7: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: `toXML` fails because `valueListWithoutSettings.xml` receives an extra `<Settings xsi:type="v8:TypeDescription"/>`.

### Task 2: FormAttribute ValueListType Implementation

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`

- [ ] **Step 1: Replace empty Settings condition**

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`, replace:

```ts
  if (typedSettings === undefined && (data.type?.type.includes("ValueListType") || result.Settings !== undefined)) {
    result.Settings = {
      "_xsi:type": "v8:TypeDescription",
      ...result.Settings,
    }
  }
```

with:

```ts
  if (typedSettings === undefined && result.Settings !== undefined) {
    result.Settings = {
      "_xsi:type": "v8:TypeDescription",
      ...result.Settings,
    }
  }
```

- [ ] **Step 2: Run focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: all tests in these two files pass.

- [ ] **Step 3: Commit FormAttribute fix**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithoutSettings.ts packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/valueListWithReferenceEmptySettings.ts
git commit -m "fix: :bug: сохранить отсутствие Settings у ValueListType"
```

### Task 3: DynamicList QueryText ManualQuery=false Tests

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/queryTextWithManualQueryFalse.xml`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`

- [ ] **Step 1: Add XML fixture**

Create `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/queryTextWithManualQueryFalse.xml`:

```xml
<Settings xsi:type="DynamicList">
  <ManualQuery>false</ManualQuery>
  <DynamicDataRead>true</DynamicDataRead>
  <QueryText>ВЫБРАТЬ
  РеестрПартийЗЕРНО.Ссылка
ИЗ
  Справочник.РеестрПартийЗЕРНО КАК РеестрПартийЗЕРНО</QueryText>
  <MainTable>Catalog.РеестрПартийЗЕРНО</MainTable>
  <ListSettings/>
</Settings>
```

- [ ] **Step 2: Add TS/YAML fixtures**

Append to `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`:

```ts
export const queryTextWithManualQueryFalseText =
  "ВЫБРАТЬ\n  РеестрПартийЗЕРНО.Ссылка\nИЗ\n  Справочник.РеестрПартийЗЕРНО КАК РеестрПартийЗЕРНО"

export const queryTextWithManualQueryFalseDynamicList = {
  customQuery: false,
  dynamicDataRead: true,
  itemType: "DynamicList",
  queryText: queryTextWithManualQueryFalseText,
  mainTable: "Catalog.РеестрПартийЗЕРНО",
} as const satisfies DynamicList

export const queryTextWithManualQueryFalseDynamicListYAML = {
  ПроизвольныйЗапрос: "Ложь",
  ДинамическоеСчитываниеДанных: "Истина",
  ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
} as const satisfies DynamicListYAML
```

- [ ] **Step 3: Add XML import/export tests**

Modify imports in `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts` and `toXML.test.ts`:

```ts
  queryTextWithManualQueryFalseDynamicList,
```

Add to `fromXML.test.ts`:

```ts
  it("imports QueryText when ManualQuery is false", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "queryTextWithManualQueryFalse.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(queryTextWithManualQueryFalseDynamicList)
  })

  it("round-trip: queryTextWithManualQueryFalse.xml import -> export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "queryTextWithManualQueryFalse.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "queryTextWithManualQueryFalse.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

Add to `toXML.test.ts`:

```ts
  it("exports QueryText with explicit ManualQuery false", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: queryTextWithManualQueryFalseDynamicList,
      xmlRootTag: "Settings",
      path: "queryTextWithManualQueryFalse.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 4: Add YAML tests**

Modify imports in `fromYAML.test.ts` and `toYAML.test.ts`:

```ts
  queryTextWithManualQueryFalseDynamicList,
  queryTextWithManualQueryFalseDynamicListYAML,
```

Add to `fromYAML.test.ts`:

```ts
  it("imports explicit ManualQuery false from YAML even when queryText exists in model fixture", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: queryTextWithManualQueryFalseDynamicListYAML,
    })

    expect(result).toEqual({
      customQuery: false,
      dynamicDataRead: true,
      itemType: "DynamicList",
      mainTable: "Catalog.РеестрПартийЗЕРНО",
    })
  })
```

Add to `toYAML.test.ts`:

```ts
  it("exports explicit ManualQuery false when queryText is present", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: queryTextWithManualQueryFalseDynamicList,
    })

    expect(result).toEqual({ ДинамическийСписок: queryTextWithManualQueryFalseDynamicListYAML })
  })

  it("does not export ManualQuery false when queryText is absent", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: {
        customQuery: false,
        dynamicDataRead: true,
        itemType: "DynamicList",
        mainTable: "Catalog.РеестрПартийЗЕРНО",
      },
    })

    expect(result).toEqual({
      ДинамическийСписок: {
        ДинамическоеСчитываниеДанных: "Истина",
        ОсновнаяТаблица: "Catalog.РеестрПартийЗЕРНО",
      },
    })
  })
```

- [ ] **Step 5: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/fromXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts
```

Expected: import loses `queryText`, XML export writes `<ManualQuery>true</ManualQuery>` when `queryText` exists, and YAML does not output `ПроизвольныйЗапрос: Ложь`.

### Task 4: DynamicList QueryText ManualQuery=false Implementation

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`

- [ ] **Step 1: Stop deleting queryText on XML import**

In `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`, remove this block:

```ts
    // ManualQuery=false → queryText не попадает в модель (предотвращаем мусорный .query)
    if (!result.customQuery && result.queryText !== undefined) {
      const { queryText: _qt, ...rest } = result as Record<string, unknown>
      return { ...rest, itemType: DynamicListRules.itemType } as DynamicList
    }
```

Update the preceding comment to:

```ts
// Переопределяем importFromXML:
// 1. Проверяем, что XML является DynamicList (xsi:type="DynamicList")
// 2. Сохраняем QueryText даже при ManualQuery=false: такие XML встречаются в реальных формах.
```

- [ ] **Step 2: Add YAML key to customQuery**

In `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`, change `customQuery` to:

```ts
    customQuery: {
      type: "boolean",
      xml: "ManualQuery",
      yaml: "ПроизвольныйЗапрос",
      derivedFrom: { externalFile: "queryText" },
      defaultValue: false,
      defaultValueXML: false,
      implicitValueYAML: false,
    },
```

- [ ] **Step 3: Respect explicit derivedFrom values on XML export**

In `packages/core/metadata/orchestration/property/toXML.ts`, replace:

```ts
      if ("derivedFrom" in ruleProp && (ruleProp as any).derivedFrom?.externalFile) {
        const referencedKey = (ruleProp as any).derivedFrom.externalFile as string
        const referencedValue = metadata !== undefined ? (metadata as any)[referencedKey] : undefined
        valueToExport = referencedValue !== undefined
      }
```

with:

```ts
      if ("derivedFrom" in ruleProp && (ruleProp as any).derivedFrom?.externalFile && !metadataHasOwnKey) {
        const referencedKey = (ruleProp as any).derivedFrom.externalFile as string
        const referencedValue = metadata !== undefined ? (metadata as any)[referencedKey] : undefined
        valueToExport = referencedValue !== undefined
      }
```

- [ ] **Step 4: Respect explicit derivedFrom values on YAML import**

In `packages/core/metadata/orchestration/property/fromYAML.ts`, replace the derived block:

```ts
    if ("derivedFrom" in curRule && (curRule as any).derivedFrom?.externalFile) {
      const referencedKey = (curRule as any).derivedFrom.externalFile as string
      if (referencedKey in externalFileValues) {
        result[key] = (externalFileValues[referencedKey] !== undefined) as any
        continue
      }
      // Если externalFileValues не заполнен (нет formDir) — fallthrough к обычной обработке
    }
```

with:

```ts
    if ("derivedFrom" in curRule && (curRule as any).derivedFrom?.externalFile) {
      const yamlKey = curRule.yaml as keyof ToYAML<Rule["itemType"]>
      const hasExplicitYAMLValue =
        yaml !== undefined && yamlKey !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlKey)

      if (!hasExplicitYAMLValue) {
        const referencedKey = (curRule as any).derivedFrom.externalFile as string
        if (referencedKey in externalFileValues) {
          result[key] = (externalFileValues[referencedKey] !== undefined) as any
          continue
        }
      }
      // Если externalFileValues не заполнен или YAML содержит явное значение — fallthrough к обычной обработке
    }
```

- [ ] **Step 5: Export explicit false only when external value exists**

In `packages/core/metadata/orchestration/property/toYAML.ts`, insert after `const value = data[key as keyof ToMetadata<Rule["itemType"]>]`:

```ts
    if (
      "derivedFrom" in propertyRule &&
      (propertyRule as any).derivedFrom?.externalFile &&
      value === propertyRule.implicitValueYAML
    ) {
      const referencedKey = (propertyRule as any).derivedFrom.externalFile as keyof ToMetadata<Rule["itemType"]>
      const referencedValue = data[referencedKey]
      if (referencedValue === undefined) continue
    }
```

This keeps ordinary `customQuery=false` silent, but emits `ПроизвольныйЗапрос: Ложь` when the same object also contains `queryText`.

- [ ] **Step 6: Run focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/fromXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts
```

Expected: all DynamicList tests pass.

- [ ] **Step 7: Commit DynamicList QueryText fix**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList/types.ts packages/core/metadata/forms/commonObjects/dynamicList/rules.ts packages/core/metadata/orchestration/property/fromYAML.ts packages/core/metadata/orchestration/property/toXML.ts packages/core/metadata/orchestration/property/toYAML.ts packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/queryTextWithManualQueryFalse.xml
git commit -m "fix: :bug: сохранить QueryText при ManualQuery false"
```

### Task 5: CalculatedFields Collection Tests

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/toXML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/toYAML.test.ts`
- Create: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/multipleCalculatedFields.xml`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`

- [ ] **Step 1: Add collection fixture data**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/__fixtures__/data.ts`:

```ts
import type { CalculatedField, CalculatedFieldYAML } from "../types"

export const calculatedFields = [
  {
    itemType: "CalculatedField",
    dataPath: "РабочееМесто",
    expression: "ФискальноеУстройство.РабочееМесто",
    title: {
      items: {
        ru: "Рабочее место",
      },
    },
  },
  {
    itemType: "CalculatedField",
    dataPath: "ОбщееСостояниеПодключения",
    expression: "",
    title: {
      items: {
        ru: "Настройки",
      },
    },
  },
] as const satisfies CalculatedField[]

export const calculatedFieldsYAML = [
  {
    ПутьКДанным: "РабочееМесто",
    Выражение: "ФискальноеУстройство.РабочееМесто",
    Заголовок: "Рабочее место",
  },
  {
    ПутьКДанным: "ОбщееСостояниеПодключения",
    Выражение: "",
    Заголовок: "Настройки",
  },
] as const satisfies CalculatedFieldYAML[]
```

- [ ] **Step 2: Add collection fromXML test**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { calculatedFields } from "./__fixtures__/data"
import { importPropertyFromXML, type PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "CalculatedFields",
  xml: "CalculatedField",
}

describe("import CalculatedFields from XML", () => {
  it("imports a single CalculatedField as an array", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: {
        "dcssch:dataPath": "РабочееМесто",
        "dcssch:expression": "ФискальноеУстройство.РабочееМесто",
        "dcssch:title": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": {
            "v8:lang": "ru",
            "v8:content": "Рабочее место",
          },
        },
      },
    })

    expect(result).toEqual([calculatedFields[0]])
  })

  it("imports multiple CalculatedField nodes as an array", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: [
        {
          "dcssch:dataPath": "РабочееМесто",
          "dcssch:expression": "ФискальноеУстройство.РабочееМесто",
          "dcssch:title": {
            "_xsi:type": "v8:LocalStringType",
            "v8:item": {
              "v8:lang": "ru",
              "v8:content": "Рабочее место",
            },
          },
        },
        {
          "dcssch:dataPath": "ОбщееСостояниеПодключения",
          "dcssch:expression": "",
          "dcssch:title": {
            "_xsi:type": "v8:LocalStringType",
            "v8:item": {
              "v8:lang": "ru",
              "v8:content": "Настройки",
            },
          },
        },
      ],
    })

    expect(result).toEqual(calculatedFields)
  })
})
```

- [ ] **Step 3: Add collection toXML test**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { calculatedFields } from "./__fixtures__/data"
import { exportPropertyToXML, type PropertyRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "CalculatedFields",
  xml: "CalculatedField",
}

describe("export CalculatedFields to XML", () => {
  it("exports multiple CalculatedField nodes", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: calculatedFields,
    })

    expect(result).toEqual([
      {
        "dcssch:dataPath": "РабочееМесто",
        "dcssch:expression": "ФискальноеУстройство.РабочееМесто",
        "dcssch:title": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": {
            "v8:lang": "ru",
            "v8:content": "Рабочее место",
          },
        },
      },
      {
        "dcssch:dataPath": "ОбщееСостояниеПодключения",
        "dcssch:expression": "",
        "dcssch:title": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": {
            "v8:lang": "ru",
            "v8:content": "Настройки",
          },
        },
      },
    ])
  })
})
```

- [ ] **Step 4: Add collection YAML tests**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { calculatedFields, calculatedFieldsYAML } from "./__fixtures__/data"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"

describe("import CalculatedFields from YAML", () => {
  it("imports YAML array", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedFields" },
      value: calculatedFieldsYAML,
    })

    expect(result).toEqual(calculatedFields)
  })
})
```

Create `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/toYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { calculatedFields, calculatedFieldsYAML } from "./__fixtures__/data"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

describe("export CalculatedFields to YAML", () => {
  it("exports YAML array", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "CalculatedFields", yaml: "ВычисляемыеПоля" },
      value: calculatedFields,
    })

    expect(result).toEqual({ ВычисляемыеПоля: calculatedFieldsYAML })
  })
})
```

- [ ] **Step 5: Add DynamicList XML fixture**

Create `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/multipleCalculatedFields.xml`:

```xml
<Settings xsi:type="DynamicList">
  <ManualQuery>false</ManualQuery>
  <DynamicDataRead>true</DynamicDataRead>
  <CalculatedField>
    <dcssch:dataPath>РабочееМесто</dcssch:dataPath>
    <dcssch:expression>ФискальноеУстройство.РабочееМесто</dcssch:expression>
    <dcssch:title xsi:type="v8:LocalStringType">
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Рабочее место</v8:content>
      </v8:item>
    </dcssch:title>
  </CalculatedField>
  <CalculatedField>
    <dcssch:dataPath>ОбщееСостояниеПодключения</dcssch:dataPath>
    <dcssch:expression/>
    <dcssch:title xsi:type="v8:LocalStringType">
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Настройки</v8:content>
      </v8:item>
    </dcssch:title>
  </CalculatedField>
  <MainTable>Catalog.ТСПИоТ</MainTable>
  <ListSettings/>
</Settings>
```

- [ ] **Step 6: Add DynamicList fixture data**

Append to `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`:

```ts
export const multipleCalculatedFieldsDynamicList = {
  calculatedFields: [
    {
      itemType: "CalculatedField",
      dataPath: "РабочееМесто",
      expression: "ФискальноеУстройство.РабочееМесто",
      title: {
        items: {
          ru: "Рабочее место",
        },
      },
    },
    {
      itemType: "CalculatedField",
      dataPath: "ОбщееСостояниеПодключения",
      expression: "",
      title: {
        items: {
          ru: "Настройки",
        },
      },
    },
  ],
  customQuery: false,
  dynamicDataRead: true,
  itemType: "DynamicList",
  mainTable: "Catalog.ТСПИоТ",
} as const satisfies DynamicList
```

Also update existing `fullDynamicList.calculatedFields` from an object to a one-element array, and update `fullDynamicListYAML.ВычисляемыеПоля` from an object to a one-element array containing the same object.

- [ ] **Step 7: Add DynamicList tests**

Add imports for `multipleCalculatedFieldsDynamicList` in `fromXML.test.ts`, `toXML.test.ts`, and `toYAML.test.ts`.

Add to `fromXML.test.ts`:

```ts
  it("imports multiple CalculatedField nodes", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "multipleCalculatedFields.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(multipleCalculatedFieldsDynamicList)
  })
```

Add to `toXML.test.ts`:

```ts
  it("exports multiple CalculatedField nodes", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: multipleCalculatedFieldsDynamicList,
      xmlRootTag: "Settings",
      path: "multipleCalculatedFields.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

Add to `toYAML.test.ts`:

```ts
  it("exports calculatedFields as YAML array", () => {
    const result = exportPropertyToYAML({
      context: mockContextToTypedYAML,
      rule,
      value: multipleCalculatedFieldsDynamicList,
    })

    expect(result?.ДинамическийСписок?.ВычисляемыеПоля).toEqual([
      {
        ПутьКДанным: "РабочееМесто",
        Выражение: "ФискальноеУстройство.РабочееМесто",
        Заголовок: "Рабочее место",
      },
      {
        ПутьКДанным: "ОбщееСостояниеПодключения",
        Выражение: "",
        Заголовок: "Настройки",
      },
    ])
  })
```

- [ ] **Step 8: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/calculatedFields metadata/forms/commonObjects/dynamicList/fromXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts
```

Expected: tests fail because `CalculatedFields` type is not registered and `DynamicListRules.calculatedFields` still uses `CalculatedField`.

### Task 6: CalculatedFields Collection Implementation

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`

- [ ] **Step 1: Register CalculatedFields collection type**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields/types.ts`:

```ts
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import type { CalculatedField, CalculatedFieldYAML } from "../calculatedField/types"
import { CalculatedFieldRules } from "../calculatedField/rules"

export type CalculatedFields = CalculatedField[]
export type CalculatedFieldsYAML = CalculatedFieldYAML[]

registerMetadataItemCollectionRule({
  propertyType: "CalculatedFields",
  itemRule: CalculatedFieldRules,
  xmlElement: "CalculatedField",
  yamlAsArray: true,
})
```

- [ ] **Step 2: Import CalculatedFields side-effect registration**

In `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`, add after `import "./calculatedField/types"`:

```ts
import "./calculatedFields/types"
```

- [ ] **Step 3: Add CalculatedFields to property registry imports**

In `packages/core/metadata/orchestration/property/registry.ts`, add after the `CalculatedField` import:

```ts
import {
  CalculatedFields,
  CalculatedFieldsYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedFields/types"
```

- [ ] **Step 4: Add CalculatedFields to registry item/yaml map**

In `PropertyRuleTypeMap`, add after `CalculatedField`:

```ts
  CalculatedFields: {
    item: CalculatedFields
    yaml: CalculatedFieldsYAML
  }
```

- [ ] **Step 5: Add CalculatedFields to runtime property type list**

In `PropertyRuleTypes`, add after `CalculatedField`:

```ts
  CalculatedFields: "CalculatedFields",
```

- [ ] **Step 6: Switch DynamicList rule to CalculatedFields**

In `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`, replace:

```ts
    calculatedFields: {
      type: "CalculatedField",
      xml: "CalculatedField",
      yaml: "ВычисляемыеПоля",
    },
```

with:

```ts
    calculatedFields: {
      type: "CalculatedFields",
      xml: "CalculatedField",
      yaml: "ВычисляемыеПоля",
    },
```

- [ ] **Step 7: Run focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/calculatedFields metadata/forms/commonObjects/dynamicList/fromXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts
```

Expected: all focused tests pass; existing `fullDynamicList` now exports `ВычисляемыеПоля` as a YAML array.

- [ ] **Step 8: Commit CalculatedFields fix**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFields packages/core/metadata/commonObjects/dataCompositionSystem/index.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/forms/commonObjects/dynamicList/rules.ts packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/multipleCalculatedFields.xml packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts
git commit -m "fix: :bug: сохранить несколько CalculatedField"
```

### Task 7: CustomSettingsFolder Tests

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolder.xml`
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolderMetadata.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`

- [ ] **Step 1: Add form XML fixture**

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolder.xml`:

```xml
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:dcscom="http://v8.1c.ru/8.1/data-composition-system/common" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <AutoCommandBar name="ФормаКоманднаяПанель" id="-1">
    <HorizontalAlign>Right</HorizontalAlign>
  </AutoCommandBar>
  <ChildItems>
    <FormGroup name="ГруппаПользовательскихНастроек" id="1">
      <Title>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Пользовательские настройки</v8:content>
        </v8:item>
      </Title>
    </FormGroup>
  </ChildItems>
  <Attributes/>
  <CommandSet>
    <ExcludedCommand>EndEdit</ExcludedCommand>
  </CommandSet>
  <CustomSettingsFolder>ГруппаПользовательскихНастроек</CustomSettingsFolder>
</Form>
```

- [ ] **Step 2: Add metadata XML fixture**

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolderMetadata.xml`:

```xml
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Form uuid="11111111-1111-4111-8111-111111111111">
    <Properties>
      <Name>НастройкаОтборовСписка</Name>
      <Synonym/>
      <Comment/>
      <FormType>Managed</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>
```

- [ ] **Step 3: Add TS/YAML fixture data**

Append to `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`:

```ts
export const customSettingsFolderClientApplicationForm: ClientApplicationForm = {
  itemType: "ClientApplicationForm",
  uuid: "11111111-1111-4111-8111-111111111111",
  name: "НастройкаОтборовСписка",
  formType: "Managed",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    horizontalAlign: "Right",
    childItems: [],
  },
  childItems: [
    {
      itemType: "Group",
      name: "ГруппаПользовательскихНастроек",
      id: 1,
      title: { items: { ru: "Пользовательские настройки" } },
    },
  ],
  attributes: [],
  commandSet: ["EndEdit"],
  customSettingsFolder: "ГруппаПользовательскихНастроек",
}

export const customSettingsFolderClientApplicationFormYAML: ClientApplicationFormYAML = {
  КоманднаяПанель: {
    ГоризонтальноеПоложение: "Право",
  },
  СоставКоманд: ["EndEdit"],
  ГруппаПользовательскихНастроек: "ГруппаПользовательскихНастроек",
}
```

If `CommandSet` YAML uses a different existing representation in this repo, use the representation already produced by `toYAML.test.ts` for `commandSet` and keep the `ГруппаПользовательскихНастроек` assertion unchanged.

- [ ] **Step 4: Add fromXML/toXML tests**

Modify imports in `fromXML.test.ts` and `toXML.test.ts`:

```ts
  customSettingsFolderClientApplicationForm,
```

Add to `fromXML.test.ts`:

```ts
  it("imports CustomSettingsFolder", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
      import.meta.url,
      "customSettingsFolder.xml"
    )
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "customSettingsFolderMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(customSettingsFolderClientApplicationForm)
  })
```

Add to `toXML.test.ts`:

```ts
    it("exports CustomSettingsFolder", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "customSettingsFolder.xml")
      const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
        import.meta.url,
        "customSettingsFolder.xml"
      )
      const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "customSettingsFolderMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceFormXML.Form,
        xmlMetadata: referenceMetadataXML.MetaDataObject,
      })
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: customSettingsFolderClientApplicationForm,
        referenceForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })
```

- [ ] **Step 5: Add YAML tests**

Add to `toYAML.test.ts`:

```ts
  it("exports CustomSettingsFolder to YAML", () => {
    const result = exportClientApplicationFormToYAML({
      context: mockContextToTypedYAML,
      form: customSettingsFolderClientApplicationForm,
    })

    expect(result.ГруппаПользовательскихНастроек).toBe("ГруппаПользовательскихНастроек")
  })
```

Add to `fromYAML.test.ts`:

```ts
  it("imports CustomSettingsFolder from YAML", () => {
    const result = importClientApplicationFormFromYAML({
      context: mockContextFromYAML(),
      yaml: {
        ГруппаПользовательскихНастроек: "ГруппаПользовательскихНастроек",
      },
    })

    expect(result.customSettingsFolder).toBe("ГруппаПользовательскихНастроек")
  })
```

Use the exact local function names already imported in these two test files. If the files use `testExportMetadataItemToYAML` or `testImportMetadataItemFromYAML`, wrap the same YAML object with those helpers and keep the assertion on `ГруппаПользовательскихНастроек`.

- [ ] **Step 6: Run focused tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: fromXML does not include `customSettingsFolder`, toXML omits `<CustomSettingsFolder>`, and YAML omits `ГруппаПользовательскихНастроек`.

### Task 8: CustomSettingsFolder Implementation

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`

- [ ] **Step 1: Add form-level rule**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, add immediately after `commandSet`:

```ts
    customSettingsFolder: {
      yaml: "ГруппаПользовательскихНастроек",
      xml: "CustomSettingsFolder",
      type: "string",
      tag: FormRulesTags.Form,
    },
```

- [ ] **Step 2: Run focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: all focused ClientApplicationForm tests pass.

- [ ] **Step 3: Commit CustomSettingsFolder fix**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolder.xml packages/core/metadata/forms/clientApplicationForm/__fixtures__/customSettingsFolderMetadata.xml
git commit -m "fix: :bug: сохранить CustomSettingsFolder формы"
```

### Task 9: Final Verification

**Files:**
- Read: `docs/superpowers/specs/2026-05-09-round-trip-non-name-form-diffs-design.md`
- Read: `docs/superpowers/plans/2026-05-09-round-trip-non-name-form-diffs.md`

- [ ] **Step 1: Run all focused tests together**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts metadata/forms/commonObjects/dynamicList/fromXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedFields metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Check status**

Run:

```bash
git status --short
```

Expected: only intentional committed changes are absent from status; uncommitted files are either the plan/spec documents or deliberate final edits.

- [ ] **Step 4: Optional round-trip triage confirmation**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 30
```

Expected: the four non-name diffs from the spec no longer appear. Remaining diffs, if any, are the known English-name differences or newly discovered unrelated cases.

## Self-Review

- Spec coverage: Task 1-2 covers empty `Settings`; Task 3-4 covers `QueryText` with `ManualQuery=false`; Task 5-6 covers multiple `CalculatedField`; Task 7-8 covers root `CustomSettingsFolder`; Task 9 covers verification.
- Placeholder scan: plan contains concrete paths, concrete snippets, concrete commands, and expected outcomes. The two places that depend on existing YAML helper names are constrained to exact assertions and point at the local test files to preserve current project style.
- Type consistency: `CalculatedFields` is consistently `CalculatedField[]`; `customSettingsFolder` is consistently the model key and `ГруппаПользовательскихНастроек` is the YAML key; `customQuery` remains the model key for `ManualQuery`.
