import { describe, expect, it } from "vitest"
import { xmlExport } from "~/lib"
import "~/lib/metadata/forms/elements/button/exportToXML"
import "~/lib/metadata/forms/elements/inputField/exportToXML"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormElementType } from "../../../metadataFactory/types"
import { exportChildItemsToXML } from "./exportToXML"
import { ChildItems } from "./types"

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
	<InputField id="1" name="Input1"/>
	<Button id="2" name="Button2"/>
	<InputField id="3" name="Input3"/>
</ChildItems>`

    const result = exportChildItemsToXML(mockConfigurationSettings, mockChildItems)

    const xml = xmlExport({ ChildItems: result }, false)
    expect(xml).toEqual(expectedResult)
  })
})
