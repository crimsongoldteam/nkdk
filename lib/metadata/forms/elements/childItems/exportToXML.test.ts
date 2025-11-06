import { expect, it, describe } from "vitest"
import { ZElementType } from "../types"
import { exportChildItemsToXML } from "./exportToXML"
import { ZChildItems, ZChildItemsXML } from "./types"
import { xmlExport } from "~/lib"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/exportToXML"
import z from "zod"

describe("exportChildItemsToXML", () => {
  it("should export child items to XML", () => {
    const mockChildItems: z.infer<typeof ZChildItems> = [
      {
        name: "Input1",
        id: "1",
        elementType: ZElementType.enum.InputField,
      },
      {
        name: "Input 2",
        id: "2",
        elementType: ZElementType.enum.Button,
      },
    ]

    const expectedResult = `<ChildItems>
<InputField name="Input1" id="1"/>
<InputField name="Input2" id="2"/>
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
