import { describe, expect, it } from "vitest"
import { importButtonFromXML } from "./importFromXML"
import { ZElementType } from "../types"
import { TButton, TButtonXML } from "./types"
import { xmlImport } from "~/lib"
import z from "zod"
import { ZButtonXML } from "./types"

describe("importButtonFromXML", () => {
  it("should import button from XML", () => {
    const mockXml = `<Button name="КнопкаОК" id="1">
					<Title>
						<v8:item>
							<v8:lang>ru</v8:lang>
							<v8:content>ОК</v8:content>
						</v8:item>
					</Title>
				</Button>`

    const expectedResult: TButton = {
      name: "КнопкаОК",
      elementType: ZElementType.enum.Button,
      title: {
        items: { ru: "ОК" },
      },
      id: "1",
    }

    const xml = xmlImport<{ Button: TButtonXML }>(
      mockXml,
      z.object({ Button: ZButtonXML })
    )

    const result = importButtonFromXML(xml.Button)

    expect(result).toEqual(expectedResult)
  })
})
