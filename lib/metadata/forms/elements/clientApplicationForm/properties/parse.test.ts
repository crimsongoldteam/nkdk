import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/rules"
import { TBaseElement } from "../../baseElement/types"
import { TInputField } from "../../inputField/types"
import { FormElementType } from "../../types"
import { parseProperties } from "./parse"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseProperties", () => {
  it("should parse properties", () => {
    const mockContent = `ПолеВвода:
  ТолькоПросмотр: Истина`

    const elementsMap: Record<string, TBaseElement> = {
      ПолеВвода: {
        elementType: FormElementType.InputField,
        name: "ПолеВвода",
        id: "1",
      },
    }

    const expectedResult: Record<string, TBaseElement> = {
      ПолеВвода: {
        elementType: FormElementType.InputField,
        name: "ПолеВвода",
        id: "1",
        readOnly: true,
      } as TInputField,
    }

    const result = parseProperties(
      mockContent,
      elementsMap,
      configurationSettings
    )

    expect(result).toEqual(expectedResult)
  })
})
