import { expect, it } from "vitest"
import importButtonFromXML from "./importFromXML"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { TButton, TButtonXML } from "./types"
import { xmlImport } from "~/lib"

it("should import button from XML", () => {
  const mockXml = `<Button name="КнопкаОК" id="1">
					<Title>
						<ru>ОК</ru>
					</Title>
					<ToolTip>
						<ru>Нажмите для подтверждения</ru>
					</ToolTip>
					<Action>ОК</Action>
				</Button>`

  const expectedResult: TButton = {
    name: "КнопкаОК",
    type: ElementType.Button,
    title: {
      ru: "ОК",
    },
    toolTip: {
      ru: "Нажмите для подтверждения",
    },
    action: "ОК",
    id: "1",
  }

  const xml = xmlImport<TButtonXML>(mockXml)

  const input = importButtonFromXML(xml)

  expect(input).toEqual(expectedResult)
})
