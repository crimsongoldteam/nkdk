import { describe, expect, it } from "vitest"
import { fullCommandInterface } from "~/tests/fixtures/commandInterface/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCommandInterfaceToXML } from "./toXML"

describe("exportCommandInterfaceToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandInterfaceToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty", () => {
    const result = exportCommandInterfaceToXML(mockContext, mockRule, {
      NavigationPanel: [],
      CommandBar: [],
      itemType: "CommandInterface",
    })

    expect(result).toBeUndefined()
  })

  it("should export full command interface", () => {
    const expectedResult = readXMLFileAsString("commandInterface/full.xml")
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, fullCommandInterface)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
