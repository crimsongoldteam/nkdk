import { expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { ZElementType } from "../types"
import { TPages, TPagesXML } from "./types"
import { importPagesFromXML } from "./importFromXML"
import z from "zod"
import { ZPagesXML } from "./types"

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

  const mockResult: TPages = {
    name: "Страницы",
    title: { ru: "Заголовок страниц" },
    id: "1",
    childItems: [],
    elementType: ZElementType.enum.Pages,
  }

  const xmlData = xmlImport<{ Pages: TPagesXML }>(mockXml, z.object({ Pages: ZPagesXML }))

  const result = importPagesFromXML(xmlData.Pages)

  expect(result).toEqual(mockResult)
})
