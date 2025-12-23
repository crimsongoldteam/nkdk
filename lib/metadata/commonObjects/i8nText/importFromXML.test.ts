import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { oneLangI8nText } from "~/lib/tests/fixtures/i8nText/oneLang"
import { twoLangsI8nText } from "~/lib/tests/fixtures/i8nText/twoLangs"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importI8nTextFromXML } from "./importFromXML"
import { I8nTextXML } from "./types"

describe("importI8nTextFromXML", () => {
  it("should import I8nText from XML with one language", () => {
    const xmlData = readAndParseXMLFile<{ Title: I8nTextXML }>("i8nText/oneLang.xml")

    const expectedResult = oneLangI8nText

    const result = importI8nTextFromXML(mockConfigurationSettings, xmlData.Title)

    expect(assertEquals<I8nTextXML>(xmlData.Title)).toEqual(xmlData.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import I8nText from XML with multiple languages", () => {
    const xmlData = readAndParseXMLFile<{ Title: I8nTextXML }>("i8nText/twoLangs.xml")

    const expectedResult = twoLangsI8nText

    const result = importI8nTextFromXML(mockConfigurationSettings, xmlData.Title)

    expect(assertEquals<I8nTextXML>(xmlData.Title)).toEqual(xmlData.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import empty I8nText from XML", () => {
    const importedXml = xmlImport<{ Title: I8nTextXML }>(`<Title/>`)
    const result = importI8nTextFromXML(mockConfigurationSettings, importedXml.Title)

    expect(result).toBeUndefined()
  })
})
