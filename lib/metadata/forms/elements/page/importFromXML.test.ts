import { it, expect } from "vitest"
import xmlImport from "~/lib/xml/import/importer"
import { TPage, TPageXML } from "./types"
import { ZElementType } from "../types"
import { importPageFromXML } from "./importFromXML"

it("should import Page from XML", () => {
  const mockXml = `	<Page name="Страница" id="1">
    <Title>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Заголовок группы</v8:content>
      </v8:item>
    </Title>
  </Page>`

  const mockResult: TPage = {
    name: "Страница",
    title: { ru: "Заголовок группы" },
    id: "1",
    childItems: [],
    elementType: ZElementType.enum.Page,
  }

  const xmlData = xmlImport<{ Page: TPageXML }>(mockXml)

  const input = importPageFromXML(xmlData.Page)

  expect(input).toEqual(mockResult)
})
