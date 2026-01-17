import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { emptyItemsI8nText, escapedContentI8nText, withoutTextI8nText } from "~/tests/fixtures/i8nText/data"
import { oneLangI8nText } from "~/tests/fixtures/i8nText/oneLang"
import { twoLangsI8nText } from "~/tests/fixtures/i8nText/twoLangs"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "./exportToXML"
import { I8nTextXML } from "./types"

describe("exportI8nTextToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportI8nTextToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export I8nText to XML", () => {
    const expectedResult = readXMLFileAsString("i8nText/twoLangs.xml")

    const originalContent = twoLangsI8nText

    const exported = exportI8nTextToXML(mockСontext, originalContent)

    const xml = xmlExport({ Title: exported }, false)

    expect(assertEquals<I8nTextXML>(exported)).toEqual(exported)

    expect(xml).toEqual(expectedResult)
  })

  it("should export without formatted attribute", () => {
    const expectedResult = readXMLFileAsString("i8nText/oneLang.xml").trimEnd()

    const originalContent = oneLangI8nText

    const exported = exportI8nTextToXML(mockСontext, originalContent)

    const xml = xmlExport({ Title: exported }, false)

    expect(xml.trimEnd()).toEqual(expectedResult)
  })

  it("should export I8nText with escaped content", () => {
    const expectedResult = readXMLFileAsString("i8nText/escapedContent.xml")

    const originalContent = escapedContentI8nText

    const exported = exportI8nTextToXML(mockСontext, originalContent)

    const xml = xmlExport({ Title: exported }, false)

    expect(xml).toEqual(expectedResult)
  })
})

describe("exportI8nTextToXMLWithDefaultLanguage", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportI8nTextToXMLWithDefaultLanguage(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when I8nText is empty (empty items)", () => {
    const result = exportI8nTextToXMLWithDefaultLanguage(mockСontext, emptyItemsI8nText)

    expect(result).toBeUndefined()
  })

  it("should return undefined when I8nText is empty (default language with empty string)", () => {
    const result = exportI8nTextToXMLWithDefaultLanguage(mockСontext, withoutTextI8nText)

    expect(result).toBeUndefined()
  })

  it("should export I8nText to XML when it has non-empty default language", () => {
    const expectedResult = readXMLFileAsString("i8nText/oneLang.xml").trimEnd()

    const exported = exportI8nTextToXMLWithDefaultLanguage(mockСontext, oneLangI8nText)

    const xml = xmlExport({ Title: exported }, false)
    expect(xml).toEqual(expectedResult)
  })

  it("should export I8nText to XML when it has multiple languages including default", () => {
    const expectedResult = readXMLFileAsString("i8nText/twoLangs.xml")

    const exported = exportI8nTextToXMLWithDefaultLanguage(mockСontext, twoLangsI8nText)

    expect(exported).toBeDefined()
    expect(assertEquals<I8nTextXML>(exported!)).toEqual(exported)

    const xml = xmlExport({ Title: exported }, false)
    expect(xml).toEqual(expectedResult)
  })
})
