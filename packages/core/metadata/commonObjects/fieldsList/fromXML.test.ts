import { describe, expect, it } from "vitest"
import { fullFieldsList } from "~/metadata/commonObjects/fieldsList/__fixtures__/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importFieldsListFromXML } from "./fromXML"
import { FieldsListXML } from "./types"

describe("importFieldsListFromXML", () => {
  it("should return undefined when xml is undefined", () => {
    const result = importFieldsListFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xml = readAndParseXMLFile<{ UseAlways: FieldsListXML }>("fieldsList/full.xml")

    const result = importFieldsListFromXML(mockContextFromXML(), mockRule, xml.UseAlways)

    expect(result).toEqual(fullFieldsList)
  })
})
