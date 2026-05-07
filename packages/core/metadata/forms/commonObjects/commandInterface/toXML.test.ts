import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { mockContext, mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { commandBarIndexInsertion } from "./__fixtures__/commandBarIndexInsertion"
import { commandGroupReferenceOrder } from "./__fixtures__/commandGroupReferenceOrder"
import { indexedItemOrderSwap } from "./__fixtures__/indexedItemOrderSwap"
import { fullCommandInterface } from "./__fixtures__/full"
import { importCommandInterfaceFromXML } from "./fromXML"
import { exportCommandInterfaceToXML } from "./toXML"
import { CommandInterfaceXML } from "./types"

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

  it("export indexedItemOrderSwap", () => {
    const expectedResult = readXMLFileAsString("indexedItemOrderSwap.xml", fixturesDir).trimEnd()
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, indexedItemOrderSwap)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("export commandGroupReferenceOrder with reference order", () => {
    const expectedResult = readXMLFileAsString("commandGroupReferenceOrder.xml", fixturesDir).trimEnd()
    const referenceXML = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "commandGroupReferenceOrder.xml",
      fixturesDir
    )
    const referenceData = importCommandInterfaceFromXML(
      mockContextFromXML({ forReference: true }),
      mockRule,
      referenceXML.CommandInterface
    )
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, commandGroupReferenceOrder, referenceData)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("export commandGroupReferenceOrder without reference uses fallback order", () => {
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, commandGroupReferenceOrder)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toContain(
      [
        "\t\t\t<Command>Catalog.ДоговорыКонтрагентов.Command.ДоговорКонтрагентаВводНаОсновании</Command>",
        "\t\t\t<Type>Auto</Type>",
        "\t\t\t<Index>1</Index>",
        "\t\t\t<DefaultVisible>false</DefaultVisible>",
        "\t\t\t<CommandGroup>FormCommandBarCreateBasedOn</CommandGroup>",
      ].join("\n")
    )
  })
})
