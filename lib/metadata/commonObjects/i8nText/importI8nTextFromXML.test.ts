import { expect, it, describe } from "vitest"
import { importI8nTextFromXML } from "./importI8nTextFromXML"
import { I8nText, I8nTextXML } from "./types"
import { xmlImport } from "~/lib"

describe("importI8nTextFromXML", () => {
  it("should import I8nText from XML with one language", () => {
    const xml = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item></Title>`

    const expectedResult: I8nText = {
      items: {
        ru: "Поле",
      },
    }

    const importedXml = xmlImport<{ Title: I8nTextXML }>(xml)
    const result = importI8nTextFromXML(importedXml.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import I8nText from XML with multiple languages", () => {
    const xml = `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`

    const expectedResult: I8nText = {
      items: {
        ru: "Поле",
        en: "Field",
      },
    }

    const importedXml = xmlImport<{ Title: I8nTextXML }>(xml)
    const result = importI8nTextFromXML(importedXml.Title)

    expect(result).toEqual(expectedResult)
  })
})
