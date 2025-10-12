import { expect, it } from "vitest"
import { formatUsualGroup } from "./format"
import { TUsualGroup } from "./types"
import "~/lib/metadata/forms/elements/inputField/registration"
import { ElementType } from "~/lib/metadata/systemEnumerations/types"
import { TInputField } from "../inputField/types"

it("should format one-line group", () => {
  const mockElement: TUsualGroup = {
    name: "Группа",
    id: "1",
    type: ElementType.UsualGroup,
    childItems: [
      { name: "Элемент1", id: "1", type: ElementType.InputField } as TInputField,
      { name: "Элемент2", id: "2", type: ElementType.InputField } as TInputField,
    ],
  }

  const expectedResult = `{Группа}
Элемент1: {Элемент1} & Элемент2: {Элемент2}`

  const result = formatUsualGroup(mockElement, {})

  expect(result.join("\n")).toEqual(expectedResult)
})

// it("should format vertical group", () => {
//   const mockElement: TUsualGroup = {
//     name: "Группа",
//     group: "Vertical",
//     type: ElementType.UsualGroup,
//     id: "1",
//     childItems: [
//       { name: "Элемент1", id: "1", type: ElementType.InputField },
//       { name: "Элемент2", id: "2", type: ElementType.InputField },
//     ],
//   }

//   const expectedResult = `#Группа
//   Элемент1:
//   Элемент2:`

//   const result = formatUsualGroup(mockElement, {})

//   expect(result).toEqual([expectedResult])
// })
