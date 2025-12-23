import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { oneLangI8nText } from "~/lib/tests/fixtures/i8nText/oneLang"
import { twoLangsI8nText } from "~/lib/tests/fixtures/i8nText/twoLangs"
import { mockСontext } from "~/lib/tests/mockContext"
import { readXMLFileAsString } from "~/lib/tests/readAndParseXMLFile"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportI8nTextToXML } from "./exportToXML"
import { I8nTextXML } from "./types"

describe("exportI8nTextToXML", () => {
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
})
