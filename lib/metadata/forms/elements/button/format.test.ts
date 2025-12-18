import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
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

    const result = formatButton(element, mockConfigurationSettings)

    expect(result.strings).toEqual(expectedResult)
  })
})
