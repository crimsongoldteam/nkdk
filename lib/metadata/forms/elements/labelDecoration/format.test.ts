import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ZElementType } from "../types"
import { formatLabelDecoration } from "./format"
import { TLabelDecoration } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatLabelDecoration", () => {
  it("should format label decoration", () => {
    const element: TLabelDecoration = {
      elementType: ZElementType.enum.LabelDecoration,
      name: "ИмяПоля",
      id: "1",
      title: {
        items: { ru: "Заголовок" },
      },
    }

    const expectedResult = ["Заголовок {ИмяПоля}"]

    const result = formatLabelDecoration(
      element as TLabelDecoration,
      configurationSettings
    )

    expect(result.strings).toEqual(expectedResult)
  })
})
