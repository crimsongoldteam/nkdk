import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/inputField/registration"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { InputField } from "../inputField/types"
import { exportUsualGroupToStructure } from "./exportToStructure"
import { UsualGroup } from "./types"

describe("exportUsualGroupToStructure", () => {
  it("should format one-line group", () => {
    const mockElement: UsualGroup = {
      name: "Группа",
      elementType: FormElementType.UsualGroup,
      childItems: [
        {
          name: "Элемент1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `%{Группа} {Элемент1}: ; {Элемент2}: `

    const result = exportUsualGroupToStructure(mockСontext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})

it("should format vertical group", () => {
  const mockElement: UsualGroup = {
    name: "Группа",
    group: "Vertical",
    title: { items: { ru: "Заголовок группы" } },
    elementType: FormElementType.UsualGroup,
    childItems: [
      {
        name: "Элемент1",
        elementType: FormElementType.InputField,
      } as InputField,
      {
        name: "Элемент2",
        elementType: FormElementType.InputField,
      } as InputField,
    ],
  }

  const expectedResult = `#Заголовок группы {Группа}
  {Элемент1}: 
  {Элемент2}: `

  const result = exportUsualGroupToStructure(mockСontext, mockElement)

  expect(result.strings.join("\n")).toEqual(expectedResult)
})
