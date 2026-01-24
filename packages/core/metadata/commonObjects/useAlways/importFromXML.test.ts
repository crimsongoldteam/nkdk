import { describe, expect, it } from "vitest"
import { fullUseAlways } from "~/tests/fixtures/useAlways/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importUseAlwaysFromXML } from "./importFromXML"
import { UseAlwaysXML } from "./types"

describe("importUseAlwaysFromXML", () => {
  it("should return undefined when xml is undefined", () => {
    const result = importUseAlwaysFromXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full", () => {
    const xml = readAndParseXMLFile<{ UseAlways: UseAlwaysXML }>("useAlways/full.xml")

    const result = importUseAlwaysFromXML(mockСontext, xml.UseAlways)

    expect(result).toEqual(fullUseAlways)
  })
})
