import { describe, expect, it } from "vitest"
import "~/lib/metadata/forms/elements/inputField/registration"
import { mockcontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { InputField } from "../inputField/types"
import { formatPage } from "./format"
import { Page } from "./types"

describe("formatPage", () => {
  it("should format page", () => {
    const mockElement: Page = {
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
    }

    const expectedResult = `/{Страница1}
  {Элемент1}: `

    const result = formatPage(mockElement, mockcontext)
    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
