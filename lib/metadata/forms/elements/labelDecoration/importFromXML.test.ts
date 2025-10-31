import { expect, it } from "vitest"
import { importLabelDecorationFromXML } from "./importFromXML"
import { ZElementType } from "../types"
import { TLabelDecoration, TLabelDecorationXML } from "./types"
import { xmlImport } from "~/lib"
import z from "zod"
import { ZLabelDecorationXML } from "./types"

it("should import name from XML", () => {
  const mockXml = `<LabelDecoration name="Заголовок" id="1">
					<Title>
						<v8:item>
							<v8:lang>ru</v8:lang>
							<v8:content>Заголовок формы</v8:content>
						</v8:item>
					</Title>
				</LabelDecoration>`

  const expectedResult: TLabelDecoration = {
    name: "Заголовок",
    elementType: ZElementType.enum.LabelDecoration,
    title: {
      ru: "Заголовок формы",
    },
    id: "1",
  }

  const xml = xmlImport<{ LabelDecoration: TLabelDecorationXML }>(
    mockXml,
    z.object({ LabelDecoration: ZLabelDecorationXML })
  )

  const input = importLabelDecorationFromXML(xml.LabelDecoration)

  expect(input).toEqual(expectedResult)
})
