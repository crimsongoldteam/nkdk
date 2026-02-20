import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { mockContext } from "~/tests/mockContext"
import { exportOtherElementToStructure } from "./exportToStructure"
import { NamedElement } from "./types"
import { OtherElement } from "../../collections/childItems/types"

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: NamedElement = {
      itemType: CollectionFormElementType.InputField,
      name: "ИмяПоля",
    }

    const expectedResult = ["?ПолеВвода {ИмяПоля}"]

    const result = exportOtherElementToStructure(mockContext, element as OtherElement)

    expect(result.strings).toEqual(expectedResult)
  })
})
