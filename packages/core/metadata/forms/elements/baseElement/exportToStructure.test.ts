import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { mockContext } from "~/tests/mockContext"
import { OtherElement } from "../../commonObjects/childItems/types"
import { exportOtherElementToNKDK } from "./exportToStructure"
import { NamedElement } from "./types"

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: NamedElement = {
      itemType: CollectionFormElementType.InputField,
      name: "ИмяПоля",
    }

    const expectedResult = ["?ПолеВвода %ИмяПоля"]

    const result = exportOtherElementToNKDK({ context: mockContext, element: element as OtherElement })

    expect(result.strings).toEqual(expectedResult)
  })
})
