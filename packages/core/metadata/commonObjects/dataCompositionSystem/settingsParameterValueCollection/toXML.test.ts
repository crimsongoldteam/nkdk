import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToXML } from "../../../../tests/property/exportPropertyToXML"
import { settingsParameterValueCollectionFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "SettingsParameterValueCollection",
  defaultItemRule: {
    type: "SettingsParameterValue",
    valueType: "Field",
  },
}

describe("export SettingsParameterValueCollection to XML", () => {
  it("exports full fixture", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: settingsParameterValueCollectionFixture,
      xmlRootTag: "dcsset:dataParameters",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports ent system enumeration values under generic Field rule", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: {
        itemType: "SettingsParameterValueCollection",
        parameters: {
          ВидДвижения: {
            parameter: "ВидДвижения",
            use: false,
            value: {
              type: "SystemEnumeration",
              typeSE: "AccumulationRecordType",
              value: "Receipt",
            },
          },
        },
      },
      xmlRootTag: "dcsset:dataParameters",
      referenceMetadata: undefined,
    })

    expect(result).toContain('<dcscor:item xsi:type="dcsset:SettingsParameterValue">')
    expect(result).toContain("<dcscor:use>false</dcscor:use>")
    expect(result).toContain("<dcscor:parameter>ВидДвижения</dcscor:parameter>")
    expect(result).toContain('<dcscor:value xsi:type="ent:AccumulationRecordType">Receipt</dcscor:value>')
  })
})
