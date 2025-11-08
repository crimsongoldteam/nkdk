import { it, expect, describe } from "vitest"
import "~/lib/metadata/forms/elements/elements"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/exportToXML"
import xmlImport from "~/lib/xml/import/importer"
import { TPage, TPageXML, ZPageXML } from "./types"
import { ZElementType } from "../types"
import { importPageFromXML } from "./importFromXML"
import z from "zod"

describe("importPageFromXML", () => {
  it("should import Page from XML", () => {
    const mockXml = `	<Page name="Страница" id="1">
    <Title>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Заголовок группы</v8:content>
      </v8:item>
    </Title>
  </Page>`

    const expectedResult: TPage = {
      name: "Страница",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [],
      elementType: ZElementType.enum.Page,
    }

    const xmlData = xmlImport<{ Page: TPageXML }>(
      mockXml,
      z.object({ Page: ZPageXML })
    )

    const input = importPageFromXML(xmlData.Page)

    expect(input).toEqual(expectedResult)
  })
})
