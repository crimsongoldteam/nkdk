import { describe, expect, it } from "vitest"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { Table } from "./table/types"
import {
  exportElementToXML,
  exportPropertyToXML,
  importElementFromXML,
  importPropertyFromXML,
  type ElementXML,
  type PropertyRule,
} from "../../orchestration"
import { getReferenceNameSuffix } from "../../orchestration/formElement/singletonName"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"

type SingletonReferenceXML = {
  _name: unknown
  _id?: unknown
  ContextMenu: { _name: unknown }
  ExtendedTooltip: { _name: unknown }
}

const withParent = (parent: {
  itemType: "Button" | "Table" | "PDFDocumentField" | "GanttChartField"
  name: string
}) => {
  const context = mockContextToXML()
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      itemsTree: [{ ...parent, path: "" }],
    },
  } satisfies ConfigurationContextWithExportToXML
}

const importReference = (rule: PropertyRule, value: unknown): unknown => {
  return importPropertyFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule,
    value,
  })
}

const exportWithReference = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  reference: unknown
}): SingletonReferenceXML => {
  const { context, rule, value, reference } = params
  return exportPropertyToXML({
    context,
    rule,
    value,
    referenceMetadata: reference,
  }) as SingletonReferenceXML
}

describe("singleton XML name suffix from reference", () => {
  it("keeps ExtendedTooltip reference suffix and current parent name", () => {
    const rule = { type: "ExtendedTooltip" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СтарыйExtendedTooltip",
      _id: "9",
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Button", name: "Новый" }),
      rule,
      value: { itemType: "ExtendedTooltip" },
      reference,
    })

    expect(result._name).toBe("НовыйExtendedTooltip")
    expect(Object.keys(reference as object)).toEqual(expect.arrayContaining(["id", "itemType"]))
    expect(getReferenceNameSuffix(reference)).toBe("ExtendedTooltip")
  })

  it("keeps ContextMenu reference suffix and current parent name", () => {
    const rule = { type: "ContextMenu" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СтарыйContextMenu",
      _id: "2",
      ChildItems: [],
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Button", name: "Новый" }),
      rule,
      value: { itemType: "ContextMenu", childItems: [] },
      reference,
    })

    expect(result._name).toBe("НовыйContextMenu")
  })

  it("keeps SearchString suffix and nested singleton suffixes", () => {
    const rule = { type: "SingleSearchStringAddition" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокSearchString",
      _id: "13",
      AdditionSource: {
        Item: "Список",
        Type: "SearchStringRepresentation",
      },
      ContextMenu: {
        _name: "СписокSearchStringContextMenu",
        _id: "14",
        ChildItems: [],
      },
      ExtendedTooltip: {
        _name: "СписокSearchStringExtendedTooltip",
        _id: "15",
      },
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: {
        itemType: "SingleSearchStringAddition",
        contextMenu: { itemType: "ContextMenu", childItems: [] },
        extendedTooltip: { itemType: "ExtendedTooltip" },
      },
      reference,
    })

    expect(result._name).toBe("НовыйСписокSearchString")
    expect(result.ContextMenu._name).toBe("НовыйСписокSearchStringContextMenu")
    expect(result.ExtendedTooltip._name).toBe("НовыйСписокSearchStringExtendedTooltip")
  })

  it("keeps exact singleton name when it is noncanonical for the reference owner", () => {
    const rule = { type: "SingleSearchStringAddition" } satisfies PropertyRule
    const reference = importPropertyFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      value: {
        _name: "ТаблицаЭПСтрокаПоиска",
        _id: "13",
        AdditionSource: {
          Item: "Подписи",
          Type: "SearchStringRepresentation",
        },
      },
      ownerXmlName: "Подписи",
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "Подписи" }),
      rule,
      value: { itemType: "SingleSearchStringAddition" },
      reference,
    })

    expect(result._name).toBe("ТаблицаЭПСтрокаПоиска")
  })

  it("keeps noncanonical SearchString name through importElementFromXML pipeline", () => {
    const xml = {
      _name: "Подписи",
      _id: "1",
      SearchStringAddition: {
        _name: "ТаблицаЭПСтрокаПоиска",
        _id: "13",
        AdditionSource: {
          Item: "Подписи",
          Type: "SearchStringRepresentation",
        },
      },
    } satisfies ElementXML

    const reference = importElementFromXML({
      context: mockContextFromXML({ forReference: true }),
      itemType: "Table",
      xml,
    })

    const table: Table = {
      itemType: "Table",
      name: "Подписи",
      searchStringRepresentation: { itemType: "SingleSearchStringAddition" },
    }

    const result = exportElementToXML({
      context: mockContextToXML(),
      element: table,
      referenceElement: reference,
    })

    expect(result?.SearchStringAddition._name).toBe("ТаблицаЭПСтрокаПоиска")
  })

  it("keeps ViewStatus reference suffix", () => {
    const rule = { type: "SingleViewStatusAddition" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокViewStatus",
      _id: "16",
      AdditionSource: {
        Item: "Список",
        Type: "ViewStatusRepresentation",
      },
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: { itemType: "SingleViewStatusAddition" },
      reference,
    })

    expect(result._name).toBe("НовыйСписокViewStatus")
  })

  it("keeps SearchControl reference suffix", () => {
    const rule = { type: "SingleSearchControlAddition" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокSearchControl",
      _id: "19",
      AdditionSource: {
        Item: "Список",
        Type: "SearchControl",
      },
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: { itemType: "SingleSearchControlAddition", childItems: [] },
      reference,
    })

    expect(result._name).toBe("НовыйСписокSearchControl")
  })

  it("keeps TableAutoCommandBar CommandBar suffix", () => {
    const rule = { type: "TableAutoCommandBar" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "СписокCommandBar",
      _id: "3",
      Autofill: false,
    })

    const result = exportWithReference({
      context: withParent({ itemType: "Table", name: "НовыйСписок" }),
      rule,
      value: { itemType: "AutoCommandBar", autofill: false, childItems: [] },
      reference,
    })

    expect(result._name).toBe("НовыйСписокCommandBar")
  })

  it("keeps GanttChartFieldTable reference suffix and current parent name", () => {
    const rule = { type: "GanttChartFieldTable" } satisfies PropertyRule
    const reference = importPropertyFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      value: {
        _name: "СтараяДиаграммаTable",
        _id: "496",
        ChildItems: [],
      },
      ownerXmlName: "СтараяДиаграмма",
    })

    const result = exportWithReference({
      context: withParent({ itemType: "GanttChartField", name: "НоваяДиаграмма" }),
      rule,
      value: {
        itemType: "Table",
        name: "СтараяДиаграммаTable",
        childItems: [],
      },
      reference,
    }) as SingletonReferenceXML

    expect(result._name).toBe("НоваяДиаграммаTable")
  })

  it("keeps root AutoCommandBar FormCommandBar name", () => {
    const rule = { type: "AutoCommandBar" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "FormCommandBar",
      _id: "-1",
    })

    const result = exportWithReference({
      context: mockContextToXML(),
      rule,
      value: { itemType: "AutoCommandBar", childItems: [] },
      reference,
    })

    expect(result._name).toBe("FormCommandBar")
    expect(result._id).toBe("-1")
  })

  it("keeps root AutoCommandBar empty reference name", () => {
    const rule = { type: "AutoCommandBar" } satisfies PropertyRule
    const reference = importReference(rule, {
      _name: "",
      _id: "-1",
    })

    const result = exportWithReference({
      context: mockContextToXML(),
      rule,
      value: { itemType: "AutoCommandBar", childItems: [] },
      reference,
    })

    expect(result._name).toBe("")
    expect(result._id).toBe("-1")
  })
})
