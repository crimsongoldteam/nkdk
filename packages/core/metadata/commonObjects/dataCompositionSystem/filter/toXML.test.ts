import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { importContentFromXML } from "~/xml/import/importer"
import { fullFilterForExport } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
}

describe("export Filter to XML", () => {
  it("exports full to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: fullFilterForExport,
      xmlRootTag: "dcsset:filter",
    })

    expect(expectedResult).toBeUndefined()
    expect(importContentFromXML(result)).toEqual({
      "dcsset:filter": {
        "dcsset:item": {
          "_xsi:type": "dcsset:FilterItemComparison",
          "dcsset:left": {
            "_xsi:type": "dcscor:Field",
            "#text": "Поле1",
          },
          "dcsset:comparisonType": "Contains",
          "dcsset:right": {
            "_xsi:type": "xs:string",
          },
        },
        "dcsset:userSettingPresentation": "Представление отбора",
      },
    })
  })
})
