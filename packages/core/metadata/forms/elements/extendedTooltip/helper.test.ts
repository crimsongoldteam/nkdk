import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { getExtendedTooltipName } from "./helper"

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
