import { describe, expect, it } from "vitest"
import { ZElementType } from "../../types"
import { formatProperties } from "./formatProperties"
import { TClientApplicationForm } from "../types"

describe("formatProperties", () => {
  it("should format properties", () => {
    const form: TClientApplicationForm = {
      elementType: ZElementType.enum.ClientApplicationForm,
      childItems: [],
      title: { items: { ru: "Заголовок" } },
    }

    const expectedResult = `Заголовок: Title`

    const properties = formatProperties(form)

    expect(properties).toEqual(expectedResult)
  })

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

    const expectedResult = `ПолеВвода:
  ТолькоПросмотр: Истина`

    const properties = formatProperties(form)

    expect(properties).toEqual(expectedResult)
  })
})
