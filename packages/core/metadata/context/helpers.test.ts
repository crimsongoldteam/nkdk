import { describe, expect, it } from "vitest"
import { getCurrentTableFromContext, getParentFromContext } from "./helpers"
import {
  ConfigurationContext,
  ConfigurationContextWithExportToXML,
  ContextElementToEnterprise,
  EnterpriseContext,
} from "./types"

describe("getParentFromContext", () => {
  const createContext = (
    itemsTree: ConfigurationContextWithExportToXML["exportToXML"]["itemsTree"]
  ): ConfigurationContextWithExportToXML => ({
    defaultLanguage: "ru",
    version: "2.20",
    exportToXML: {
      itemsTree,
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
      },
    },
  })

  it("returns the last element when no type filter is specified", () => {
    const context = createContext([
      { itemType: "LabelDecoration", name: "form1", path: "" },
      { itemType: "UsualGroup", name: "group1", path: "" },
      { itemType: "InputField", name: "field1", path: "" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe("InputField")
  })

  it("returns the last element of the specified type", () => {
    const context = createContext([
      { itemType: "LabelDecoration", name: "form1", path: "" },
      { itemType: "UsualGroup", name: "group1", path: "" },
      { itemType: "InputField", name: "field1", path: "" },
      { itemType: "UsualGroup", name: "group2", path: "" },
    ])

    const result = getParentFromContext(context, ["UsualGroup"])

    expect(result.name).toBe("group2")
  })

  it("searches from end to start", () => {
    const context = createContext([
      { itemType: "LabelDecoration", name: "form1", path: "" },
      { itemType: "UsualGroup", name: "group1", path: "" },
      { itemType: "InputField", name: "field1", path: "" },
      { itemType: "UsualGroup", name: "group2", path: "" },
    ])

    const result = getParentFromContext(context, ["UsualGroup"])

    expect(result.name).toBe("group2")
  })

  it("throws when elementsTree is empty", () => {
    const context = createContext([])

    expect(() => getParentFromContext(context)).toThrow("Parent element not found in context")
  })

  it("throws when no element of the specified type is found", () => {
    const context = createContext([
      { itemType: "LabelDecoration", name: "form1", path: "" },
      { itemType: "InputField", name: "field1", path: "" },
    ])

    expect(() => getParentFromContext(context, ["UsualGroup"])).toThrow("Parent element not found in context")
  })

  it("returns any type when itemType is not specified", () => {
    const context = createContext([
      { itemType: "LabelDecoration", name: "form1", path: "" },
      { itemType: "UsualGroup", name: "group1", path: "" },
    ])

    const result = getParentFromContext(context)

    expect(result.itemType).toBe("UsualGroup")
  })
})

describe("getCurrentTableFromContext", () => {
  const createEnterpriseContext = (elementsTree: EnterpriseContext["elementsTree"]): ConfigurationContext => ({
    defaultLanguage: "ru",
    version: "2.20",
    enterprise: {
      prefix: "",
      attributes: {},
      elementsTree,
    },
  })

  it("throws when enterprise is not defined", () => {
    const context: ConfigurationContext = { defaultLanguage: "ru", version: "2.20" }

    expect(() => getCurrentTableFromContext(context)).toThrow("Enterprise context is not defined")
  })

  it("returns undefined when elementsTree is empty", () => {
    const context = createEnterpriseContext([])

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })

  it("returns undefined when elementsTree is undefined", () => {
    const context: ConfigurationContext = {
      version: "2.20",
      defaultLanguage: "ru",
      enterprise: { prefix: "", attributes: {}, elementsTree: undefined! },
    }

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })

  it("returns undefined when table is the last element", () => {
    const context = createEnterpriseContext([
      { itemType: "UsualGroup", dataPath: undefined, dataPathEnterprise: undefined },
      { itemType: "Table", dataPath: "Таблица1", dataPathEnterprise: "Таблица1" },
    ])

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })

  it("returns the table when it has following elements", () => {
    const tableElement: ContextElementToEnterprise = {
      itemType: "Table",
      dataPath: "Таблица1",
      dataPathEnterprise: "Таблица1",
    }
    const context = createEnterpriseContext([
      { itemType: "UsualGroup", dataPath: undefined, dataPathEnterprise: undefined },
      tableElement,
      { itemType: "ColumnGroup", dataPath: undefined, dataPathEnterprise: undefined },
    ])

    const result = getCurrentTableFromContext(context)

    expect(result).toBe(tableElement)
    expect(result?.dataPathEnterprise).toBe("Таблица1")
  })

  it("returns the table closest to the end (but not the last element)", () => {
    const innerTable: ContextElementToEnterprise = {
      itemType: "Table",
      dataPath: "ВложеннаяТаблица",
      dataPathEnterprise: "ВложеннаяТаблица",
    }
    const context = createEnterpriseContext([
      { itemType: "Table", dataPath: "ВнешняяТаблица", dataPathEnterprise: "ВнешняяТаблица" },
      innerTable,
      { itemType: "ColumnGroup", dataPath: "ГруппаКолонок", dataPathEnterprise: "ГруппаКолонок" },
    ])

    const result = getCurrentTableFromContext(context)

    expect(result).toBe(innerTable)
    expect(result?.dataPathEnterprise).toBe("ВложеннаяТаблица")
  })

  it("returns undefined when no table is in the tree", () => {
    const context = createEnterpriseContext([
      { itemType: "UsualGroup", dataPath: undefined, dataPathEnterprise: undefined },
      { itemType: "InputField", dataPath: "Поле1", dataPathEnterprise: "Поле1" },
    ])

    expect(getCurrentTableFromContext(context)).toBeUndefined()
  })
})
