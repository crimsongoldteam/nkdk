import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { escapedContentI8nText, withoutTextI8nText } from "~/tests/fixtures/i8nText/data"
import { oneLangI8nText } from "~/tests/fixtures/i8nText/oneLang"
import { twoLangsI8nText } from "~/tests/fixtures/i8nText/twoLangs"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importContentFromXML } from "~/xml/import/importer"
import { importI8nTextFromXML } from "./importFromXML"
import { I8nTextXML } from "./types"

describe("importI8nTextFromXML", () => {
  it("should import I8nText from XML with one language", () => {
    const xmlData = readAndParseXMLFile<{ Title: I8nTextXML }>("i8nText/oneLang.xml")

    const expectedResult = oneLangI8nText

    const result = importI8nTextFromXML(mockСontext, xmlData.Title)

    expect(assertEquals<I8nTextXML>(xmlData.Title)).toEqual(xmlData.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import I8nText from XML with multiple languages", () => {
    const xmlData = readAndParseXMLFile<{ Title: I8nTextXML }>("i8nText/twoLangs.xml")

    const expectedResult = twoLangsI8nText

    const result = importI8nTextFromXML(mockСontext, xmlData.Title)

    expect(assertEquals<I8nTextXML>(xmlData.Title)).toEqual(xmlData.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import empty I8nText from XML", () => {
    const importedXml = importContentFromXML<{ Title: I8nTextXML }>(`<Title/>`)
    const result = importI8nTextFromXML(mockСontext, importedXml.Title)

    expect(result).toBeUndefined()
  })

  it("should import I8nText from XML without text", () => {
    const xmlData = readAndParseXMLFile<{ Title: I8nTextXML }>("i8nText/withoutText.xml")

    const result = importI8nTextFromXML(mockСontext, xmlData.Title)

    expect(result).toEqual(withoutTextI8nText)
  })

  it("should import I8nText from XML with escaped content", () => {
    const xmlData = readAndParseXMLFile<{ Title: I8nTextXML }>("i8nText/escapedContent.xml")

    const result = importI8nTextFromXML(mockСontext, xmlData.Title)

    expect(result).toEqual(escapedContentI8nText)
  })
})
