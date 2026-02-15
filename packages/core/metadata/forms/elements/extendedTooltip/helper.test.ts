import { describe, expect, it } from "vitest"
import { NamedElement } from "../baseElement/types"
import { getExtendedTooltipName } from "./helper"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

describe("getExtendedTooltipName", () => {
  it("should generate extended tooltip name from parent element", () => {
    const parentElement: NamedElement = {
      itemType: CollectionFormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const result = getExtendedTooltipName(parentElement)

    expect(result).toBe("КакойТоЭлементРасширеннаяПодсказка")
  })

  it("should handle different parent element names", () => {
    const parentElement: NamedElement = {
      itemType: CollectionFormElementType.Button,
      name: "Кнопка",
    }

    const result = getExtendedTooltipName(parentElement)

    expect(result).toBe("КнопкаРасширеннаяПодсказка")
  })
})
