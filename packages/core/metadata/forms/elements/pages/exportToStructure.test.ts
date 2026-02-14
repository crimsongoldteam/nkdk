import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"
import { mockContext } from "~/tests/mockContext"
import { exportPagesToStructure } from "./exportToStructure"
import { Pages } from "./types"

describe("exportPagesToStructure", () => {
  it("should format pages", () => {
    const mockElement: Pages = {
      name: "Страницы",
      itemType: FormElementType.Pages,
      childItems: [
        {
          name: "Страница1",
          itemType: FormElementType.Page,
          childItems: [
            {
              name: "Элемент1",
              itemType: FormElementType.InputField,
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
