import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportPagesToStructure } from "./exportToStructure"
import { Pages } from "./types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

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

    const expectedResult = `//{Страницы}
  /{Страница1}
    {Элемент1}: `

    const result = exportPagesToStructure(mockContext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
