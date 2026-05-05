import { describe, expect, it, vi } from "vitest"
import { defaultMetadataCommands, fullMetadataCommands } from "~/tests/fixtures/metadataCommand/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportMetadataCommandsToXML } from "./toXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

describe("exportMetadataCommandsToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCommandsToXML(mockContextToXML(), { type: "MetadataCommands" }, undefined)

    expect(result).toBeUndefined()
  })

  it("should export metadata command with all fields to XML", () => {
    const expectedResult = readXMLFileAsString("metadataCommand/full.xml")
    const result = exportMetadataCommandsToXML(mockContextToXML(), { type: "MetadataCommands" }, fullMetadataCommands)

    const xmlString = xmlExport({ Command: result }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export defaults nodes to XML", () => {
    const expectedResult = readXMLFileAsString("metadataCommand/defaults.xml")

    const result = exportMetadataCommandsToXML(
      mockContextToXML(),
      { type: "MetadataCommands" },
      defaultMetadataCommands
    )

    const xmlString = xmlExport({ Command: result }, false)

    expect(xmlString).toEqual(expectedResult)
  })
})
