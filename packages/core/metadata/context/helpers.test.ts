import { describe, expect, it } from "vitest"
import { FormElementType } from "../metadataFactory"
import { getParentFromContext } from "./helpers"
import { ConfigurationContext } from "./types"

describe("getParentFromContext", () => {
  const createContext = (elementsTree: ConfigurationContext["elementsTree"]): ConfigurationContext => ({
    defaultLanguage: "ru",
    elementsTree,
  })

  it("должен возвращать последний элемент без фильтра по типу", () => {
    const context = createContext([
      { itemType: FormElementType.FormDecoration, name: "form1" },
      { itemType: FormElementType.UsualGroup, name: "group1" },
      { itemType: FormElementType.InputField, name: "field1" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe(FormElementType.InputField)
  })

  it("должен возвращать последний элемент с указанным типом", () => {
    const context = createContext([
      { itemType: FormElementType.FormDecoration, name: "form1" },
      { itemType: FormElementType.UsualGroup, name: "group1" },
      { itemType: FormElementType.InputField, name: "field1" },
      { itemType: FormElementType.UsualGroup, name: "group2" },
    ])

    const result = getParentFromContext(context, FormElementType.UsualGroup)

    expect(result.name).toBe("group2")
  })

  it("должен искать с конца по начало", () => {
    const context = createContext([
      { itemType: FormElementType.FormDecoration, name: "form1" },
      { itemType: FormElementType.UsualGroup, name: "group1" },
      { itemType: FormElementType.InputField, name: "field1" },
      { itemType: FormElementType.UsualGroup, name: "group2" },
    ])

    const result = getParentFromContext(context, FormElementType.UsualGroup)

    expect(result.name).toBe("group2")
  })

  it("должен выбрасывать ошибку если elementsTree пустой", () => {
    const context = createContext([])

    expect(() => getParentFromContext(context)).toThrow("Parent element not found in context")
  })

  it("должен выбрасывать ошибку если elementsTree undefined", () => {
    const context = createContext(undefined)

    expect(() => getParentFromContext(context)).toThrow("Parent element not found in context")
  })

  it("должен выбрасывать ошибку если элемент с указанным типом не найден", () => {
    const context = createContext([
      { itemType: FormElementType.FormDecoration, name: "form1" },
      { itemType: FormElementType.InputField, name: "field1" },
    ])

    expect(() => getParentFromContext(context, FormElementType.UsualGroup)).toThrow(
      "Parent element not found in context"
    )
  })

  it("должен возвращать любой тип если itemType не указан", () => {
    const context = createContext([
      { itemType: FormElementType.FormDecoration, name: "form1" },
      { itemType: FormElementType.UsualGroup, name: "group1" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe(FormElementType.UsualGroup)
  })
})
