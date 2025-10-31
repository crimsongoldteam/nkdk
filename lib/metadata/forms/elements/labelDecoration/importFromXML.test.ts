import { expect, it } from "vitest"
import { importLabelDecorationFromXML } from "./importFromXML"
import { ZElementType } from "../types"
import { TLabelDecoration, TLabelDecorationXML } from "./types"
import { xmlImport } from "~/lib"

it("should import name from XML", () => {
  const mockXml = `<LabelDecoration name="Заголовок" id="1">
					<Title>
						<ru>Заголовок формы</ru>
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

  const xml = xmlImport<TLabelDecorationXML>(mockXml)

  const input = importLabelDecorationFromXML(xml)

  expect(input).toEqual(expectedResult)
})
