import { describe, expect, it } from "vitest"
import { xmlExport } from "~/lib"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import { FormElementType } from "../../../metadataFactory/types"
import { exportChildItemsToXML } from "./exportToXML"
import { ChildItems } from "./types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

describe("exportChildItemsToXML", () => {
  it("should export child items to XML", () => {
    const mockChildItems: ChildItems = [
      {
        name: "Input1",
        id: "1",
        elementType: FormElementType.InputField,
      },
      {
        name: "Button2",
        id: "2",
        elementType: FormElementType.Button,
      },
      {
        name: "Input3",
        id: "3",
        elementType: FormElementType.InputField,
      },
    ]

    const expectedResult = `<ChildItems>
	<InputField name="Input1" id="1"/>
	<Button name="Button2" id="2"/>
	<InputField name="Input3" id="3"/>
</ChildItems>`

    const result = exportChildItemsToXML(mockChildItems, mockConfigurationSettings)

    const xml = xmlExport({ ChildItems: result })
    expect(xml).toEqual(expectedResult)
  })
})
