import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"
import { mockContext } from "~/tests/mockContext"
import { exportOtherElementToStructure } from "./exportToStructure"
import { NamedElement } from "./types"

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: NamedElement = {
      itemType: FormElementType.InputField,
      name: "ИмяПоля",
    }

    const expectedResult = ["?ПолеВвода {ИмяПоля}"]

    const result = exportOtherElementToStructure(mockContext, element)

    expect(result.strings).toEqual(expectedResult)
  })
})
