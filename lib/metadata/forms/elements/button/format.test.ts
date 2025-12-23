import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { formatButton } from "./format"
import { Button } from "./types"

describe("formatButton", () => {
  it("should format button", () => {
    const element: Button = {
      elementType: FormElementType.Button,
      name: "ИмяКнопки",
      id: "1",
      title: {
        items: { ru: "Заголовок кнопки" },
      },
    }

    const expectedResult = ["<Заголовок кнопки {ИмяКнопки}>"]

    const result = formatButton(element, mockcontext)

    expect(result.strings).toEqual(expectedResult)
  })
})
