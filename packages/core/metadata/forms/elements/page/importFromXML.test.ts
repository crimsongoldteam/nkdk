import { describe, expect, it } from "vitest"
import "~/packages/core/metadata/forms/elements/elements"
import "~/packages/core/metadata/forms/elements/exportToXML"
import "~/packages/core/metadata/forms/elements/importFromXML"
import { mockСontext } from "~/packages/core/tests/mockContext"
import xmlImport from "~/packages/core/xml/import/importer"
import { FormElementType } from "../../../metadataFactory/types"
import { importPageFromXML } from "./importFromXML"
import { Page, PageXML } from "./types"

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

    const expectedResult: Page = {
      name: "Страница",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [],
      elementType: FormElementType.Page,
    }

    const xmlData = xmlImport<{ Page: PageXML }>(mockXml)

    const input = importPageFromXML(mockСontext, xmlData.Page)

    expect(input).toEqual(expectedResult)
  })
})
