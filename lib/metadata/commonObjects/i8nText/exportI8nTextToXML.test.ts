import { expect, it, describe } from "vitest"
import { exportI8nTextToXML } from "./exportI8nTextToXML"
import { TI8nText, ZI8nTextXML } from "./types"
import { xmlExport } from "~/lib"
import z from "zod"

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

    const originalContent: TI8nText = {
      formatted: false,
      items: {
        ru: "Поле",
        en: "Field",
      },
    }

    const exported = exportI8nTextToXML(originalContent)

    const xml = xmlExport(
      { Title: exported },
      z.object({ Title: ZI8nTextXML }),
      false
    )

    expect(xml).toEqual(expectedResult)
  })

  it("should export without formatted attribute", () => {
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

    const xml = xmlExport(
      { Title: exported },
      z.object({ Title: ZI8nTextXML }),
      false
    )

    expect(xml).toEqual(expectedResult)
  })
})
