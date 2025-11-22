import { describe, expect, it } from "vitest"
import "~/lib/metadata/forms/elements/rules"
import { TBaseElement } from "../../baseElement/types"
import { TInputField } from "../../inputField/types"
import { ZElementType } from "../../types"
import { parseProperties } from "./parse"

describe("parseProperties", () => {
  it("should parse properties", () => {
    const mockContent = [
      `ПолеВвода:
      ТолькоПросмотр: Истина`,
    ]

    const elementsMap: Record<string, TBaseElement> = {
      ПолеВвода: {
        elementType: ZElementType.enum.InputField,
        name: "ПолеВвода",
        id: "1",
      },
    }

    const expectedResult: Record<string, TBaseElement> = {
      ПолеВвода: {
        elementType: ZElementType.enum.InputField,
        name: "ПолеВвода",
        id: "1",
        readOnly: true,
      } as TInputField,
    }

    const result = parseProperties(mockContent, elementsMap)

    expect(result).toEqual(expectedResult)
  })
})
