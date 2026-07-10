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
