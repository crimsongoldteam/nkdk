import { expect, it, describe } from "vitest"
import "~/lib/metadata/forms/elements/inputField/registration"
import "~/lib/metadata/forms/elements/usualGroup/registration"
import "~/lib/metadata/forms/elements/page/registration"
import { ZElementType } from "../types"
import { TInputField } from "../inputField/types"
import { TPages } from "./types"
import { formatPages } from "./format"
import { TPage } from "../page/types"

describe("formatPages", () => {
  it("should format pages", () => {
    const mockElement = {
      name: "Страницы",
      id: "1",
      elementType: ZElementType.enum.Pages,
      childItems: [
        {
          name: "Страница1",
          id: "1",
          elementType: ZElementType.enum.Page,
          childItems: [
            {
              name: "Элемент1",
              id: "1",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
          ],
        } as TPage,
      ],
    } as TPages

    const expectedResult = `//{Страницы}
  /{Страница1}
    {Элемент1}:`

    const result = formatPages(mockElement, {})

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
