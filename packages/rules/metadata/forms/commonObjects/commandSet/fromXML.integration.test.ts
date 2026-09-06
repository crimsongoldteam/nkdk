import { describe, expect, it } from "vitest"
import { multipleCommandSet, singleCommandSet } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { importCommandSetFromXML } from "./fromXML"
import { CommandSetXML } from "./types"
import { readFileSync } from "node:fs"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"

describe("importCommandSetFromXML", () => {
  it.each([["single", singleCommandSet], ["multiple", multipleCommandSet]] as const)(
    "читает состав команд непосредственно из узлов: %s", (file, expected) => {
      const root = parseStructuralXMLWithoutCompatibility(readFileSync(new URL(`./__fixtures__/${file}.xml`, import.meta.url), "utf8"))
      expect(importCommandSetFromXML(mockContextFromXML(), mockRule, root)).toEqual(expected)
    },
  )
  it("should return undefined when data is undefined", () => {
    const result = importCommandSetFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single command set", () => {
    const xmlData = readAndParseXMLFile<{ CommandSet: CommandSetXML }>("forms/commandSet/single.xml")

    const result = importCommandSetFromXML(mockContextFromXML(), mockRule, xmlData.CommandSet)

    expect(result).toEqual(singleCommandSet)
  })

  it("should import multiple command sets", () => {
    const xmlData = readAndParseXMLFile<{ CommandSet: CommandSetXML }>("forms/commandSet/multiple.xml")

    const result = importCommandSetFromXML(mockContextFromXML(), mockRule, xmlData.CommandSet)

    expect(result).toEqual(multipleCommandSet)
  })
})
