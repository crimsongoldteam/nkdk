import { describe, expect, it } from "vitest"
import "~/lib/metadata/forms/elements/inputField/registration"
import "~/lib/metadata/forms/elements/page/registration"
import "~/lib/metadata/forms/elements/usualGroup/registration"
import { FormElementType } from "../types"
import { formatPages } from "./format"
import { InputField } from "../inputField/types"
import { Page } from "../page/types"
import { Pages } from "./types"

describe("formatPages", () => {
  it("should format pages", () => {
    const mockElement = {
      name: "Страницы",
      id: "1",
      elementType: FormElementType.Pages,
      childItems: [
        {
          name: "Страница1",
          id: "1",
          elementType: FormElementType.Page,
          childItems: [
            {
              name: "Элемент1",
              id: "1",
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as Page,
      ],
    } as Pages

    const expectedResult = `//{Страницы}
  /{Страница1}
    {Элемент1}: `

    const result = formatPages(mockElement, {})

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
