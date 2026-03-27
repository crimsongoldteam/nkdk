import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { importContentFromXML } from "~/xml/import/importer"
import { fullAvailableFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("export AvailableFields to XML", () => {
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullAvailableFields,
      xmlRootTag: "dcsset:selection",
      path: "full.xml",
      importMetaUrl: import.meta.url,
      applyNumberingIds: false,
    })

    expect(importContentFromXML(result)).toEqual(importContentFromXML(expectedResult))
  })
})
