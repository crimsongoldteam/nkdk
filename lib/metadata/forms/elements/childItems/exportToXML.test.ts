import { expect, it, describe } from "vitest"
import { ZElementType } from "../types"
import { exportChildItemsToXML } from "./exportToXML"
import { importChildItemsFromXML } from "./importFromXML"
import { ZChildItems, ZChildItemsXML } from "./types"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/exportToXML"
import { xmlExport, xmlImport } from "~/lib"
import z from "zod"
import { XMLBuilder } from "fast-xml-parser"

describe("exportChildItemsToXML", () => {
  it("should export child items to XML", () => {
    const mockChildItems: z.infer<typeof ZChildItems> = [
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
<InputField id="1" name="Input1"/>
<Button id="2" name="Button2"/>
<InputField id="3" name="Input3"/>
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
