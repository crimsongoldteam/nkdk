import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/inputField/registration"
import "~/metadata/forms/elements/page/registration"
import "~/metadata/forms/elements/usualGroup/registration"
import { mockСontext } from "~/tests/mockContext"
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

    const result = formatPages(mockСontext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
