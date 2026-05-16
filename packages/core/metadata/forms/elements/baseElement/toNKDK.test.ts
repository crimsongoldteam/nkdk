import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { CommandBarChildItem, OtherElement } from "../../commonObjects/childItems/types"
import { exportCommandBarChildItemsToNKDK } from "../../commonObjects/childItems/toNKDK"
import { exportOtherElementToNKDK } from "./toNKDK"
import { NamedElement } from "./types"

describe("formatOtherElement", () => {
  it("should format element", () => {
    const element: NamedElement = {
      itemType: "InputField",
      name: "ИмяПоля",
    }

    const expectedResult = ["?ПолеВвода ИмяПоля"]

    const result = exportOtherElementToNKDK({ context: mockContext, element: element as OtherElement })

    expect(result.strings).toEqual(expectedResult)
  })

  it("should format ordinary view status addition in command bar child items", () => {
    const element: CommandBarChildItem = {
      itemType: "ViewStatusAddition",
      name: "СписокСостояниеПросмотра",
    }

    const result = exportCommandBarChildItemsToNKDK(mockContext, [element])

    expect(result.strings).toEqual(["?ОтображениеСостоянияПросмотра СписокСостояниеПросмотра"])
  })
})
