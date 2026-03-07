import { describe, expect, it } from "vitest"

import { mockContext } from "~/tests/mockContext"
import { exportPagesToNKDK } from "./toNKDK"
import { Pages } from "./types"

describe("exportPagesToStructure", () => {
  it("should format pages", () => {
    const mockElement: Pages = {
      name: "Страницы",
      itemType: "Pages",
      childItems: [
        {
          name: "Страница1",
          itemType: "Page",
          childItems: [
            {
              name: "Элемент1",
              itemType: "InputField",
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
