import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { FormElementType } from "../types"
import { formatLabelDecoration } from "./format"
import { LabelDecoration } from "./types"

describe("formatLabelDecoration", () => {
  it("should format label decoration", () => {
    const element: LabelDecoration = {
      elementType: FormElementType.LabelDecoration,
      name: "ИмяПоля",
      id: "1",
      title: {
        items: { ru: "Заголовок" },
      },
    }

    const expectedResult = ["Заголовок {ИмяПоля}"]

    const result = formatLabelDecoration(
      element as LabelDecoration,
      mockConfigurationSettings
    )

    expect(result.strings).toEqual(expectedResult)
  })
})
