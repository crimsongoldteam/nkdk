import { describe, expect, it } from "vitest"
import { fullCommands, minimalCommands } from "~/tests/fixtures/forms/commands/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCommandsFromXML } from "./importFromXML"
import { CommandXML } from "./types"

describe("importCommandFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importCommandsFromXML(mockСontext, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Command: CommandXML }>("forms/commands/full.xml")

    const result = importCommandsFromXML(mockСontext, xmlData.Command)
    expect(result).toEqual(fullCommands)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Command: CommandXML }>("forms/commands/minimal.xml")

    const result = importCommandsFromXML(mockСontext, xmlData.Command)

    expect(result).toEqual(minimalCommands)
  })
})
