import { describe, expect, it } from "vitest"
import { fullFormCommands, minimalFormCommands } from "~/tests/fixtures/forms/commands/data"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCommandsToXML } from "./toXML"

describe("exportCommandToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportCommandsToXML(mockContextToXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/commands/full.xml")
    const xmlData = exportCommandsToXML(mockContextToXML(), mockRule, fullFormCommands)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/commands/minimal.xml")
    const xmlData = exportCommandsToXML(mockContextToXML(), mockRule, minimalFormCommands)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })
})
