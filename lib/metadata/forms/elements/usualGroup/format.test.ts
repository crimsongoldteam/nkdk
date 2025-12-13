import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/inputField/registration"
import { TInputField } from "../inputField/types"
import { FormElementType } from "../types"
import { formatUsualGroup } from "./format"
import { TUsualGroup } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatUsualGroup", () => {
  it("should format one-line group", () => {
    const mockElement: TUsualGroup = {
      name: "Группа",
      id: "1",
      elementType: FormElementType.UsualGroup,
      childItems: [
        {
          name: "Элемент1",
          id: "1",
          elementType: FormElementType.InputField,
        } as TInputField,
        {
          name: "Элемент2",
          id: "2",
          elementType: FormElementType.InputField,
        } as TInputField,
      ],
    }

    const expectedResult = `%{Группа} {Элемент1}: ; {Элемент2}: `

    const result = formatUsualGroup(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})

it("should format vertical group", () => {
  const mockElement: TUsualGroup = {
    name: "Группа",
    group: "Vertical",
    title: { items: { ru: "Заголовок группы" } },
    elementType: FormElementType.UsualGroup,
    id: "1",
    childItems: [
      {
        name: "Элемент1",
        id: "1",
        elementType: FormElementType.InputField,
      } as TInputField,
      {
        name: "Элемент2",
        id: "2",
        elementType: FormElementType.InputField,
      } as TInputField,
    ],
  }

  const expectedResult = `#Заголовок группы {Группа}
  {Элемент1}: 
  {Элемент2}: `

  const result = formatUsualGroup(mockElement, configurationSettings)

  expect(result.strings.join("\n")).toEqual(expectedResult)
})
