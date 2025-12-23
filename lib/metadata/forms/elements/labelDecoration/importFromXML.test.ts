import { expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { FormElementType } from "../../../metadataFactory/types"
import { importLabelDecorationFromXML } from "./importFromXML"
import { LabelDecoration, LabelDecorationXML } from "./types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

it("should import name from XML", () => {
  const mockXml = `<LabelDecoration name="Заголовок" id="1">
					<Title>
						<v8:item>
							<v8:lang>ru</v8:lang>
							<v8:content>Заголовок формы</v8:content>
						</v8:item>
					</Title>
				</LabelDecoration>`

  const expectedResult: LabelDecoration = {
    name: "Заголовок",
    elementType: FormElementType.LabelDecoration,
    title: {
      items: { ru: "Заголовок формы" },
    },
    id: "1",
  }

  const xml = xmlImport<{ LabelDecoration: LabelDecorationXML }>(mockXml)

  const input = importLabelDecorationFromXML(mockConfigurationSettings, xml.LabelDecoration)

  expect(input).toEqual(expectedResult)
})
