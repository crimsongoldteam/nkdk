import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { commandBarIndexInsertion } from "./__fixtures__/commandBarIndexInsertion"
import { fullCommandInterface } from "./__fixtures__/full"
import { exportCommandInterfaceToXML } from "./toXML"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")

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
    const expectedResult = readXMLFileAsString("full.xml", fixturesDir)
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, fullCommandInterface)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("export commandBarIndexInsertion", () => {
    const expectedResult = readXMLFileAsString("commandBarIndexInsertion.xml", fixturesDir).trimEnd()
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, commandBarIndexInsertion)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
