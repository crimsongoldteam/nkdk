import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
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
})
