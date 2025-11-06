import { expect, it, describe } from "vitest"
import "~/lib/metadata/forms/elements/inputField/registration"
import { ZElementType } from "../types"
import { TInputField } from "../inputField/types"
import { formatUsualGroup } from "../usualGroup/format"
import { TUsualGroup } from "../usualGroup/types"

describe("formatOneLineGroup", () => {
  it("should format one-line group", () => {
    const mockElement: TUsualGroup = {
      name: "Группа",
      id: "1",
      elementType: ZElementType.enum.UsualGroup,
      childItems: [
        { name: "Элемент1", id: "1", elementType: ZElementType.enum.InputField } as TInputField,
        { name: "Элемент2", id: "2", elementType: ZElementType.enum.InputField } as TInputField,
      ],
    }

    const expectedResult = `{Группа}
Элемент1: {Элемент1} & Элемент2: {Элемент2}`

    const result = formatUsualGroup(mockElement, {})

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})

it("should format vertical group", () => {
  const mockElement: TUsualGroup = {
    name: "Группа",
    group: "Vertical",
    title: { items: { ru: "Заголовок группы" } },
    elementType: ZElementType.enum.UsualGroup,
    id: "1",
    childItems: [
      { name: "Элемент1", id: "1", elementType: ZElementType.enum.InputField } as TInputField,
      { name: "Элемент2", id: "2", elementType: ZElementType.enum.InputField } as TInputField,
    ],
  }

  const expectedResult = `#Заголовок группы {Группа}
Элемент1: {Элемент1}
Элемент2: {Элемент2}`

  const result = formatUsualGroup(mockElement, {})

  expect(result.strings.join("\n")).toEqual(expectedResult)
})
