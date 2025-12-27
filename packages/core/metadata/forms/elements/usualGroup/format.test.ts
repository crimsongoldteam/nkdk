import { describe, expect, it } from "vitest"
import "~/packages/core/metadata/forms/elements/inputField/registration"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { InputField } from "../inputField/types"
import { formatUsualGroup } from "./format"
import { UsualGroup } from "./types"

describe("formatUsualGroup", () => {
  it("should format one-line group", () => {
    const mockElement: UsualGroup = {
      name: "Группа",
      id: "1",
      elementType: FormElementType.UsualGroup,
      childItems: [
        {
          name: "Элемент1",
          id: "1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          id: "2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `%{Группа} {Элемент1}: ; {Элемент2}: `

    const result = formatUsualGroup(mockElement, mockСontext)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})

it("should format vertical group", () => {
  const mockElement: UsualGroup = {
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
      } as InputField,
      {
        name: "Элемент2",
        id: "2",
        elementType: FormElementType.InputField,
      } as InputField,
    ],
  }

  const expectedResult = `#Заголовок группы {Группа}
  {Элемент1}: 
  {Элемент2}: `

  const result = formatUsualGroup(mockElement, mockСontext)

  expect(result.strings.join("\n")).toEqual(expectedResult)
})
