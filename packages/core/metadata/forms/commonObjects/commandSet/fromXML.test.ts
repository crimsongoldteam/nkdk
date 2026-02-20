import { describe, expect, it } from "vitest"
import { multipleCommandSet, singleCommandSet } from "~/tests/fixtures/forms/commandSet/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCommandSetFromXML } from "./fromXML"
import { CommandSetXML } from "./types"

describe("importCommandSetFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCommandSetFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single command set", () => {
    const xmlData = readAndParseXMLFile<{ CommandSet: CommandSetXML }>("forms/commandSet/single.xml")

    const result = importCommandSetFromXML(mockContext, mockRule, xmlData.CommandSet)

    expect(result).toEqual(singleCommandSet)
  })

  it("should import multiple command sets", () => {
    const xmlData = readAndParseXMLFile<{ CommandSet: CommandSetXML }>("forms/commandSet/multiple.xml")

    const result = importCommandSetFromXML(mockContext, mockRule, xmlData.CommandSet)

    expect(result).toEqual(multipleCommandSet)
  })
})
