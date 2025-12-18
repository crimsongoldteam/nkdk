import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportI8nTextToXML } from "./exportToXML"
import { I8nText } from "./types"

describe("exportI8nTextToXML", () => {
  it("should export I8nText to XML", () => {
    const expectedResult = `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`

    const originalContent: I8nText = {
      formatted: false,
      items: {
        ru: "Поле",
        en: "Field",
      },
    }

    const exported = exportI8nTextToXML(originalContent, mockConfigurationSettings)

    const xml = xmlExport({ Title: exported }, false)

    expect(xml).toEqual(expectedResult)
  })

  it("should export without formatted attribute", () => {
    const expectedResult = `<Title>
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`

    const originalContent: I8nText = {
      items: {
        ru: "Поле",
      },
    }

    const exported = exportI8nTextToXML(originalContent, mockConfigurationSettings)

    const xml = xmlExport({ Title: exported }, false)

    expect(xml).toEqual(expectedResult)
  })
})
