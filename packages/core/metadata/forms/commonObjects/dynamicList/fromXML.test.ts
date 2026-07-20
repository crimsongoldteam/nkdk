import { describe, expect, it } from "vitest"
import {
  designTimeDataParametersDynamicList,
  emptyListSettingsDynamicList,
  fullDynamicList,
  keyFieldDynamicList,
  multipleCalculatedFieldsDynamicList,
  queryTextWithManualQueryFalseDynamicList,
} from "./__fixtures__/data"
import { importPropertyFromXML, PropertyRule } from "../../../orchestration"
import { withConfigurationIndexCollector } from "../../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../../configurationIndex/collector/writer"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"

const rule: PropertyRule = {
  type: "DynamicList",
}

describe("import DynamicList from XML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fullDynamicList)
  })

  it("should import empty ListSettings", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "emptyListSettings.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(emptyListSettingsDynamicList)
  })

  it("round-trip: full.xml import → export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("round-trip: minimal.xml import → export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("round-trip: emptyListSettings.xml import -> export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "emptyListSettings.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "emptyListSettings.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("round-trip: designTimeDataParameters.xml import -> export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "designTimeDataParameters.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    expect(imported).toEqual(designTimeDataParametersDynamicList)

    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "designTimeDataParameters.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("round-trip: customQuery.xml import → export", () => {
    const imported = testImportPropertyFromXML({
      rule,
      path: "customQuery.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "Settings",
      path: "customQuery.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("imports QueryText when ManualQuery is false", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "queryTextWithManualQueryFalse.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(queryTextWithManualQueryFalseDynamicList)
  })

  it("imports multiple CalculatedField nodes", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "multipleCalculatedFields.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(multipleCalculatedFieldsDynamicList)
  })

  it("imports KeyType and KeyField", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "keyField.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(keyFieldDynamicList)
  })

  it("imports XML with only KeyType and KeyField", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: {
        "_xsi:type": "DynamicList",
        KeyType: "FieldValue",
        KeyField: "Ссылка",
      },
    })

    expect(result).toEqual({
      itemType: "DynamicList",
      customQuery: false,
      keyType: "FieldValue",
      keyFields: "Ссылка",
    })
  })

  it("imports repeated KeyField nodes as keyFields array", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: {
        "_xsi:type": "DynamicList",
        KeyType: "RowKey",
        KeyField: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
      },
    })

    expect(result).toEqual({
      itemType: "DynamicList",
      customQuery: false,
      keyType: "RowKey",
      keyFields: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
    })
  })

  it("addresses DCS filter and order items under distinct YAML paths in configuration index", () => {
    const collector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML(),
      collector,
      "Документ.ДоступностьРабочихЦентров.Атрибут.Список"
    )

    importPropertyFromXML({
      context,
      rule,
      value: {
        "_xsi:type": "DynamicList",
        ManualQuery: false,
        DynamicDataRead: true,
        ListSettings: {
          "dcsset:filter": {
            "dcsset:item": {
              "_xsi:type": "dcsset:FilterItemComparison",
              "dcsset:left": { "_xsi:type": "dcscor:Field", "#text": "Ссылка" },
              "dcsset:comparisonType": "Equal",
              "dcsset:right": { "_xsi:type": "dcscor:DesignTimeValue", "#text": "Справочник.Товары.ПустаяСсылка" },
            },
          },
          "dcsset:order": {
            "dcsset:item": {
              "_xsi:type": "dcsset:OrderItemField",
              "dcsset:field": "Наименование",
              "dcsset:orderType": "Asc",
            },
          },
        },
      },
    })

    expect(collector.fragment("Документ/ДоступностьРабочихЦентров/Свойства.yaml").xmlNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Документ.ДоступностьРабочихЦентров.Атрибут.Список.Отбор.Элементы[0]",
          order: ["leftValue", "comparisonType", "rightValue"],
        }),
        expect.objectContaining({
          logicalAddress: "Документ.ДоступностьРабочихЦентров.Атрибут.Список.Порядок.Элементы[0]",
          order: ["field", "orderType"],
        }),
      ])
    )
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
})
