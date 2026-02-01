import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToStructure"
import { mockContext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { InputField } from "../inputField/types"
import { exportPageToStructure } from "./exportToStructure"
import { Page } from "./types"

describe("exportPageToStructure", () => {
  it("should format page", () => {
    const mockElement: Page = {
      name: "Страница1",
      elementType: FormElementType.Page,
      childItems: [
        {
          name: "Элемент1",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `/{Страница1}
  {Элемент1}: `

    const result = exportPageToStructure(mockContext, mockElement)
    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
