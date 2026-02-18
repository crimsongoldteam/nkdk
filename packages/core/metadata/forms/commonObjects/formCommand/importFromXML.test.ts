import { describe, expect, it } from "vitest"
import { fullFormCommands, minimalFormCommands } from "~/tests/fixtures/forms/commands/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCommandsFromXML } from "./importFromXML"
import { FormCommandXML } from "./types"

describe("importCommandFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importCommandsFromXML(mockContext, mockRule, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Command: FormCommandXML }>("forms/commands/full.xml")

    const result = importCommandsFromXML(mockContext, mockRule, xmlData.Command)
    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Command: FormCommandXML }>("forms/commands/minimal.xml")

    const result = importCommandsFromXML(mockContext, mockRule, xmlData.Command)

    expect(result).toEqual(minimalFormCommands)
  })
})
