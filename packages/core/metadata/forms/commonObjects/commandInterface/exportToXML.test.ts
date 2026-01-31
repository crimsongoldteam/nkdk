import { describe, expect, it } from "vitest"
import { fullCommandInterface } from "~/tests/fixtures/commandInterface/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCommandInterfaceToXML } from "./exportToXML"

describe("exportCommandInterfaceToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandInterfaceToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty", () => {
    const result = exportCommandInterfaceToXML(mockСontext, {
      NavigationPanel: [],
      CommandBar: [],
    })

    expect(result).toBeUndefined()
  })

  it("should export full command interface", () => {
    const expectedResult = readXMLFileAsString("commandInterface/full.xml")
    const xmlData = exportCommandInterfaceToXML(mockСontext, fullCommandInterface)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
