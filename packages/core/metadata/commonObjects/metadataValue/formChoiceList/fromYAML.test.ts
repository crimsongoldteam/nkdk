import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  withMultiLangPresentation,
  withMultiLangPresentationYAML,
  withNumericPresentation,
  withNumericPresentationYAML,
  withStringValue,
  withStringValueYAML,
  withoutPresentation,
  withoutPresentationYAML,
} from "./__fixtures__/data"
import { importFormChoiceListFromYAML } from "./fromYAML"
import type { MetadataFormChoiceListValueYAML } from "../types"

describe("importFormChoiceListFromYAML", () => {
  it("imports formChoiceList with string value from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withStringValueYAML)
    expect(result).toEqual(withStringValue)
  })

  it("imports formChoiceList without presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withoutPresentationYAML)
    expect(result).toEqual(withoutPresentation)
  })

  it("imports formChoiceList without presentation field", () => {
    const yaml: MetadataFormChoiceListValueYAML = {
      Значение: "Истина",
    }

    const result = importFormChoiceListFromYAML(mockContext, yaml)

    expect(result).toEqual(withoutPresentation)
    expect(Object.prototype.hasOwnProperty.call(result, "presentation")).toBe(false)
  })

  it("imports legacy empty presentation string as missing presentation", () => {
    const yaml: MetadataFormChoiceListValueYAML = {
      Представление: "",
      Значение: "Истина",
    }

    const result = importFormChoiceListFromYAML(mockContext, yaml)

    expect(result).toEqual(withoutPresentation)
    expect(Object.prototype.hasOwnProperty.call(result, "presentation")).toBe(false)
  })

  it("imports formChoiceList with numeric presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withNumericPresentationYAML)
    expect(result).toEqual(withNumericPresentation)
  })

  it("imports formChoiceList with multilingual presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withMultiLangPresentationYAML)
    expect(result).toEqual(withMultiLangPresentation)
  })

  it("imports a single non-default presentation language map", () => {
    const result = importFormChoiceListFromYAML(mockContext, {
      Представление: { en: "Labor compensation expenses" },
    })

    expect(result.presentation).toEqual({
      items: { en: "Labor compensation expenses" },
    })
  })

  it("imports DataCompositionComparisonType explicit value", () => {
    const yaml: MetadataFormChoiceListValueYAML = {
      Представление: "Равно",
      Значение: {
        Тип: "ВидСравненияКомпоновкиДанных",
        Значение: "Равно",
      },
    }

    const result = importFormChoiceListFromYAML(mockContext, yaml)

    expect(result.value).toEqual({
      type: "DataCompositionComparisonType",
      value: "Equal",
    })
  })
})
