import { describe, expect, it } from "vitest"
import "~/packages/core/metadata/forms/elements/inputField/registration"
import "~/packages/core/metadata/forms/elements/page/registration"
import "~/packages/core/metadata/forms/elements/usualGroup/registration"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { InputField } from "../inputField/types"
import { Page } from "../page/types"
import { formatPages } from "./format"
import { Pages } from "./types"

describe("formatPages", () => {
  it("should format pages", () => {
    const mockElement: Pages = {
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
    }

    const expectedResult = `//{Страницы}
  /{Страница1}
    {Элемент1}: `

    const result = formatPages(mockElement, mockСontext)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
