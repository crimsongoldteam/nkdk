import { describe, expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { formatLabelDecoration } from "./format"
import { LabelDecoration } from "./types"

describe("formatLabelDecoration", () => {
  it("should format label decoration", () => {
    const element: LabelDecoration = {
      elementType: FormElementType.LabelDecoration,
      name: "ИмяПоля",
      id: "1",
      title: {
        items: { ru: "Заголовок" },
      },
    }

    const expectedResult = ["Заголовок {ИмяПоля}"]

    const result = formatLabelDecoration(element as LabelDecoration, mockСontext)

    expect(result.strings).toEqual(expectedResult)
  })
})
