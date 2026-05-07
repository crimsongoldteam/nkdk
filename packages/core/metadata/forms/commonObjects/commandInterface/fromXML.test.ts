import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { commandBarIndexInsertion } from "./__fixtures__/commandBarIndexInsertion"
import { commandGroupReferenceOrder } from "./__fixtures__/commandGroupReferenceOrder"
import { indexedItemOrderSwap } from "./__fixtures__/indexedItemOrderSwap"
import { fullCommandInterface } from "./__fixtures__/full"
import { importCommandInterfaceFromXML } from "./fromXML"
import { CommandInterfaceXML } from "./types"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")

describe("importCommandInterfaceFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import full command interface", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>("full.xml", fixturesDir)

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(fullCommandInterface)
  })

  it("import commandBarIndexInsertion", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "commandBarIndexInsertion.xml",
      fixturesDir
    )

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(commandBarIndexInsertion)
  })

  it("import indexedItemOrderSwap", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "indexedItemOrderSwap.xml",
      fixturesDir
    )

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(indexedItemOrderSwap)
  })

  it("import commandGroupReferenceOrder", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "commandGroupReferenceOrder.xml",
      fixturesDir
    )

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(commandGroupReferenceOrder)
  })
})
