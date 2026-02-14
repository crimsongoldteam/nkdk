import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/metadataType/types"
import { NamedElement } from "../baseElement/types"
import { getExtendedTooltipName } from "./helper"

describe("getExtendedTooltipName", () => {
  it("should generate extended tooltip name from parent element", () => {
    const parentElement: NamedElement = {
      itemType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const result = getExtendedTooltipName(parentElement)

    expect(result).toBe("КакойТоЭлементРасширеннаяПодсказка")
  })

  it("should handle different parent element names", () => {
    const parentElement: NamedElement = {
      itemType: FormElementType.Button,
      name: "Кнопка",
    }

    const result = getExtendedTooltipName(parentElement)

    expect(result).toBe("КнопкаРасширеннаяПодсказка")
  })
})
