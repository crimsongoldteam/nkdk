import { expect, it, describe } from "vitest"
import { importI8nTextFromXML } from "./importI8nTextFromXML"
import { TI8nText, TI8nTextXML, ZI8nTextXML } from "./types"
import { xmlImport } from "~/lib"
import z from "zod"

describe("importI8nTextFromXML", () => {
  it("should import I8nText from XML", () => {
    const xml = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`

    const expectedResult: TI8nText = {
      items: {
        ru: "Поле",
      },
    }

    const importedXml = xmlImport<{ Title: TI8nTextXML }>(xml, z.object({ Title: ZI8nTextXML }))
    const result = importI8nTextFromXML(importedXml.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import I8nText from XML with multiple languages", () => {
    const xml = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`

    const expectedResult: TI8nText = {
      items: {
        ru: "Поле",
        en: "Field",
      },
    }

    const importedXml = xmlImport<{ Title: TI8nTextXML }>(xml, z.object({ Title: ZI8nTextXML }))
    const result = importI8nTextFromXML(importedXml.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import with formatted attribute", () => {
    const xml = `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Документ находится на распознавании. Доступен только для просмотра.</v8:content>
	</v8:item>
</Title>`

    const expectedResult: TI8nText = {
      formatted: false,
      items: {
        ru: "Документ находится на распознавании. Доступен только для просмотра.",
      },
    }

    const importedXml = xmlImport<{ Title: TI8nTextXML }>(xml, z.object({ Title: ZI8nTextXML }))
    const result = importI8nTextFromXML(importedXml.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = importI8nTextFromXML(undefined)

    expect(result).toBeUndefined()
  })
})
