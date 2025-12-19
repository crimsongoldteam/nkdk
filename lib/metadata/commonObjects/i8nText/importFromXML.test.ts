import { readFileSync } from "fs"
import { join } from "path"
import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { twoLangsI8nText } from "~/tests/fixtures/i8nText/twoLangs"
import { importI8nTextFromXML } from "./importFromXML"
import { I8nText, I8nTextXML } from "./types"

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
    const result = importI8nTextFromXML(importedXml.Title, mockConfigurationSettings)

    expect(assertEquals<I8nTextXML>(importedXml.Title)).toEqual(importedXml.Title)
    expect(result).toEqual(expectedResult)
  })

  it("should import I8nText from XML with multiple languages", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/i8nText/twoLangs.xml"), "utf-8")

    const expectedResult = twoLangsI8nText

    const importedXml = xmlImport<{ Title: I8nTextXML }>(xml)

    const result = importI8nTextFromXML(importedXml.Title, mockConfigurationSettings)

    expect(assertEquals<I8nTextXML>(importedXml.Title)).toEqual(importedXml.Title)

    expect(result).toEqual(expectedResult)
  })

  it("should import empty I8nText from XML", () => {
    const originalContent = `<Title/>`

    const importedXml = xmlImport<{ Title: I8nTextXML }>(originalContent)
    const result = importI8nTextFromXML(importedXml.Title, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })
})
