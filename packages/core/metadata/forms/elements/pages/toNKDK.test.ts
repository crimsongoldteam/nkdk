import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { mockContext } from "~/tests/mockContext"
import { exportPagesToNKDK } from "./toNKDK"
import { Pages } from "./types"

describe("exportPagesToStructure", () => {
  it("should format pages", () => {
    const mockElement: Pages = {
      name: "Страницы",
      itemType: CollectionFormElementType.Pages,
      childItems: [
        {
          name: "Страница1",
          itemType: CollectionFormElementType.Page,
          childItems: [
            {
              name: "Элемент1",
              itemType: CollectionFormElementType.InputField,
            },
          ],
        },
      ],
    }

    const expectedResult = `//%Страницы
  /%Страница1
    %Элемент1: `

    const result = exportPagesToNKDK({ context: mockContext, element: mockElement })

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
