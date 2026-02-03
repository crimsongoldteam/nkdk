import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { exportOtherElementToStructure } from "./exportToStructure"
import { NamedElement } from "./types"

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: NamedElement = {
      elementType: FormElementType.InputField,
      name: "ИмяПоля",
    }

    const expectedResult = ["?ПолеВвода {ИмяПоля}"]

    const result = exportOtherElementToStructure(mockContext, undefined, element)

    expect(result.strings).toEqual(expectedResult)
  })
})
