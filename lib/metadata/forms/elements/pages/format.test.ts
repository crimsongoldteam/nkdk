import { expect, it, describe } from "vitest"
import "~/lib/metadata/forms/elements/inputField/registration"
import "~/lib/metadata/forms/elements/usualGroup/registration"
import { ZElementType } from "../types"
import { TInputField } from "../inputField/types"
import { formatUsualGroup } from "../usualGroup/format"
import { TUsualGroup } from "../usualGroup/types"
import { TPages } from "./types"
import { formatPages } from "./format"

describe("formatPages", () => {
  it("should format pages", () => {
    const mockElement = {
      name: "Страницы",
      id: "1",
      elementType: ZElementType.enum.Pages,
      childItems: [
        {
          name: "Группа",
          id: "1",
          elementType: ZElementType.enum.UsualGroup,
          childItems: [
            {
              name: "Элемент1",
              id: "1",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
            {
              name: "Элемент2",
              id: "2",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
          ],
        } as TUsualGroup,
      ],
    } as TPages

    const expectedResult = `//{Страницы}
  ?UsualGroup {Группа}`

    const result = formatPages(mockElement, {})

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
