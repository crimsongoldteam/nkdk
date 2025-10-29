import { it, expect } from "vitest"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { TNamedElement } from "./types"
import { formatOtherElement } from "./format"

it("should format element", () => {
  const element: TNamedElement = {
    type: ElementType.InputField,
    name: "ИмяПоля",
    id: "1",
  }

  const expectedResult = ["?InputField {ИмяПоля}"]

  const result = formatOtherElement(element as TNamedElement, {})

  expect(result).toEqual(expectedResult)
})
