import { describe, expect, it } from "vitest"
import { fullFormCommands, minimalFormCommands } from "~/tests/fixtures/forms/commands/data"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { setIdsToElements } from "../../clientApplicationForm/toXML"
import { exportCommandsToXML } from "./toXML"

describe("exportCommandToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportCommandsToXML(mockContextToXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const context = mockContextToXML()
    const expectedResult = readXMLFileAsString("forms/commands/full.xml")
    const xmlData = exportCommandsToXML(context, mockRule, fullFormCommands)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/commands/minimal.xml")

    const context = mockContextToXML()

    const xmlData = exportCommandsToXML(context, mockRule, minimalFormCommands)

    setIdsToElements(context)

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })
})
