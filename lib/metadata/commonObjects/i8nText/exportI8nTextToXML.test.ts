import { expect, it, describe } from "vitest"
import { exportI8nTextToXML } from "./exportI8nTextToXML"
import { importI8nTextFromXML } from "./importI8nTextFromXML"
import { TI8nText, TI8nTextXML, ZI8nTextXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportI8nTextToXML", () => {
  it("should export I8nText to XML", () => {
    const mockI8nText: TI8nText = {
      ru: "Поле",
    }
    const mockXml: TI8nTextXML = [{ "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } }]

    const i8nXMLText = exportI8nTextToXML(mockI8nText)
    expect(i8nXMLText).toEqual(mockXml)
  })

  it("should export I8nText to XML with multiple languages", () => {
    const mockI8nText: TI8nText = {
      ru: "Поле",
      en: "Field",
    }
    const mockXml: TI8nTextXML = [
      { "v8:item": { "v8:lang": "ru", "v8:content": "Поле" } },
      { "v8:item": { "v8:lang": "en", "v8:content": "Field" } },
    ]

    const result = exportI8nTextToXML(mockI8nText)

    expect(result).toEqual(mockXml)
  })

  it("should return undefined for undefined input", () => {
    const result = exportI8nTextToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import I8nText correctly (round-trip)", () => {
    const originalXml = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`

    const xml = xmlImport<{ Title: TI8nTextXML }>(originalXml, z.object({ Title: ZI8nTextXML }))
    const imported = importI8nTextFromXML(xml.Title)
    const exported = exportI8nTextToXML(imported)
    const resultXml = xmlExport({ Title: exported }, z.object({ Title: ZI8nTextXML }), false)

    expect(resultXml).toEqual(originalXml)
  })

  it("should export and import I8nText with single language correctly (round-trip)", () => {
    const originalXml = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`

    const xml = xmlImport<{ Title: TI8nTextXML }>(originalXml, z.object({ Title: ZI8nTextXML }))
    const imported = importI8nTextFromXML(xml.Title)
    const exported = exportI8nTextToXML(imported)
    const resultXml = xmlExport({ Title: exported }, z.object({ Title: ZI8nTextXML }), false)

    expect(resultXml).toEqual(originalXml)
  })
})
