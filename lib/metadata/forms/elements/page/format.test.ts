import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/inputField/registration"
import { InputField } from "../inputField/types"
import { FormElementType } from "../types"
import { formatPage } from "./format"
import { Page } from "./types"

const configurationSettings: ConfigurationSettings = {
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
