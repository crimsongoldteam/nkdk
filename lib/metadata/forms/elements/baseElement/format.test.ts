import { it, expect } from "vitest"
import { ZElementType } from "../types"
import { TBaseElement } from "./types"
import { formatOtherElement } from "./format"

it("should format element", () => {
  const element: TBaseElement = {
    elementType: ZElementType.enum.InputField,
    name: "ИмяПоля",
    id: "1",
  }

  const expectedResult = ["?InputField {ИмяПоля}"]

  const result = formatOtherElement(element as TBaseElement, {})

  expect(result).toEqual(expectedResult)
})
