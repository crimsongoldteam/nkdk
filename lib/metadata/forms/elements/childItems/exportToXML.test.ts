import { describe, expect, it } from "vitest"
import z from "zod"
import { xmlExport } from "~/lib"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import { ZElementType } from "../types"
import { exportChildItemsToXML } from "./exportToXML"
import { ZChildItemsXML } from "./types"
import { TChildItems } from "./typesExt"

describe("exportChildItemsToXML", () => {
  it("should export child items to XML", () => {
    const mockChildItems: TChildItems = [
      {
        name: "Input1",
        id: "1",
        elementType: ZElementType.enum.InputField,
      },
      {
        name: "Button2",
        id: "2",
        elementType: ZElementType.enum.Button,
      },
      {
        name: "Input3",
        id: "3",
        elementType: ZElementType.enum.InputField,
      },
    ]

    const expectedResult = `<ChildItems>
	<InputField name="Input1" id="1"/>
	<Button name="Button2" id="2"/>
	<InputField name="Input3" id="3"/>
</ChildItems>`

    const result = exportChildItemsToXML(mockChildItems)

    const xml = xmlExport(
      { ChildItems: result },
      z.object({ ChildItems: ZChildItemsXML }),
      false
    )
    expect(xml).toEqual(expectedResult)
  })
})
