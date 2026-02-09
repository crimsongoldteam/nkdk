import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { exportPagesToStructure } from "./exportToStructure"
import { Pages } from "./types"

describe("exportPagesToStructure", () => {
  it("should format pages", () => {
    const mockElement: Pages = {
      name: "Страницы",
      elementType: FormElementType.Pages,
      childItems: [
        {
          name: "Страница1",
          elementType: FormElementType.Page,
          childItems: [
            {
              name: "Элемент1",
              elementType: FormElementType.InputField,
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
