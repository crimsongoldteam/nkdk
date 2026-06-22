import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { importFromYAML } from "~/yaml/import"
import {
  formChoiceRefsFixedArray,
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

  it("imports double-quoted numeric-looking YAML sequence item as string value", () => {
    const yaml = importFromYAML<{ Значения: unknown[] }>('Значения:\n  - "456"\n').Значения
    const result = importFixedArrayFromYAML(mockContext, yaml as any)

    expect(result).toEqual({
      type: "fixedArray",
      value: [{ type: "string", value: "456" }],
    })
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

  it("imports explicit formChoiceList YAML elements inside fixed array", () => {
    const result = importFixedArrayFromYAML(mockContext, formChoiceRefsFixedArrayYAML)

    expect(result).toEqual(formChoiceRefsFixedArray)
  })

  it("imports compact fixed array YAML elements as ordinary refs", () => {
    const compactFormChoiceRefsFixedArrayYAML: MetadataFixedArrayValueYAMLInput = [
      "Перечисление.ТипыДоговоров.СПоставщиком",
      "Перечисление.ТипыДоговоров.СКомитентом",
    ]

    const result = importFixedArrayFromYAML(mockContext, compactFormChoiceRefsFixedArrayYAML)

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
