import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { InputField } from "../inputField/types"
import { exportPageToStructure } from "./exportToStructure"
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

    const expectedResult = `/{Страница1}
  {Элемент1}: `

    const result = exportPageToStructure(mockContext, mockElement)
    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
