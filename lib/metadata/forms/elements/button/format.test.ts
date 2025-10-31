import { it, expect } from "vitest"
import { ZElementType } from "~/lib/metadata/forms/elements/types"
import { TButton } from "./types"
import { formatButton } from "./format"

it("should format button", () => {
  const element: TButton = {
    type: ZElementType.enum.Button,
    name: "ИмяКнопки",
    id: "1",
    title: {
      ru: "Заголовок кнопки",
    },
  }

  const expectedResult = ["<Заголовок кнопки {ИмяКнопки}>"]

  const result = formatButton(element as TButton, {})

  expect(result).toEqual(expectedResult)
})
