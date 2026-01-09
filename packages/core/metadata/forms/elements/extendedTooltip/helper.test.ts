import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { getExtendedTooltipName, isDefaultExtendedTooltipName } from "./helper"
import { ExtendedTooltip } from "./types"

describe("getExtendedTooltipName", () => {
  it("should generate extended tooltip name from parent element", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const result = getExtendedTooltipName(parentElement)

    expect(result).toBe("КакойТоЭлементРасширеннаяПодсказка")
  })

  it("should handle different parent element names", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.Button,
      name: "Кнопка",
    }

    const result = getExtendedTooltipName(parentElement)

    expect(result).toBe("КнопкаРасширеннаяПодсказка")
  })
})

describe("isDefaultExtendedTooltipName", () => {
  it("should return true for default extended tooltip name", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const extendedTooltip: ExtendedTooltip = {
      elementType: FormElementType.FormDecoration,
      name: "КакойТоЭлементРасширеннаяПодсказка",
    }

    const result = isDefaultExtendedTooltipName(parentElement, extendedTooltip)

    expect(result).toBeTruthy()
  })

  it("should return false for non-default extended tooltip name", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const extendedTooltip: ExtendedTooltip = {
      elementType: FormElementType.FormDecoration,
      name: "КастомнаяПодсказка",
    }

    const result = isDefaultExtendedTooltipName(parentElement, extendedTooltip)

    expect(result).toBeFalsy()
  })

  it("should return false when name does not match pattern", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const extendedTooltip: ExtendedTooltip = {
      elementType: FormElementType.FormDecoration,
      name: "КакойТоЭлементПодсказка",
    }

    const result = isDefaultExtendedTooltipName(parentElement, extendedTooltip)

    expect(result).toBeFalsy()
  })
})
