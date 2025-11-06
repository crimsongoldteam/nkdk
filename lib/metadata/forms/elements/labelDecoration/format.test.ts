import { it, expect } from "vitest"
import { ZElementType } from "../types"
import { TLabelDecoration } from "./types"
import { formatLabelDecoration } from "./format"

it("should format label decoration", () => {
  const element: TLabelDecoration = {
    elementType: ZElementType.enum.LabelDecoration,
    name: "ИмяПоля",
    id: "1",
    title: {
      items: { ru: "Заголовок" },
    },
  }

  const expectedResult = ["Заголовок {ИмяПоля}"]

  const result = formatLabelDecoration(element as TLabelDecoration, {})

  expect(result).toEqual(expectedResult)
})
