import { describe, expect, it } from "vitest"
import "~/lib/metadata/forms/elements/elements"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import { mockcontext } from "~/lib/tests/mockContext"
import xmlImport from "~/lib/xml/import/importer"
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

    const input = importPageFromXML(mockcontext, xmlData.Page)

    expect(input).toEqual(expectedResult)
  })
})
