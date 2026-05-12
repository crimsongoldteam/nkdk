import { describe, expect, it } from "vitest"
import {
  emptyListSettingsDynamicList,
  fullDynamicList,
  keyFieldDynamicList,
  minimalDynamicList,
  multipleCalculatedFieldsDynamicList,
  queryTextWithManualQueryFalseDynamicList,
} from "~/metadata/forms/commonObjects/dynamicList/__fixtures__/data"
import { exportPropertyToXML, PropertyRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule: PropertyRule = {
  type: "DynamicList",
}

describe("export DynamicList to XML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: undefined,
    })
    expect(result).toBeUndefined()
  })

  it("should export full to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullDynamicList,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export minimal to XML", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalDynamicList,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export empty ListSettings", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: emptyListSettingsDynamicList,
      path: "emptyListSettings.xml",
      xmlRootTag: "Settings",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

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

  it("exports KeyType and KeyField", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: keyFieldDynamicList,
      xmlRootTag: "Settings",
      path: "keyField.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("fresh export keeps QueryText, KeyType, KeyField, ListSettings order", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: keyFieldDynamicList,
      xmlRootTag: "Settings",
      referenceMetadata: undefined,
    })

    const queryTextIndex = result.indexOf("<QueryText>")
    const keyTypeIndex = result.indexOf("<KeyType>FieldValue</KeyType>")
    const keyFieldIndex = result.indexOf("<KeyField>Ссылка</KeyField>")
    const listSettingsIndex = result.indexOf("<ListSettings/>")

    expect(queryTextIndex).toBeGreaterThan(-1)
    expect(keyTypeIndex).toBeGreaterThan(queryTextIndex)
    expect(keyFieldIndex).toBeGreaterThan(keyTypeIndex)
    expect(listSettingsIndex).toBeGreaterThan(keyFieldIndex)
  })
})
