import { describe, expect, it } from "vitest"
import { MetadataGraph } from "./MetadataGraph"
import { namedFilters, validateReferenceScope } from "./referenceScope"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGraph(): MetadataGraph {
  return new MetadataGraph()
}

// ---------------------------------------------------------------------------
// namedFilters.stringIndexedAttribute
// ---------------------------------------------------------------------------

describe("namedFilters.stringIndexedAttribute", () => {
  it("возвращает true для MetadataAttribute с indexing: Index", () => {
    const item = { itemType: "MetadataAttribute", indexing: "Index" }
    expect(namedFilters.stringIndexedAttribute(item)).toBe(true)
  })

  it("возвращает true для MetadataAttribute с indexing: IndexWithAdditionalOrder", () => {
    const item = { itemType: "MetadataAttribute", indexing: "IndexWithAdditionalOrder" }
    expect(namedFilters.stringIndexedAttribute(item)).toBe(true)
  })

  it("возвращает false для MetadataAttribute с indexing: DontIndex", () => {
    const item = { itemType: "MetadataAttribute", indexing: "DontIndex" }
    expect(namedFilters.stringIndexedAttribute(item)).toBe(false)
  })

  it("возвращает false для MetadataAttribute без indexing", () => {
    const item = { itemType: "MetadataAttribute" }
    expect(namedFilters.stringIndexedAttribute(item)).toBe(false)
  })

  it("возвращает false для не-MetadataAttribute", () => {
    const item = { itemType: "MetadataCatalog", indexing: "Index" }
    expect(namedFilters.stringIndexedAttribute(item)).toBe(false)
  })

  it("возвращает false для null/undefined", () => {
    expect(namedFilters.stringIndexedAttribute(null)).toBe(false)
    expect(namedFilters.stringIndexedAttribute(undefined)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateReferenceScope — topLevel
// ---------------------------------------------------------------------------

describe("validateReferenceScope — topLevel", () => {
  it("принимает справочник из разрешённых типов", () => {
    const g = makeGraph()
    const result = validateReferenceScope(
      "Справочник.Контрагенты",
      { target: "topLevel", allowedTypes: ["Справочник", "Документ"] },
      g,
      "Справочник.МойСправочник",
    )
    expect(result).toBe(true)
  })

  it("принимает документ из разрешённых типов", () => {
    const g = makeGraph()
    const result = validateReferenceScope(
      "Документ.СчётНаОплату",
      { target: "topLevel", allowedTypes: ["Справочник", "Документ"] },
      g,
      "Справочник.МойСправочник",
    )
    expect(result).toBe(true)
  })

  it("отклоняет тип, которого нет в allowedTypes", () => {
    const g = makeGraph()
    const result = validateReferenceScope(
      "Регистр.МойРегистр",
      { target: "topLevel", allowedTypes: ["Справочник", "Документ"] },
      g,
      "Справочник.МойСправочник",
    )
    expect(result).toBe(false)
  })

  it("отклоняет вложенный узел (не top-level)", () => {
    const g = makeGraph()
    const result = validateReferenceScope(
      "Справочник.МойСправочник.КакойТоРеквизит",
      { target: "topLevel", allowedTypes: ["Справочник"] },
      g,
      "Справочник.МойСправочник",
    )
    expect(result).toBe(false)
  })

  it("отклоняет корневой узел без имени (один сегмент)", () => {
    const g = makeGraph()
    const result = validateReferenceScope(
      "Справочник",
      { target: "topLevel", allowedTypes: ["Справочник"] },
      g,
      "Справочник.МойСправочник",
    )
    expect(result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateReferenceScope — this/Form
// ---------------------------------------------------------------------------

describe("validateReferenceScope — this/Form", () => {
  function buildGraphWithForm(): { g: MetadataGraph; owner: string; formNode: string } {
    const g = makeGraph()
    const owner = "Справочник.МойСправочник"
    const formNode = "Справочник.МойСправочник.ФормаСписка"

    g.ensureNode(owner, { name: "МойСправочник" })
    g.ensureNode(formNode, { name: "ФормаСписка" })
    g.setNodeAttribute(formNode, "item", { itemType: "ClientApplicationForm", name: "ФормаСписка" })
    g.ensureEdge(`${owner}:form:${formNode}`, owner, formNode, {
      yaml: "ClientApplicationForm",
      name: "ФормаСписка",
      kind: "composition",
    })

    return { g, owner, formNode }
  }

  it("принимает прямого composition-потомка с itemType ClientApplicationForm", () => {
    const { g, owner, formNode } = buildGraphWithForm()
    const result = validateReferenceScope(formNode, { target: "this", kind: "Form" }, g, owner)
    expect(result).toBe(true)
  })

  it("отклоняет узел, не являющийся потомком owner", () => {
    const { g, owner } = buildGraphWithForm()
    const result = validateReferenceScope(
      "Справочник.ДругойСправочник.ФормаСписка",
      { target: "this", kind: "Form" },
      g,
      owner,
    )
    expect(result).toBe(false)
  })

  it("отклоняет потомка-заглушку (без item)", () => {
    const g = makeGraph()
    const owner = "Справочник.МойСправочник"
    const stubForm = "Справочник.МойСправочник.ФормаСписка"

    g.ensureNode(owner, { name: "МойСправочник" })
    g.ensureNode(stubForm, { name: "ФормаСписка" })
    // нет setNodeAttribute item — заглушка
    g.ensureEdge(`${owner}:form:${stubForm}`, owner, stubForm, {
      yaml: "ClientApplicationForm",
      name: "ФормаСписка",
      kind: "composition",
    })

    const result = validateReferenceScope(stubForm, { target: "this", kind: "Form" }, g, owner)
    expect(result).toBe(false)
  })

  it("отклоняет потомка с itemType MetadataAttribute (не форма)", () => {
    const g = makeGraph()
    const owner = "Справочник.МойСправочник"
    const attrNode = "Справочник.МойСправочник.КодовыйРеквизит"

    g.ensureNode(owner, { name: "МойСправочник" })
    g.ensureNode(attrNode, { name: "КодовыйРеквизит" })
    g.setNodeAttribute(attrNode, "item", { itemType: "MetadataAttribute", name: "КодовыйРеквизит" })
    g.ensureEdge(`${owner}:attr:${attrNode}`, owner, attrNode, {
      yaml: "Реквизит",
      name: "КодовыйРеквизит",
      kind: "composition",
    })

    const result = validateReferenceScope(attrNode, { target: "this", kind: "Form" }, g, owner)
    expect(result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateReferenceScope — this/Attribute
// ---------------------------------------------------------------------------

describe("validateReferenceScope — this/Attribute", () => {
  function buildGraphWithAttr(indexing?: string): { g: MetadataGraph; owner: string; attrNode: string } {
    const g = makeGraph()
    const owner = "Справочник.МойСправочник"
    const attrNode = "Справочник.МойСправочник.КодовыйРеквизит"

    g.ensureNode(owner, { name: "МойСправочник" })
    g.ensureNode(attrNode, { name: "КодовыйРеквизит" })
    g.setNodeAttribute(attrNode, "item", {
      itemType: "MetadataAttribute",
      name: "КодовыйРеквизит",
      ...(indexing !== undefined ? { indexing } : {}),
    })
    g.ensureEdge(`${owner}:attr:${attrNode}`, owner, attrNode, {
      yaml: "Реквизит",
      name: "КодовыйРеквизит",
      kind: "composition",
    })

    return { g, owner, attrNode }
  }

  it("принимает прямого потомка с itemType MetadataAttribute", () => {
    const { g, owner, attrNode } = buildGraphWithAttr()
    const result = validateReferenceScope(attrNode, { target: "this", kind: "Attribute" }, g, owner)
    expect(result).toBe(true)
  })

  it("отклоняет узел, не являющийся потомком owner", () => {
    const { g, owner } = buildGraphWithAttr()
    const result = validateReferenceScope(
      "Справочник.ДругойСправочник.Реквизит",
      { target: "this", kind: "Attribute" },
      g,
      owner,
    )
    expect(result).toBe(false)
  })

  it("отклоняет потомка с itemType MetadataCatalog (не реквизит)", () => {
    const g = makeGraph()
    const owner = "Справочник.МойСправочник"
    const childNode = "Справочник.МойСправочник.ТабличнаяЧасть1"

    g.ensureNode(owner, { name: "МойСправочник" })
    g.ensureNode(childNode, { name: "ТабличнаяЧасть1" })
    g.setNodeAttribute(childNode, "item", { itemType: "MetadataTabularSection", name: "ТабличнаяЧасть1" })
    g.ensureEdge(`${owner}:ts:${childNode}`, owner, childNode, {
      yaml: "ТабличнаяЧасть",
      name: "ТабличнаяЧасть1",
      kind: "composition",
    })

    const result = validateReferenceScope(childNode, { target: "this", kind: "Attribute" }, g, owner)
    expect(result).toBe(false)
  })

  it("принимает индексированный реквизит при filter: stringIndexedAttribute", () => {
    const { g, owner, attrNode } = buildGraphWithAttr("Index")
    const result = validateReferenceScope(
      attrNode,
      { target: "this", kind: "Attribute", filter: "stringIndexedAttribute" },
      g,
      owner,
    )
    expect(result).toBe(true)
  })

  it("отклоняет неиндексированный реквизит при filter: stringIndexedAttribute", () => {
    const { g, owner, attrNode } = buildGraphWithAttr("DontIndex")
    const result = validateReferenceScope(
      attrNode,
      { target: "this", kind: "Attribute", filter: "stringIndexedAttribute" },
      g,
      owner,
    )
    expect(result).toBe(false)
  })

  it("отклоняет реквизит без indexing при filter: stringIndexedAttribute", () => {
    const { g, owner, attrNode } = buildGraphWithAttr(undefined)
    const result = validateReferenceScope(
      attrNode,
      { target: "this", kind: "Attribute", filter: "stringIndexedAttribute" },
      g,
      owner,
    )
    expect(result).toBe(false)
  })
})
