import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullDCSParameters, minimalDCSParameters } from "./__fixtures__/data"

const rule: PropertyRule = { type: "DCSParameter" }

describe("export DCSParameter to XML", () => {
  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalDCSParameters,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: minimalDCSParameters,
    })
    expect(result).toEqual(expectedResult)
  })

  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullDCSParameters,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: fullDCSParameters,
    })
    expect(result).toEqual(expectedResult)
  })
})
