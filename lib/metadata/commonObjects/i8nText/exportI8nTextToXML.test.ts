import { expect, it, describe } from "vitest"
import { exportI8nTextToXML } from "./exportI8nTextToXML"
import { importI8nTextFromXML } from "./importI8nTextFromXML"
import { TI8nText, TI8nTextXML, ZI8nTextXML } from "./types"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"

describe("exportI8nTextToXML", () => {
  it("should export I8nText to XML", () => {
    const expectedResult = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`

    const originalContent: TI8nText = {
      items: {
        ru: "Поле",
      },
    }

    const exported = exportI8nTextToXML(originalContent)

    const xml = xmlExport({ Title: exported }, z.object({ Title: ZI8nTextXML }), false)

    expect(xml).toEqual(expectedResult)
  })

  it("should export I8nText to XML with multiple languages", () => {
    const expectedResult = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`

    const originalContent: TI8nText = {
      items: {
        ru: "Поле",
        en: "Field",
      },
    }

    const exported = exportI8nTextToXML(originalContent)

    const xml = xmlExport({ Title: exported }, z.object({ Title: ZI8nTextXML }), false)

    expect(xml).toEqual(expectedResult)
  })

  it("should export with formatted attribute", () => {
    const expectedResult = `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Документ находится на распознавании. Доступен только для просмотра.</v8:content>
	</v8:item>
</Title>`

    const originalContent: TI8nText = {
      formatted: false,
      items: {
        ru: "Документ находится на распознавании. Доступен только для просмотра.",
      },
    }

    const exported = exportI8nTextToXML(originalContent)

    const xml = xmlExport({ Title: exported }, z.object({ Title: ZI8nTextXML }), false)

    expect(xml).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportI8nTextToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import I8nText correctly (round-trip)", () => {
    const expectedResult = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`

    const originalContent: TI8nText = {
      items: {
        ru: "Поле",
        en: "Field",
      },
    }

    const exported = exportI8nTextToXML(originalContent)
    const xml = xmlExport({ Title: exported }, z.object({ Title: ZI8nTextXML }), false)

    const importedXml = xmlImport<{ Title: TI8nTextXML }>(xml, z.object({ Title: ZI8nTextXML }))
    const imported = importI8nTextFromXML(importedXml.Title)
    const reExported = exportI8nTextToXML(imported)
    const resultXml = xmlExport({ Title: reExported }, z.object({ Title: ZI8nTextXML }), false)

    expect(resultXml).toEqual(expectedResult)
  })

  it("should export and import I8nText with single language correctly (round-trip)", () => {
    const expectedResult = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`

    const originalContent: TI8nText = {
      items: {
        ru: "Поле",
      },
    }

    const exported = exportI8nTextToXML(originalContent)
    const xml = xmlExport({ Title: exported }, z.object({ Title: ZI8nTextXML }), false)

    const importedXml = xmlImport<{ Title: TI8nTextXML }>(xml, z.object({ Title: ZI8nTextXML }))
    const imported = importI8nTextFromXML(importedXml.Title)
    const reExported = exportI8nTextToXML(imported)
    const resultXml = xmlExport({ Title: reExported }, z.object({ Title: ZI8nTextXML }), false)

    expect(resultXml).toEqual(expectedResult)
  })
})
