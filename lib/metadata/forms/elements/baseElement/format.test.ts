import { describe, expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { formatOtherElement } from "./format"
import { BaseElement } from "./types"

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: BaseElement = {
      elementType: FormElementType.InputField,
      name: "ИмяПоля",
      id: "1",
    }

    const expectedResult = ["?ПолеВвода {ИмяПоля}"]

    const result = formatOtherElement(element, mockСontext)

    expect(result.strings).toEqual(expectedResult)
  })
})
