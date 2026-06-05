# round-trip-yaml-1c all diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать XML, сгенерированный из YAML без reference для `/home/nikita/git/round-trip/all`, ближе к загрузочной форме 1С: сохранить типы предопределённых элементов ПВХ, порядок подписок на события и не синтезировать лишние `ExtDimension5..50`.

**Architecture:** Все изменения остаются в `packages/core/metadata/**` и используют существующую систему правил. ПВХ расширяет общий `PredefinedItem` через контекст владельца, подписки получают локальный `order`, а стандартные реквизиты бухгалтерии ограничивают XML-канон через уже существующий `standartAttributeNamesXML`.

**Tech Stack:** TypeScript, Vitest, существующий metadata orchestration, `pnpm`, `round-trip-yaml-1c`, `ibcmd`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/predefinedItem/rules.ts`  
  Добавляет поле `type` (`TypeDescription`) для `PredefinedItem`, видимое только для `MetadataChartOfCharacteristicTypes`.

- Modify: `packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts`  
  Проверяет экспорт `<Type>` для негруппового элемента ПВХ и пустой `<Type/>` для группы ПВХ.

- Modify: `packages/core/metadata/commonObjects/predefinedItem/toYAML.test.ts`  
  Проверяет, что `ТипЗначения` выводится для негруппового элемента ПВХ и скрывается для группы.

- Modify: `packages/core/metadata/commonObjects/predefinedItem/fromYAML.test.ts`  
  Проверяет импорт YAML `ТипЗначения` в модель `PredefinedItem.type`.

- Modify: `packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts`  
  Проверяет импорт XML `<Type>` в модель `PredefinedItem.type`.

- Modify: `packages/core/metadata/commonObjects/predefined/rules.ts`  
  Выбирает `xsi:type="PlanOfCharacteristicKindPredefinedItems"` для `MetadataChartOfCharacteristicTypes`.

- Modify: `packages/core/metadata/commonObjects/predefined/toXML.test.ts`  
  Проверяет корневой `xsi:type` для ПВХ.

- Modify: `packages/core/metadata/commonObjects/xmlRoot/types.ts`  
  Разрешает `rootAttributes` как функцию от владельца внешнего файла.

- Modify: `packages/core/metadata/orchestration/metadataItem/toXML.ts`  
  Передаёт владельца в вычисление `XMLRoot.rootAttributes`.

- Modify: `packages/core/metadata/orchestration/metadataItem/registerExportToXML.ts`  
  Прокидывает `metadataItem` владельца из property export в metadata item export.

- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/rules.ts`  
  Добавляет локальный порядок XML-полей подписки.

- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts`  
  Проверяет порядок `Name -> Synonym -> Comment -> Source -> Event -> Handler -> ObjectBelonging` без reference.

- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`  
  Добавляет `standartAttributeNamesXML`, который для `ExtDimension*` оставляет только явно присутствующие в модели стандартные реквизиты.

- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`  
  Проверяет, что бухгалтерские `ExtDimension5..50` не синтезируются без reference.

- Modify: `docs/superpowers/specs/2026-06-05-round-trip-yaml-1c-all-diffs-design.md`  
  Уточняет, что `Wrong property ... Dimension/Resource` пока только диагностируется, а не исправляется этим планом.

## Task 1: PredefinedItem `ТипЗначения` for ПВХ

**Files:**
- Modify: `packages/core/metadata/commonObjects/predefinedItem/rules.ts`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/predefinedItem/toYAML.test.ts`

- [ ] **Step 1: Write failing tests for XML import/export**

Add these tests to `packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts`:

```ts
it("imports Type for chart of characteristic types predefined item", () => {
  const result = testImportPropertyFromXML({
    rule,
    xmlString: `
      <Item name="ПредопределенноеВсеСвойства">
        <IsFolder>false</IsFolder>
        <Code>000000001</Code>
        <Description>Предопределенное все свойства</Description>
        <Type>
          <v8:Type>xs:string</v8:Type>
          <v8:StringQualifiers>
            <v8:Length>10</v8:Length>
            <v8:AllowedLength>Variable</v8:AllowedLength>
          </v8:StringQualifiers>
        </Type>
      </Item>
    `,
    xmlRootTag: "Item",
  })

  expect(result).toMatchObject({
    itemType: "PredefinedItem",
    name: "ПредопределенноеВсеСвойства",
    isFolder: false,
    type: {
      types: ["xs:string"],
      stringQualifiers: {
        length: 10,
        allowedLength: "Variable",
      },
    },
  })
})
```

Add these tests to `packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts`:

```ts
it("exports Type for chart of characteristic types predefined item", () => {
  const { result } = testExportPropertyToXML({
    rule,
    value: {
      itemType: "PredefinedItem",
      name: "ПредопределенноеВсеСвойства",
      isFolder: false,
      code: "000000001",
      description: "Предопределенное все свойства",
      type: {
        types: ["xs:string"],
        stringQualifiers: {
          length: 10,
          allowedLength: "Variable",
        },
      },
    },
    xmlRootTag: "Item",
  })

  expect(result).toContain("<Type>")
  expect(result).toContain("<v8:Type>xs:string</v8:Type>")
  expect(result).toContain("<v8:Length>10</v8:Length>")
})

it("exports empty Type for chart of characteristic types predefined folder", () => {
  const { result } = testExportPropertyToXML({
    rule,
    value: {
      itemType: "PredefinedItem",
      name: "Группа",
      isFolder: true,
      code: "000000002",
      description: "Группа",
    },
    xmlRootTag: "Item",
  })

  expect(result).toContain("<IsFolder>true</IsFolder>")
  expect(result).toContain("<Type/>")
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts
```

Expected: at least one test fails because `PredefinedItemRules` does not have `type`.

- [ ] **Step 3: Implement XML support**

In `packages/core/metadata/commonObjects/predefinedItem/rules.ts`, add imports:

```ts
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
```

Add helper functions below `const properties = ["Properties"]` if that constant exists, or below imports if there is no local constant:

```ts
const isChartOfCharacteristicTypesPredefined = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataChartOfCharacteristicTypes" as never]).itemType ===
      "MetadataChartOfCharacteristicTypes"
    : false

const isPredefinedFolder = (metadataItem: unknown): boolean =>
  metadataItem !== null &&
  metadataItem !== undefined &&
  typeof metadataItem === "object" &&
  (metadataItem as { isFolder?: unknown }).isFolder === true
```

Add this property to `PredefinedItemRules.properties` after `description` and before child `items`:

```ts
type: {
  yaml: "ТипЗначения",
  xml: "Type",
  type: "TypeDescription",
  toYAML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
    isChartOfCharacteristicTypesPredefined(context) && !isPredefinedFolder(metadataItem),
  toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
    isChartOfCharacteristicTypesPredefined(context),
  defaultValueXMLRaw: {},
},
```

- [ ] **Step 4: Run XML tests to verify they pass**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Write YAML tests**

Add this test to `packages/core/metadata/commonObjects/predefinedItem/fromYAML.test.ts`:

```ts
it("imports ТипЗначения from YAML", () => {
  const result = testImportPropertyFromYAML({
    rule: importRule,
    value: {
      ПредопределенноеВсеСвойства: {
        Код: "000000001",
        Наименование: "Предопределенное все свойства",
        ТипЗначения: "Строка(10)",
      },
    },
  })

  expect(result).toMatchObject([
    {
      itemType: "PredefinedItem",
      name: "ПредопределенноеВсеСвойства",
      type: {
        types: ["xs:string"],
        stringQualifiers: {
          length: 10,
          allowedLength: "Variable",
        },
      },
    },
  ])
})
```

Add this test to `packages/core/metadata/commonObjects/predefinedItem/toYAML.test.ts`:

```ts
it("exports ТипЗначения for non-folder items and hides it for folders", () => {
  const result = testExportPropertyToYAML({
    rule,
    value: [
      {
        itemType: "PredefinedItem",
        name: "ПредопределенноеВсеСвойства",
        isFolder: false,
        code: "000000001",
        description: "Предопределенное все свойства",
        type: {
          types: ["xs:string"],
          stringQualifiers: {
            length: 10,
            allowedLength: "Variable",
          },
        },
      },
      {
        itemType: "PredefinedItem",
        name: "Группа",
        isFolder: true,
        code: "000000002",
        description: "Группа",
        type: {
          types: ["xs:string"],
        },
      },
    ],
  })

  expect(result).toMatchObject({
    ПредопределенноеВсеСвойства: {
      ТипЗначения: "Строка(10)",
    },
    Группа: {},
  })
  expect(result.Группа).not.toHaveProperty("ТипЗначения")
})
```

- [ ] **Step 6: Run YAML tests**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/predefinedItem/fromYAML.test.ts packages/core/metadata/commonObjects/predefinedItem/toYAML.test.ts
```

Expected: tests pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/predefinedItem/rules.ts \
  packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts \
  packages/core/metadata/commonObjects/predefinedItem/fromYAML.test.ts \
  packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts \
  packages/core/metadata/commonObjects/predefinedItem/toYAML.test.ts
git commit -m "fix: :bug: сохранить тип предопределенных ПВХ"
```

Expected: commit succeeds.

## Task 2: Predefined root `xsi:type` for ПВХ

**Files:**
- Modify: `packages/core/metadata/commonObjects/predefined/rules.ts`
- Modify: `packages/core/metadata/commonObjects/predefined/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/xmlRoot/types.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/toXML.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/registerExportToXML.ts`

- [ ] **Step 1: Write failing root type test**

Add this test to `packages/core/metadata/commonObjects/predefined/toXML.test.ts`:

Add this import if the file does not already import it:

```ts
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
```

```ts
it("exports chart of characteristic types predefined root xsi:type", () => {
  const { result } = testExportPropertyToXML({
    rule: { type: "Predefined" },
    value: {
      items: [
        {
          itemType: "PredefinedItem",
          name: "ПредопределенноеВсеСвойства",
          isFolder: false,
          code: "000000001",
          description: "Предопределенное все свойства",
        },
      ],
    },
    metadataItem: { itemType: "MetadataChartOfCharacteristicTypes" },
    xmlRootTag: "PredefinedData",
  })

  expect(result).toContain('xsi:type="PlanOfCharacteristicKindPredefinedItems"')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/predefined/toXML.test.ts
```

Expected: the new test fails because root type is not `PlanOfCharacteristicKindPredefinedItems`.

- [ ] **Step 3: Allow XMLRoot rootAttributes function**

In `packages/core/metadata/commonObjects/xmlRoot/types.ts`, replace:

```ts
rootAttributes: Record<string, string>
```

with:

```ts
rootAttributes:
  | Record<string, string>
  | ((params: { data: unknown; referenceData: unknown; ownerMetadataItem: unknown }) => Record<string, string>)
```

In `packages/core/metadata/orchestration/metadataItem/toXML.ts`, extend the `exportMetadataItemToXML` params type:

```ts
ownerMetadataItem?: unknown
```

Read it near the current destructuring:

```ts
const { context, data, rule, referenceData, tag, ownerMetadataItem } = params
```

Update the `getXmlRootAttributes` call to pass the owner:

```ts
const rootAttributes = getXmlRootAttributes({
  data,
  referenceData,
  ownerMetadataItem,
  xmlRootKey,
  fallback: (xmlRootProp as any).rootAttributes,
})
```

Change `getXmlRootAttributes` to:

```ts
const getXmlRootAttributes = (params: {
  data: unknown
  referenceData: unknown
  ownerMetadataItem: unknown
  xmlRootKey: string
  fallback:
    | Record<string, string>
    | ((params: { data: unknown; referenceData: unknown; ownerMetadataItem: unknown }) => Record<string, string>)
}): Record<string, string> => {
  const fromReference = getStoredXmlRootAttributes(params.referenceData, params.xmlRootKey)
  if (fromReference) return fromReference
  const fromData = getStoredXmlRootAttributes(params.data, params.xmlRootKey)
  if (fromData) return fromData
  if (typeof params.fallback === "function") {
    return params.fallback({
      data: params.data,
      referenceData: params.referenceData,
      ownerMetadataItem: params.ownerMetadataItem,
    })
  }
  return params.fallback
}
```

In `packages/core/metadata/orchestration/metadataItem/registerExportToXML.ts`, pass the owner into `exportMetadataItemToXML`:

```ts
return exportMetadataItemToXML({
  context: params.context,
  data: params.value as ToMetadata<Rule["itemType"]> | undefined,
  rule: itemRule,
  referenceData: params.referenceMetadata as ToMetadata<Rule["itemType"]> | undefined,
  ownerMetadataItem: params.metadataItem,
})
```

- [ ] **Step 4: Implement root type selection**

In `packages/core/metadata/commonObjects/predefined/rules.ts`, add this helper above `PredefinedRules`:

Use this exact mapping:

```ts
const predefinedRootAttributes = (params: { ownerMetadataItem: unknown }): Record<string, string> => {
  const itemType =
    params.ownerMetadataItem !== null &&
    params.ownerMetadataItem !== undefined &&
    typeof params.ownerMetadataItem === "object"
      ? (params.ownerMetadataItem as { itemType?: unknown }).itemType
      : undefined

  const xsiType =
    itemType === "MetadataChartOfAccounts"
      ? "ChartOfAccountsPredefinedItems"
      : itemType === "MetadataChartOfCharacteristicTypes"
        ? "PlanOfCharacteristicKindPredefinedItems"
        : itemType === "MetadataChartOfCalculationTypes"
          ? "CalculationTypePredefinedItems"
          : "CatalogPredefinedItems"

  return {
    _xmlns: "http://v8.1c.ru/8.3/xcf/predef",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "_xsi:type": xsiType,
    _version: "2.20",
  }
}
```

Then replace the fixed `xmlRoot.rootAttributes` object with:

```ts
rootAttributes: predefinedRootAttributes,
```

The exported XML for catalog, chart of accounts and chart of calculation types must keep their existing `xsi:type` values because reference root attributes still have priority over the fallback function.

- [ ] **Step 5: Run predefined tests**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/predefined/toXML.test.ts packages/core/metadata/commonObjects/predefined/fromXML.test.ts
```

Expected: tests pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/predefined/rules.ts \
  packages/core/metadata/commonObjects/predefined/toXML.test.ts \
  packages/core/metadata/commonObjects/xmlRoot/types.ts \
  packages/core/metadata/orchestration/metadataItem/toXML.ts \
  packages/core/metadata/orchestration/metadataItem/registerExportToXML.ts
git commit -m "fix: :bug: задать root type предопределенных ПВХ"
```

Expected: commit succeeds.

## Task 3: MetadataEventSubscription XML order

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts`

- [ ] **Step 1: Write failing order test**

Add this test to `packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts`:

```ts
it("exports XML fields in 1C load order without reference", () => {
  const { result } = testExportPropertyToXML({
    rule: { type: "MetadataEventSubscription" },
    value: {
      itemType: "MetadataEventSubscription",
      name: "ПодпискаНаСобытиеВсеСвойства",
      synonym: { items: { ru: "Синоним" } },
      comment: "Комментарий",
      source: { types: ["cfg:CatalogObject.СправочникПолный"] },
      event: "BeforeWrite",
      handler: "ПодпискаНаСобытиеВсеСвойстваПередЗаписью",
      objectBelonging: "Native",
    },
    xmlRootTag: "EventSubscription",
  })

  const properties = result.match(/<Properties>([\s\S]*?)<\/Properties>/)?.[1] ?? ""
  const names = Array.from(properties.matchAll(/<([A-Za-z]+)(?:>|\/>)/g), ([, name]) => name)

  expect(names).toEqual(["Name", "Synonym", "Comment", "Source", "Event", "Handler", "ObjectBelonging"])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts
```

Expected: the new test fails because fields are alphabetically ordered without local `order`.

- [ ] **Step 3: Add local order**

In `packages/core/metadata/appliedObjects/metadataEventSubscription/rules.ts`, add these `order` values:

```ts
name: {
  type: "string",
  xmlParents: properties,
  required: true,
  order: 1,
},
synonym: {
  yaml: "Синоним",
  type: "I8nText",
  xmlParents: properties,
  defaultValueXMLRaw: "",
  order: 2,
},
comment: {
  yaml: "Комментарий",
  type: "string",
  xmlParents: properties,
  defaultValueXMLRaw: "",
  order: 3,
},
source: {
  yaml: "Источник",
  type: "TypeDescription",
  xmlParents: properties,
  order: 4,
},
event: {
  yaml: "Событие",
  type: "string",
  xmlParents: properties,
  order: 5,
},
handler: {
  yaml: "Обработчик",
  type: "string",
  xmlParents: properties,
  order: 6,
},
objectBelonging: {
  yaml: "ПринадлежностьОбъекта",
  type: "SystemEnumeration",
  typeSE: "ObjectBelonging",
  defaultValueYAML: "Native",
  toYAML: false,
  fromYAML: false,
  xmlParents: properties,
  order: 7,
},
```

Keep all existing properties and default values unchanged.

- [ ] **Step 4: Run event subscription tests**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts packages/core/metadata/appliedObjects/metadataEventSubscription/fromXML.test.ts packages/core/metadata/appliedObjects/metadataEventSubscription/fromYAML.test.ts packages/core/metadata/appliedObjects/metadataEventSubscription/toYAML.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataEventSubscription/rules.ts \
  packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts
git commit -m "fix: :bug: упорядочить XML подписок на события"
```

Expected: commit succeeds.

## Task 4: Accounting register `ExtDimension*` without reference

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`

- [ ] **Step 1: Write failing ExtDimension synthesis test**

Add this test to `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`:

```ts
it("does not synthesize accounting ExtDimension names missing from model without reference", () => {
  const rule = {
    type: "StandardAttributeDescriptions",
    standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
    standartAttributeNamesXML: (metadataItem: unknown) =>
      (metadataItem as { standardAttributes?: { name?: string }[] }).standardAttributes
        ? Object.fromEntries(
            Object.entries(MetadataAccountingRegisterStandardAttributeNames).filter(([name]) => {
              if (!/^ExtDimension(Type)?\d+$/.test(name)) return true
              return (metadataItem as { standardAttributes: { name?: string }[] }).standardAttributes.some(
                (item) => item.name === name
              )
            })
          )
        : MetadataAccountingRegisterStandardAttributeNames,
  } satisfies PropertyRule

  const metadataItem = {
    itemType: "MetadataAccountingRegister",
    standardAttributes: [
      { itemType: "StandardAttributeDescription", name: "Recorder", comment: "changed" },
      { itemType: "StandardAttributeDescription", name: "ExtDimension1" },
      { itemType: "StandardAttributeDescription", name: "ExtDimensionType1" },
      { itemType: "StandardAttributeDescription", name: "ExtDimension4" },
      { itemType: "StandardAttributeDescription", name: "ExtDimensionType4" },
    ],
  }

  const { result } = testExportPropertyToXML({
    rule,
    value: metadataItem.standardAttributes,
    metadataItem,
    referenceMetadata: undefined,
    xmlRootTag: "StandardAttributes",
  })

  expect(result).toContain('name="Recorder"')
  expect(result).toContain('name="ExtDimension1"')
  expect(result).toContain('name="ExtDimensionType1"')
  expect(result).toContain('name="ExtDimension4"')
  expect(result).toContain('name="ExtDimensionType4"')
  expect(result).not.toContain('name="ExtDimension5"')
  expect(result).not.toContain('name="ExtDimensionType5"')
  expect(result).not.toContain('name="ExtDimension50"')
  expect(result).not.toContain('name="ExtDimensionType50"')
})
```

This test documents the agreed behavior before moving the helper into the accounting register rule.

- [ ] **Step 2: Run test to verify behavior**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts
```

Expected: the new test passes because it uses the target helper inline; the next step moves the helper to the production rule.

- [ ] **Step 3: Add production helper**

In `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`, add this helper below `MetadataAccountingRegisterStandardAttributeNames`:

```ts
const extDimensionNamePattern = /^ExtDimension(Type)?\d+$/

export const MetadataAccountingRegisterStandardAttributeNamesXML = (metadataItem: unknown): Record<string, string> => {
  const explicitStandardAttributes =
    metadataItem !== null &&
    metadataItem !== undefined &&
    typeof metadataItem === "object" &&
    Array.isArray((metadataItem as { standardAttributes?: unknown }).standardAttributes)
      ? ((metadataItem as { standardAttributes: { name?: unknown }[] }).standardAttributes
          .map((item) => item.name)
          .filter((name): name is string => typeof name === "string"))
      : []

  if (explicitStandardAttributes.length === 0) return MetadataAccountingRegisterStandardAttributeNames

  const explicit = new Set(explicitStandardAttributes)

  return Object.fromEntries(
    Object.entries(MetadataAccountingRegisterStandardAttributeNames).filter(([name]) => {
      if (!extDimensionNamePattern.test(name)) return true
      return explicit.has(name)
    })
  )
}
```

Then change `standardAttributes` in `MetadataAccountingRegisterRules.properties` to:

```ts
standardAttributes: {
  yaml: "СтандартныеРеквизиты",
  type: "StandardAttributeDescriptions",
  standartAttributeNames: MetadataAccountingRegisterStandardAttributeNames,
  standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
  xmlParents: properties,
},
```

- [ ] **Step 4: Replace inline test helper with production helper**

In `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`, update the import:

```ts
import {
  MetadataAccountingRegisterStandardAttributeNames,
  MetadataAccountingRegisterStandardAttributeNamesXML,
} from "~/metadata/appliedObjects/metadataAccountingRegister/rules"
```

In the new test, replace the inline `standartAttributeNamesXML` function with:

```ts
standartAttributeNamesXML: MetadataAccountingRegisterStandardAttributeNamesXML,
```

- [ ] **Step 5: Run standard attribute tests**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/fromXML.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/fromYAML.test.ts packages/core/metadata/commonObjects/standardAttributeDescription/toYAML.test.ts
```

Expected: tests pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts \
  packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts
git commit -m "fix: :bug: не создавать лишние субконто бухгалтерии"
```

Expected: commit succeeds.

## Task 5: Update spec to match agreed implementation boundary

**Files:**
- Modify: `docs/superpowers/specs/2026-06-05-round-trip-yaml-1c-all-diffs-design.md`

- [ ] **Step 1: Edit warning section**

In `docs/superpowers/specs/2026-06-05-round-trip-yaml-1c-all-diffs-design.md`, replace the current `### Dimension и Resource бухгалтерского регистра` and `### Порядок ChildObjects бухгалтерского регистра` sections with:

````md
### Dimension и Resource бухгалтерского регистра

Предупреждения вида:

```text
Wrong property of metadata object. Property Balance is not one of metadata object Dimension
Wrong property of metadata object. Property ChoiceFoldersAndItems is not one of metadata object Resource
```

на текущем этапе не исправляются. Полный текст предупреждений сохранён в журнале `/tmp/round-trip-yaml-1c-ibcmd.log`; каждый набор повторяется по двум `Dimension` и двум `Resource`.

Причина ещё не утверждена. Гипотеза про порядок полей возможна, но требует отдельной проверки после удаления уже согласованных причин ошибок и предупреждений. Порядок коллекций `ChildObjects` для `MetadataAccountingRegisterRules` в rules уже соответствует исходной выгрузке:

```text
Dimension -> Resource -> Attribute -> Form -> Template -> Command
```

Поэтому этот план не меняет `MetadataRegisterDimensionRules` и `MetadataRegisterResourceRules`.
````

- [ ] **Step 2: Commit spec update**

Run:

```bash
git add docs/superpowers/specs/2026-06-05-round-trip-yaml-1c-all-diffs-design.md
git commit -m "docs: :memo: уточнить границу исправления предупреждений регистров"
```

Expected: commit succeeds.

## Task 6: Focused verification before full 1C load

**Files:**
- No source file changes.

- [ ] **Step 1: Run focused test groups**

Run:

```bash
pnpm vitest run \
  packages/core/metadata/commonObjects/predefinedItem/fromXML.test.ts \
  packages/core/metadata/commonObjects/predefinedItem/fromYAML.test.ts \
  packages/core/metadata/commonObjects/predefinedItem/toXML.test.ts \
  packages/core/metadata/commonObjects/predefinedItem/toYAML.test.ts \
  packages/core/metadata/commonObjects/predefined/toXML.test.ts \
  packages/core/metadata/appliedObjects/metadataEventSubscription/toXML.test.ts \
  packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Inspect tracked changes after focused tests**

Run:

```bash
git status --short
```

Expected: no generated files outside the planned source and test files. This repository does not use snapshot updates for these focused tests.

## Task 7: round-trip-yaml-1c verification on all

**Files:**
- No source file changes unless the verification exposes a regression.

- [ ] **Step 1: Run round-trip-yaml-1c on all**

Run from `/home/nikita/git/nkdk`:

```bash
NKDK_XML_DIR=/home/nikita/git/round-trip/all ./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected up to this plan boundary:

```text
nkdk import: 190 успешно, 0 с ошибкой
nkdk sync: 190 успешно, 0 с ошибкой
```

Expected improvements in `/tmp/round-trip-yaml-1c-ibcmd.log`:

```text
no Type of predefined characteristic type does not match the type of chart of characteristic types
no Event name required
no Standard attribute ExtDimension5 has not been loaded
no Standard attribute ExtDimension50 has not been loaded
```

Warnings `Wrong property of metadata object. Property ... Dimension/Resource` may remain. If they remain, record them as the next separate design problem, not as a failure of Tasks 1-5.

- [ ] **Step 2: Capture first remaining 1C warning or error**

Run:

```bash
rg -n "\\[ERROR\\]|\\[WARN\\]" /tmp/round-trip-yaml-1c-ibcmd.log
```

Expected: if output exists, the first line is copied into the implementation notes for the next cycle. The output must not contain the three fixed categories listed in Step 1.

## Task 8: Full repository verification

**Files:**
- No source file changes unless tests reveal a regression.

- [ ] **Step 1: Run full tests**

Run:

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 2: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intentional files are modified. No source XML fixtures under `/home/nikita/git/round-trip` are changed.

- [ ] **Step 3: Final commit if verification required small fixes**

If Task 8 required a small test-only or code correction, run:

```bash
git add packages/core/metadata docs/superpowers/specs/2026-06-05-round-trip-yaml-1c-all-diffs-design.md
git commit -m "test: :white_check_mark: проверить round-trip all без reference"
```

Expected: commit succeeds only when there are tracked changes from the verification fix.

## Self-Review

- Spec coverage: Tasks 1-2 cover ПВХ `Predefined.xml`; Task 3 covers `MetadataEventSubscription`; Task 4 covers `ExtDimension5..50`; Task 5 records that `Wrong property Dimension/Resource` is out of this implementation boundary; Tasks 6-8 cover verification.
- Placeholder scan: the plan contains no `TBD`, `TODO`, or unspecified implementation steps.
- Type consistency: the planned names match existing rules: `PredefinedItemRules`, `MetadataEventSubscriptionRules`, `MetadataAccountingRegisterStandardAttributeNames`, `standartAttributeNamesXML`, `StandardAttributeDescriptions`.
