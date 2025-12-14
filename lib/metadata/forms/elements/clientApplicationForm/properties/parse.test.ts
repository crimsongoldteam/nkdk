import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import "~/lib/metadata/forms/elements/rules"
import { BaseElement } from "../../baseElement/types"
import { InputField } from "../../inputField/types"
import { FormElementType } from "../../types"
import { parseProperties } from "./parse"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseProperties", () => {
  it("should parse properties", () => {
    const mockContent = `ПолеВвода:
  ТолькоПросмотр: Истина`

    const elementsMap: Record<string, BaseElement> = {
      ПолеВвода: {
        elementType: FormElementType.InputField,
        name: "ПолеВвода",
        id: "1",
      },
    }

    const expectedResult: Record<string, BaseElement> = {
      ПолеВвода: {
        elementType: FormElementType.InputField,
        name: "ПолеВвода",
        id: "1",
        readOnly: true,
      } as InputField,
    }

    const result = parseProperties(mockContent, elementsMap, configurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
