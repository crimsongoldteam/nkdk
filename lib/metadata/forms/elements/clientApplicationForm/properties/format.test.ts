import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/rules"
import { FormElementType } from "../../types"
import { ClientApplicationForm } from "../types"
import { formatProperties } from "./format"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatProperties", () => {
  it("should format properties with child items", () => {
    const form: ClientApplicationForm = {
      elementType: FormElementType.ClientApplicationForm,
      childItems: [
        {
          name: "ПолеВвода",
          id: "1",
          elementType: FormElementType.InputField,
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
