import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { getContextMenuName } from "./helper"

describe("getContextMenuName", () => {
  it("should generate context menu name from parent element", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const result = getContextMenuName(parentElement)

    expect(result).toBe("КакойТоЭлементКонтекстноеМеню")
  })

  it("should handle different parent element names", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.Button,
      name: "Кнопка",
    }

    const result = getContextMenuName(parentElement)

    expect(result).toBe("КнопкаКонтекстноеМеню")
  })
})
