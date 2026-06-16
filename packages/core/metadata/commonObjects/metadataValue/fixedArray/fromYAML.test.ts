import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  formChoiceRefsFixedArrayYAML,
  refsWithNilFixedArray,
  refsWithNilFixedArrayYAML,
  singleStringFixedArray,
  singleStringFixedArrayYAML,
  twoRefsFixedArray,
  twoRefsFixedArrayYAML,
} from "./__fixtures__/data"
import { importFixedArrayFromYAML } from "./fromYAML"
import { MetadataFixedArrayValueYAMLInput } from "../types"

describe("importFixedArrayFromYAML", () => {
  it("should import fixed array with two refs from YAML", () => {
    const result = importFixedArrayFromYAML(mockContext, twoRefsFixedArrayYAML)
    expect(result).toEqual(twoRefsFixedArray)
  })

  it("should import fixed array with single string from YAML", () => {
    const result = importFixedArrayFromYAML(mockContext, singleStringFixedArrayYAML)
    expect(result).toEqual(singleStringFixedArray)
  })

  it("should import fixed array with undefined YAML element", () => {
    const result = importFixedArrayFromYAML(mockContext, refsWithNilFixedArrayYAML)
    expect(result).toEqual(refsWithNilFixedArray)
  })

  it("should import YAML null as undefined inside fixed array", () => {
    const yamlWithNull = [
      "Перечисление.ХозяйственныеОперации.РеализацияКлиенту",
      null,
      "Перечисление.ХозяйственныеОперации.ПустаяСсылка",
    ] as MetadataFixedArrayValueYAMLInput

    const result = importFixedArrayFromYAML(mockContext, yamlWithNull)
    expect(result).toEqual(refsWithNilFixedArray)
  })

  it("imports compact formChoiceList YAML elements as ordinary refs", () => {
    const result = importFixedArrayFromYAML(mockContext, formChoiceRefsFixedArrayYAML)

    expect(result).toEqual({
      type: "fixedArray",
      value: [
        {
          type: "ref",
          value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
        },
        {
          type: "ref",
          value: "Enum.ТипыДоговоров.EnumValue.СКомитентом",
        },
      ],
    })
  })
})
