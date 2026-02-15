import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCommandsToXML } from "./exportToXML"

describe("exportCommandToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportCommandsToXML({ context: mockContext, rule: mockRule, value: undefined })

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/commands/full.xml")
    const xmlData = exportCommandsToXML({ context: mockContext, rule: mockRule, value: fullCommands })

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/commands/minimal.xml")
    const xmlData = exportCommandsToXML({ context: mockContext, rule: mockRule, value: minimalCommands })

    const result = xmlExport(xmlData!, false)

    expect(result).toEqual(expectedResult)
  })
})
