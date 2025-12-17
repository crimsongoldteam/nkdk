import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/inputField/registration"
import { FormElementType } from "../types"
import { formatPage } from "./format"
import { Page } from "./types"
import { InputField } from "../inputField/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

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

    const result = formatPage(mockElement, configurationSettings)
    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
