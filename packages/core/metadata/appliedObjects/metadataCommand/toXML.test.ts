import { describe, expect, it } from "vitest"
import { fullMetadataCommandsFromXML, minimalMetadataCommandsFromXML } from "./__fixtures__/data"
import { testExportPropertyToXML } from "../../../tests/property/exportPropertyToXML"

const rule = { type: "MetadataCommands", xml: "Command" } as const

describe("export MetadataCommands to XML", () => {
  it("should export full (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullMetadataCommandsFromXML,
      xmlRootTag: "Command",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export minimal (round-trip)", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalMetadataCommandsFromXML,
      xmlRootTag: "Command",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })

  it("should export empty string when data is undefined", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag: "Command",
      referenceMetadata: undefined,
    })
    expect(result).toEqual("")
  })
})
