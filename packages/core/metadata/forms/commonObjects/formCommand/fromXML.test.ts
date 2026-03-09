import { describe, expect, it } from "vitest"
import { fullFormCommands } from "~/tests/fixtures/forms/commands/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCommandsFromXML } from "./fromXML"
import { FormCommandXML } from "./types"

describe("importCommandFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importCommandsFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toEqual([])
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Command: FormCommandXML }>("forms/commands/full.xml")

    const result = importCommandsFromXML(mockContextFromXML(), mockRule, xmlData)
    expect(result).toEqual(fullFormCommands)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Command: FormCommandXML }>("forms/commands/minimal.xml")

    const result = importCommandsFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual([
      { itemType: "FormCommand", name: "СоставКомплектаПодобратьФайлы", title: { items: { ru: "" } } },
    ])
  })
})
