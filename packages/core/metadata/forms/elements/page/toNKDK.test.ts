import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { mockContext } from "~/tests/mockContext"
import { InputField } from "../inputField/types"
import { exportPageToNKDK } from "./toNKDK"
import { Page } from "./types"

describe("exportPageToStructure", () => {
  it("should format page", () => {
    const mockElement: Page = {
      name: "Страница1",
      itemType: CollectionFormElementType.Page,
      childItems: [
        {
          name: "Элемент1",
          itemType: CollectionFormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `/%Страница1
  %Элемент1: `

    const result = exportPageToNKDK({ context: mockContext, element: mockElement })
    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
