import { describe, expect, it } from "vitest"
import { mockContext } from "../../../../tests/mockContext"
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
import { exportFormChoiceListToYAML } from "./toYAML"
import type { MetadataFormChoiceListValue } from "../types"

describe("exportFormChoiceListToYAML", () => {
  it("exports formChoiceList with string value to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withStringValue)
    expect(result).toEqual(withStringValueYAML)
  })

  it("exports formChoiceList without presentation to YAML object without presentation field", () => {
    const result = exportFormChoiceListToYAML(mockContext, withoutPresentation)
    expect(result).toEqual(withoutPresentationYAML)
  })

  it("exports formChoiceList with numeric presentation to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withNumericPresentation)
    expect(result).toEqual(withNumericPresentationYAML)
  })

  it("exports formChoiceList with multilingual presentation to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withMultiLangPresentation)
    expect(result).toEqual(withMultiLangPresentationYAML)
  })

  it("exports a single non-default presentation language as a map", () => {
    const result = exportFormChoiceListToYAML(mockContext, {
      type: "formChoiceListDesTimeValue",
      value: { type: "string", value: "x" },
      presentation: { items: { en: "Labor compensation expenses" } },
    })

    expect(result).toMatchObject({
      Представление: {
        en: "Labor compensation expenses",
      },
    })
  })

  it("exports DataCompositionComparisonType explicit value", () => {
    const value: MetadataFormChoiceListValue = {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Равно" } },
      value: {
        type: "DataCompositionComparisonType",
        value: "Equal",
      } as MetadataFormChoiceListValue["value"],
    }

    const result = exportFormChoiceListToYAML(mockContext, value)

    expect(result).toEqual({
      Представление: "Равно",
      Значение: {
        Тип: "ВидСравненияКомпоновкиДанных",
        Значение: "Равно",
      },
    })
  })
})
