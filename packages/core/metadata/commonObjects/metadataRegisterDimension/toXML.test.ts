import { describe, expect, it } from "vitest"
import { dimensionsFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataRegisterDimensions", xml: "Dimension" } as const

describe("export MetadataRegisterDimensions to XML", () => {
  it("round-trips register dimensions", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: dimensionsFromXML,
      xmlRootTag: "Dimension",
      path: "dimensions.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
