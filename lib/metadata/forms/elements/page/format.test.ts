import { expect, it, describe } from "vitest"
import "~/lib/metadata/forms/elements/inputField/registration"
import { TInputField } from "../inputField/types"
import { ZElementType } from "../types"
import { formatPage } from "./format"
import { TPage } from "./types"
describe("formatPage", () => {
  it("should format page", () => {
    const mockElement: TPage = {
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
    }

    const expectedResult = `/{Страница1}
  {Элемент1}: `

    const result = formatPage(mockElement, {})

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
