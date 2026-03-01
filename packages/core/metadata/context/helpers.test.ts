import { describe, expect, it } from "vitest"
import { CollectionFormElementType } from "../metadataFactory"
import { getCurrentTableFromContext, getParentFromContext } from "./helpers"
import { ConfigurationContext, EnterpriseContext } from "./types"

describe("getParentFromContext", () => {
  const createContext = (elementsTree: ConfigurationContext["elementsTree"]): ConfigurationContext => ({
    defaultLanguage: "ru",
    elementsTree,
  })

  it("returns the last element when no type filter is specified", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe(CollectionFormElementType.InputField)
  })

  it("returns the last element of the specified type", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group2" },
    ])

    const result = getParentFromContext(context, CollectionFormElementType.UsualGroup)

    expect(result.name).toBe("group2")
  })

  it("searches from end to start", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group2" },
    ])

    const result = getParentFromContext(context, CollectionFormElementType.UsualGroup)

    expect(result.name).toBe("group2")
  })

  it("throws when elementsTree is empty", () => {
    const context = createContext([])

    expect(() => getParentFromContext(context)).toThrow("Parent element not found in context")
  })

  it("throws when elementsTree is undefined", () => {
    const context = createContext(undefined)

    expect(() => getParentFromContext(context)).toThrow("Parent element not found in context")
  })

  it("throws when no element of the specified type is found", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.InputField, name: "field1" },
    ])

    expect(() => getParentFromContext(context, CollectionFormElementType.UsualGroup)).toThrow(
      "Parent element not found in context"
    )
  })

  it("returns any type when itemType is not specified", () => {
    const context = createContext([
      { itemType: CollectionFormElementType.LabelDecoration, name: "form1" },
      { itemType: CollectionFormElementType.UsualGroup, name: "group1" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe(CollectionFormElementType.UsualGroup)
  })
})

describe("getCurrentTableFromContext", () => {
  const createEnterpriseContext = (
    elementsTree: EnterpriseContext["elementsTree"]
  ): ConfigurationContext => ({
    defaultLanguage: "ru",
    enterprise: {
      prefix: "",
      attributes: {},
      elementsTree,
    },
  })

  it("throws when enterprise is not defined", () => {
    const context: ConfigurationContext = { defaultLanguage: "ru" }

    expect(() => getCurrentTableFromContext(context)).toThrow("Enterprise context is not defined")
  })

  it("returns undefined when elementsTree is empty", () => {
    const context = createEnterpriseContext([])

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })

  it("returns undefined when elementsTree is undefined", () => {
    const context: ConfigurationContext = {
      defaultLanguage: "ru",
      enterprise: { prefix: "", attributes: {}, elementsTree: undefined! },
    }

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })

  it("returns undefined when table is the last element", () => {
    const context = createEnterpriseContext([
      { itemType: CollectionFormElementType.UsualGroup, dataPath: undefined },
      { itemType: CollectionFormElementType.Table, dataPath: "Таблица1" },
    ])

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })

  it("returns the table when it has following elements", () => {
    const tableElement = { itemType: CollectionFormElementType.Table, dataPath: "Таблица1" as const }
    const context = createEnterpriseContext([
      { itemType: CollectionFormElementType.UsualGroup, dataPath: undefined },
      tableElement,
      { itemType: CollectionFormElementType.ColumnGroup, dataPath: "ГруппаКолонок1" },
    ])

    const result = getCurrentTableFromContext(context)

    expect(result).toBe(tableElement)
    expect(result?.dataPath).toBe("Таблица1")
  })

  it("returns the table closest to the end (but not the last element)", () => {
    const innerTable = { itemType: CollectionFormElementType.Table, dataPath: "ВложеннаяТаблица" }
    const context = createEnterpriseContext([
      { itemType: CollectionFormElementType.Table, dataPath: "ВнешняяТаблица" },
      innerTable,
      { itemType: CollectionFormElementType.ColumnGroup, dataPath: "ГруппаКолонок" },
    ])

    const result = getCurrentTableFromContext(context)

    expect(result).toBe(innerTable)
    expect(result?.dataPath).toBe("ВложеннаяТаблица")
  })

  it("returns undefined when no table is in the tree", () => {
    const context = createEnterpriseContext([
      { itemType: CollectionFormElementType.UsualGroup, dataPath: undefined },
      { itemType: CollectionFormElementType.InputField, dataPath: "Поле1" },
    ])

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })
})
