import { describe, expect, it } from "vitest"
import { fullFieldsList } from "~/tests/fixtures/fieldsList/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFieldsListFromXML } from "./importFromXML"
import { FieldsListXML } from "./types"

describe("importFieldsListFromXML", () => {
  it("should return undefined when xml is undefined", () => {
    const result = importFieldsListFromXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xml = readAndParseXMLFile<{ UseAlways: FieldsListXML }>("fieldsList/full.xml")

    const result = importFieldsListFromXML(mockContext, mockRule, xml.UseAlways)

    expect(result).toEqual(fullFieldsList)
  })
})
