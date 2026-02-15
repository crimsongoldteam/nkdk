import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "../metadataFactory"
import { getParentFromContext } from "./helpers"
import { ConfigurationContext } from "./types"

describe("getParentFromContext", () => {
  const createContext = (elementsTree: ConfigurationContext["elementsTree"]): ConfigurationContext => ({
    defaultLanguage: "ru",
    elementsTree,
  })

  it("должен возвращать последний элемент без фильтра по типу", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe(CollectionFormElementType.InputField)
  })

  it("должен возвращать последний элемент с указанным типом", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group2" },
    ])

    const result = getParentFromContext(context, CollectionFormElementType.UsualGroup)

    expect(result.name).toBe("group2")
  })

  it("должен искать с конца по начало", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group2" },
    ])

    const result = getParentFromContext(context, CollectionFormElementType.UsualGroup)

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
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
    ])

    expect(() => getParentFromContext(context, CollectionFormElementType.UsualGroup)).toThrow(
      "Parent element not found in context"
    )
  })

  it("должен возвращать любой тип если itemType не указан", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe(CollectionFormElementType.UsualGroup)
  })
})
