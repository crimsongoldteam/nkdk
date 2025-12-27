import { expect, it } from "vitest"
import { xmlImport } from "~/packages/core"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { importPagesFromXML } from "./importFromXML"
import { Pages, PagesXML } from "./types"

it("should import pages from XML", () => {
  const mockXml = `	<Pages name="Страницы" id="1">
    <Title>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Заголовок страниц</v8:content>
      </v8:item>
    </Title>
    <ChildItems/>
  </Pages>`

  const mockResult: Pages = {
    name: "Страницы",
    title: { items: { ru: "Заголовок страниц" } },
    id: "1",
    childItems: [],
    elementType: FormElementType.Pages,
  }

  const xmlData = xmlImport<{ Pages: PagesXML }>(mockXml)

  const result = importPagesFromXML(mockСontext, xmlData.Pages)

  expect(result).toEqual(mockResult)
})
