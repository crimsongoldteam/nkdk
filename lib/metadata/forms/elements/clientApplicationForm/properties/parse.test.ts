import { describe, expect, it } from "vitest"
import { ZElementType } from "../../types"
import { TClientApplicationForm } from "../types"

describe("parseProperties", () => {
  it("should parse properties", () => {
    const mockContent = [
      `ПолеВвода:
      ТолькоПросмотр: Истина`,
    ]

    const expectedResult: TClientApplicationForm = {
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

    const result = parseProperties(mockContent)

    expect(result).toEqual(expectedResult)
  })
})
