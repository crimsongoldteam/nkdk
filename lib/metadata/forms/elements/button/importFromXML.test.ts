import { describe, expect, it } from "vitest"
import xmlImport from "~/lib/xml/import/importer"
import { FormElementType } from "../../../metadataFactory/types"
import { importButtonFromXML } from "./importFromXML"
import { Button, ButtonXML } from "./types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

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

    const expectedResult: Button = {
      name: "КнопкаОК",
      elementType: FormElementType.Button,
      title: {
        items: { ru: "ОК" },
      },
      id: "1",
    }

    const xml = xmlImport<{ Button: ButtonXML }>(mockXml)

    const result = importButtonFromXML(xml.Button, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
