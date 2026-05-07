import { describe, expect, it } from "vitest"
import { fullFromXML, minimalFromXML, multipleFromXML } from "./__fixtures__/data"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataAttributes", xml: "Attribute" } as const

describe("export MetadataAttributes to XML", () => {
  it("should export minimal (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalFromXML,
      xmlRootTag: "Attribute",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export multiple (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: multipleFromXML,
      xmlRootTag: "Attribute",
      path: "multiple.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export full (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullFromXML,
      xmlRootTag: "Attribute",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export empty string when data is undefined", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "Attribute",
      referenceMetadata: undefined,
    })
    expect(result).toEqual("")
  })
})
