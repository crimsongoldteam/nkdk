import { describe, expect, it } from "vitest"
import { fullMetadataCommandsFromXML, minimalMetadataCommandsFromXML } from "./__fixtures__/data"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataCommands", xml: "Command" } as const

describe("import MetadataCommands from XML", () => {
  it("should import full", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "Command",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(fullMetadataCommandsFromXML)
  })

  it("should import minimal", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "minimal.xml",
      xmlRootTag: "Command",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(minimalMetadataCommandsFromXML)
  })

  it("should return undefined when data is undefined", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: "<Root/>",
      xmlRootTag: "Root",
    })
    expect(result).toBeUndefined()
  })

  it("full.xml round-trip: import then export should match source", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullMetadataCommandsFromXML,
      xmlRootTag: "Command",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
})
