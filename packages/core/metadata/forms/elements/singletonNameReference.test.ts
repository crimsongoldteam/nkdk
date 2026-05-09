import { describe, expect, it } from "vitest"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML, importPropertyFromXML, type PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"

type SingletonReferenceXML = {
  _name: unknown
  _id?: unknown
  ContextMenu: { _name: unknown }
  ExtendedTooltip: { _name: unknown }
}

const withParent = (parent: { itemType: "Button" | "Table" | "PDFDocumentField"; name: string }) => {
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
    expect(Object.keys(reference as object)).toEqual(["id", "itemType"])
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

  it("keeps ViewStatus reference suffix", () => {
    const rule = { type: "ViewStatusAddition" } satisfies PropertyRule
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
      value: { itemType: "ViewStatusAddition" },
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
})
