import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { FormElementType } from "../types"
import { formatLabelDecoration } from "./format"
import { LabelDecoration } from "./types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

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
      configurationSettings
    )

    expect(result.strings).toEqual(expectedResult)
  })
})
