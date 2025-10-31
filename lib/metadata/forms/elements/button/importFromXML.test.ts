import { expect, it } from "vitest"
import { importButtonFromXML } from "./importFromXML"
import { ZElementType } from "../types"
import { TButton, TButtonXML } from "./types"
import { xmlImport } from "~/lib"

it("should import button from XML", () => {
  const mockXml = `<Button name="КнопкаОК" id="1">
					<Title>
						<ru>ОК</ru>
					</Title>
				</Button>`

  const expectedResult: TButton = {
    name: "КнопкаОК",
    elementType: ZElementType.enum.Button,
    title: {
      ru: "ОК",
    },
    id: "1",
  }

  const xml = xmlImport<TButtonXML>(mockXml)

  const input = importButtonFromXML(xml)

  expect(input).toEqual(expectedResult)
})
