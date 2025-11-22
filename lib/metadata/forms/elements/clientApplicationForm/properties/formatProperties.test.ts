import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/rules"
import { ZElementType } from "../../types"
import { TClientApplicationForm } from "../types"
import { formatProperties } from "./formatProperties"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatProperties", () => {
  it("should format properties with child items", () => {
    const form: TClientApplicationForm = {
      elementType: ZElementType.enum.ClientApplicationForm,
      childItems: [
        {
          name: "ПолеВвода",
          id: "1",
          elementType: ZElementType.enum.InputField,
          readOnly: true,
        },
      ],
    }

    const expectedResult = [
      `ПолеВвода:
  ТолькоПросмотр: Истина`,
    ]

    const properties = formatProperties(form.childItems, configurationSettings)

    expect(properties).toEqual(expectedResult)
  })
})
