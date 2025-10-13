import { it, expect } from "vitest"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { TLabelDecoration } from "./types"
import { formatLabelDecoration } from "./format"

it("should format label decoration", () => {
  const element: TLabelDecoration = {
    type: ElementType.LabelDecoration,
    name: "ИмяПоля",
    id: "1",
    title: {
      ru: "Заголовок",
    },
  }

  const expectedResult = ["Заголовок {ИмяПоля}"]

  const result = formatLabelDecoration(element as TLabelDecoration, {})

  expect(result).toEqual(expectedResult)
})
