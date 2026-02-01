import { describe, expect, it } from "vitest"
import { fullPage, minimalPage } from "~/tests/fixtures/forms/page/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importPageFromXML } from "./importFromXML"
import { PageXML } from "./types"

describe("importPageFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importPageFromXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ Page: PageXML }>("forms/page/full.xml")

    const result = importPageFromXML(mockContext, xmlData.Page)

    expect(result).toEqual(fullPage)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ Page: PageXML }>("forms/page/minimal.xml")

    const result = importPageFromXML(mockContext, xmlData.Page)

    expect(result).toEqual(minimalPage)
  })
})
