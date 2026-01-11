import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { BaseElement } from "../baseElement/types"
import { getContextMenuName, isDefaultContextMenuName } from "./helper"
import { ContextMenu } from "./types"

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

describe("isDefaultContextMenuName", () => {
  it("should return true for default context menu name", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const contextMenu: ContextMenu = {
      elementType: FormElementType.FormGroup,
      name: "КакойТоЭлементКонтекстноеМеню",
    }

    const result = isDefaultContextMenuName(parentElement, contextMenu)

    expect(result).toBeTruthy()
  })

  it("should return false for non-default context menu name", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const contextMenu: ContextMenu = {
      elementType: FormElementType.FormGroup,
      name: "КастомноеМеню",
      childItems: [],
    }

    const result = isDefaultContextMenuName(parentElement, contextMenu)

    expect(result).toBeFalsy()
  })

  it("should return false when name does not match pattern", () => {
    const parentElement: BaseElement = {
      elementType: FormElementType.InputField,
      name: "КакойТоЭлемент",
    }

    const contextMenu: ContextMenu = {
      elementType: FormElementType.FormGroup,
      name: "КакойТоЭлементМеню",
      childItems: [],
    }

    const result = isDefaultContextMenuName(parentElement, contextMenu)

    expect(result).toBeFalsy()
  })
})
