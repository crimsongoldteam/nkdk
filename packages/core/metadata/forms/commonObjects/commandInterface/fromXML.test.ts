import { describe, expect, it } from "vitest"
import { fullCommandInterface } from "~/tests/fixtures/commandInterface/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCommandInterfaceFromXML } from "./fromXML"
import { CommandInterfaceXML } from "./types"

describe("importCommandInterfaceFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import full command interface", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>("commandInterface/full.xml")

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(fullCommandInterface)
  })
})
