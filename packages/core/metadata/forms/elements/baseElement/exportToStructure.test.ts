import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { exportOtherElementToStructure } from "./exportToStructure"
import { BaseElement } from "./types"

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: BaseElement = {
      elementType: FormElementType.InputField,
      name: "ИмяПоля",
      id: "1",
    }

    const expectedResult = ["?ПолеВвода {ИмяПоля}"]

    const result = exportOtherElementToStructure(mockСontext, element)

    expect(result.strings).toEqual(expectedResult)
  })
})
