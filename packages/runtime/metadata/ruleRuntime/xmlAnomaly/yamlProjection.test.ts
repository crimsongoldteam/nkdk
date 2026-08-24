import { describe, expect, it } from "vitest"

import { serializeYAMLDocument } from "../../../yaml/export"
import {
  createXmlAnomalyAnnotations,
  xmlAnnotatedMappingEntries,
} from "../../../yaml/xmlAnomalyAnnotations"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import type { XmlElementNode } from "../../../xml/import/document"
import { xmlExport } from "../../../xml/export/exporter"
import { decodeXmlRawValue } from "../../../xml/structure/rawCodec"
import {
  createXmlImportAuditSession,
  type XmlImportAuditBoundary,
} from "./importAudit"
import {
  projectNamedXmlCollection,
  projectXmlAuditRemainder,
} from "./yamlProjection"

const boundary: XmlImportAuditBoundary = {
  itemType: "SyntheticItem",
  yamlPath: [],
  rulePath: [],
}

describe("YAML-проекция XML-аномалий", () => {
  it("сохраняет повторные ключи именованной коллекции в XML-порядке", () => {
    const annotations = createXmlAnomalyAnnotations()

    const projected = projectNamedXmlCollection({
      entries: [
        { key: "Код", value: { Тип: "Строка" } },
        { key: "Наименование", value: { Тип: "Строка" } },
        { key: "Код", value: { Тип: "Число" } },
        { key: "Цена", value: { Тип: "Число" } },
        { key: "Код", value: { Тип: "Дата" } },
      ],
      annotations,
    })

    expect(xmlAnnotatedMappingEntries(projected, annotations)).toEqual([
      ["Код", { Тип: "Строка" }],
      ["Наименование", { Тип: "Строка" }],
      ["Код", { Тип: "Число" }],
      ["Цена", { Тип: "Число" }],
      ["Код", { Тип: "Дата" }],
    ])
    const serialized = serializeYAMLDocument(projected, annotations).text
    expect(serialized).toContain("!xml/invalid Код:")
    expect(serialized).toContain("!xml/invalid/2 Код:")
    expect(serialized).not.toContain("#order")
    expect(serialized).not.toContain("__NKDK_XML_ANOMALY_KEY_")
  })

  it("нумерует невалидный первый ключ и его повтор единым адресным рядом", () => {
    const annotations = createXmlAnomalyAnnotations()

    const projected = projectNamedXmlCollection({
      entries: [
        { key: "1Код", value: { Тип: "Строка" }, invalid: true },
        { key: "1Код", value: { Тип: "Число" }, invalid: true },
      ],
      annotations,
    })

    const serialized = serializeYAMLDocument(projected, annotations).text
    expect(serialized).toContain("!xml/invalid 1Код:")
    expect(serialized).toContain("!xml/invalid/2 1Код:")
    expect(xmlAnnotatedMappingEntries(projected, annotations).map(([key]) => key)).toEqual([
      "1Код",
      "1Код",
    ])
  })

  it("сочетает invalid повторного ключа с raw его непонятного XML-значения", () => {
    const root = parseXmlDocumentWithSaxes(
      '<Root><Known>first</Known><Known><?future mode="x"?></Known></Root>',
    ).roots[0]!
    const known = root.content.filter(
      (node): node is XmlElementNode => node.type === "element" && node.name === "Known",
    )
    const annotations = createXmlAnomalyAnnotations()
    const projected = projectNamedXmlCollection({
      entries: [
        { key: "Known", value: "first" },
        { key: "Known", value: "second" },
      ],
      annotations,
    })
    const runtimeKeys = Object.keys(projected)
    const firstBoundary: XmlImportAuditBoundary = {
      itemType: "SyntheticItem",
      yamlPath: [runtimeKeys[0]!],
    }
    const duplicateBoundary: XmlImportAuditBoundary = {
      itemType: "SyntheticItem",
      yamlPath: [runtimeKeys[1]!],
    }
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(known[0]!, firstBoundary)
    audit.claim(known[0]!.content[0]!, firstBoundary)
    audit.duplicate(known[1]!, duplicateBoundary)

    projectXmlAuditRemainder({ yaml: projected, annotations, audit, root, boundary })

    expect(annotations.at(projected, runtimeKeys[1]!)).toMatchObject({
      kind: "raw",
      target: "value",
      hasSemanticValue: true,
      xml: { "?future": { _mode: "x" } },
    })
    const serialized = serializeYAMLDocument(projected, annotations).text
    expect(serialized).toContain("!xml/invalid Known: !xml/raw")
    expect(serialized).toContain("$значение: second")
  })

  it("сохраняет полностью неизвестный узел одним raw со всем содержимым", () => {
    const root = parseXmlDocumentWithSaxes(
      '<Root><Properties><Future mode="x">42<Child extra="y">value</Child> ' +
      "</Future></Properties></Root>",
    ).roots[0]!
    const properties = child(root, "Properties")
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(properties, boundary)
    const annotations = createXmlAnomalyAnnotations()
    const yaml: Record<string, unknown> = {}

    projectXmlAuditRemainder({ yaml, annotations, audit, root, boundary })

    expect(yaml).toEqual({ "Properties\\Future": undefined })
    expect(annotations.at(yaml, "Properties\\Future")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
      hasSemanticValue: false,
      xml: {
        _mode: "x",
        "#text": ["42", " "],
        Child: { _extra: "y", "#text": "value" },
        "#order": ["#text", "Child", "#text"],
      },
    })
    expect(yaml).not.toHaveProperty("Properties")
    expect(yaml).not.toHaveProperty("Properties\\Future\\#attributes")
  })

  it("использует #attributes только для неизвестного атрибута известного родителя", () => {
    const root = parseXmlDocumentWithSaxes(
      '<Root><Properties known="a" future="b"/></Root>',
    ).roots[0]!
    const properties = child(root, "Properties")
    const known = properties.attributes.find(({ name }) => name === "known")!
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(properties, boundary)
    audit.claim(known, boundary)
    const annotations = createXmlAnomalyAnnotations()
    const yaml: Record<string, unknown> = {}

    projectXmlAuditRemainder({ yaml, annotations, audit, root, boundary })

    expect(yaml).toEqual({ "Properties\\#attributes": undefined })
    expect(annotations.at(yaml, "Properties\\#attributes")).toMatchObject({
      kind: "raw",
      target: "value",
      hasSemanticValue: false,
      xml: {
        _future: "b",
        "#order": ["_known", "_future"],
      },
    })
  })

  it("сохраняет whitespace-only текст неизвестного leaf-элемента", () => {
    const { yaml, annotations } = projectUnknownRootChildren("<Root><Future> \n\t </Future></Root>")

    expect(yaml).toEqual({ Future: undefined })
    expect(annotations.at(yaml, "Future")).toMatchObject({
      kind: "raw",
      target: "value",
      xml: " \n\t ",
      hasSemanticValue: false,
    })
  })

  it("сохраняет все whitespace occurrences вокруг structural children", () => {
    const { yaml, annotations } = projectUnknownRootChildren(
      "<Root><Future>\n  <Child>value</Child>\n</Future></Root>",
    )

    expect(yaml).toEqual({ Future: undefined })
    expect(annotations.at(yaml, "Future")).toMatchObject({
      xml: {
        "#text": ["\n  ", "\n"],
        Child: "value",
        "#order": ["#text", "Child", "#text"],
      },
    })
  })

  it("сохраняет whitespace occurrence после structural child", () => {
    const { yaml, annotations } = projectUnknownRootChildren(
      "<Root><Future><Child/> </Future></Root>",
    )

    expect(yaml).toEqual({ Future: undefined })
    const xml = annotations.at(yaml, "Future")?.xml
    expect(xml).toEqual({
        "#text": " ",
        Child: {},
        "#order": ["Child", "#text"],
    })
    const decoded = decodeXmlRawValue(xml, { elementName: "Future" })
    expect(xmlExport(decoded.nodes, false)).toBe("<Future><Child/> </Future>")
  })

  it("сохраняет точный mixed text до и после ребёнка", () => {
    const { yaml, annotations } = projectUnknownRootChildren(
      "<Root><Future>before<Child/>after</Future></Root>",
    )

    expect(yaml).toEqual({ Future: undefined })
    const xml = annotations.at(yaml, "Future")?.xml
    expect(xml).toEqual({
        "#text": ["before", "after"],
        Child: {},
        "#order": ["#text", "Child", "#text"],
    })
    const decoded = decodeXmlRawValue(xml, { elementName: "Future" }).nodes[0]!
    expect(decoded.content.map((node) =>
      node.type === "text" ? node.value : node.type === "element" ? node.name : `?${node.target}`,
    )).toEqual([
      "before",
      "Child",
      "after",
    ])
  })

  it("поднимает неизвестный text leaf к однозначной property boundary, не поглощая соседа", () => {
    const root = parseXmlDocumentWithSaxes(
      "<Root><Known>future text</Known><Neighbor>known</Neighbor></Root>",
    ).roots[0]!
    const known = child(root, "Known")
    const neighbor = child(root, "Neighbor")
    const knownBoundary: XmlImportAuditBoundary = {
      itemType: "SyntheticItem",
      propertyKey: "known",
      yamlPath: ["Известное"],
      rulePath: [{ propertyKey: "known" }],
    }
    const neighborBoundary: XmlImportAuditBoundary = {
      itemType: "SyntheticItem",
      propertyKey: "neighbor",
      yamlPath: ["Сосед"],
      rulePath: [{ propertyKey: "neighbor" }],
    }
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(known, knownBoundary)
    audit.claim(neighbor, neighborBoundary)
    audit.claim(neighbor.content[0]!, neighborBoundary)
    const annotations = createXmlAnomalyAnnotations()
    const yaml: Record<string, unknown> = { Известное: "semantic", Сосед: "known" }

    projectXmlAuditRemainder({ yaml, annotations, audit, root, boundary })

    expect(yaml).toEqual({ Известное: "semantic", Сосед: "known" })
    expect(annotations.at(yaml, "Известное")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
      xml: "future text",
      hasSemanticValue: true,
    })
    expect(annotations.at(yaml, "Сосед")).toBeUndefined()
  })

  it("поднимает неизвестный processing instruction к property boundary", () => {
    const root = parseXmlDocumentWithSaxes(
      '<Root><Known><?future mode="x"?></Known></Root>',
    ).roots[0]!
    const known = child(root, "Known")
    const knownBoundary: XmlImportAuditBoundary = {
      itemType: "SyntheticItem",
      propertyKey: "known",
      yamlPath: ["Известное"],
      rulePath: [{ propertyKey: "known" }],
    }
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(known, knownBoundary)
    const annotations = createXmlAnomalyAnnotations()
    const yaml: Record<string, unknown> = { Известное: {} }

    projectXmlAuditRemainder({ yaml, annotations, audit, root, boundary })

    expect(yaml).toEqual({ Известное: {} })
    expect(annotations.at(yaml, "Известное")).toMatchObject({
      kind: "raw",
      target: "value",
      xml: { "?future": { _mode: "x" } },
      hasSemanticValue: true,
    })
  })

  it("отклоняет подъём raw к неоднозначной owner boundary", () => {
    const root = parseXmlDocumentWithSaxes("<Root><Known>future text</Known></Root>").roots[0]!
    const known = child(root, "Known")
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.ambiguous(known, [
      { itemType: "SyntheticItem", propertyKey: "first", yamlPath: ["Первое"] },
      { itemType: "SyntheticItem", propertyKey: "second", yamlPath: ["Второе"] },
    ])

    expectProjectionToFail(root, audit, /неоднозначн.*owner boundary/i)
  })

  it("отклоняет descendant boundary, выходящую за поднимаемый XML subtree", () => {
    const root = parseXmlDocumentWithSaxes(
      "<Root><Known>future<Child/></Known><Outside/></Root>",
    ).roots[0]!
    const known = child(root, "Known")
    const knownChild = child(known, "Child")
    const outside = child(root, "Outside")
    const ownerBoundary: XmlImportAuditBoundary = {
      itemType: "SyntheticItem",
      propertyKey: "known",
      yamlPath: ["Владелец"],
    }
    const crossingBoundary: XmlImportAuditBoundary = {
      itemType: "SyntheticItem",
      propertyKey: "crossing",
      yamlPath: ["Владелец", "Потомок"],
    }
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(known, ownerBoundary)
    audit.claim(knownChild, crossingBoundary)
    audit.claim(outside, crossingBoundary)

    expectProjectionToFail(root, audit, /выходящей за subtree/)
  })

  it("отклоняет полностью неизвестный XML-корень без stable owner", () => {
    const root = parseXmlDocumentWithSaxes("<Future>value</Future>").roots[0]!
    const audit = createXmlImportAuditSession([root])

    expectProjectionToFail(root, audit, /Ближайший YAML-владелец не заявил XML-корень/)
  })

  it("отклоняет raw-границу, пересекающуюся с известным потомком", () => {
    const root = parseXmlDocumentWithSaxes(
      "<Root><Future><Known>value</Known></Future></Root>",
    ).roots[0]!
    const future = child(root, "Future")
    const known = child(future, "Known")
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(known, boundary)
    audit.claim(known.content[0]!, boundary)

    expectProjectionToFail(root, audit, /пересекается с известной XML-границей/)
  })

  it("не превращает неизвестный повтор известного XML-пути в raw", () => {
    const root = parseXmlDocumentWithSaxes(
      "<Root><Known>first</Known><Known>second</Known></Root>",
    ).roots[0]!
    const known = root.content.find(
      (node): node is XmlElementNode => node.type === "element" && node.name === "Known",
    )!
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(known, boundary)
    audit.claim(known.content[0]!, boundary)

    expectProjectionToFail(
      root,
      audit,
      /XML-путь Known уже принадлежит известной XML-границе/,
    )
  })
})

function expectProjectionToFail(
  root: XmlElementNode,
  audit: ReturnType<typeof createXmlImportAuditSession>,
  expected: RegExp,
): void {
  expect(() => projectXmlAuditRemainder({
    yaml: {},
    annotations: createXmlAnomalyAnnotations(),
    audit,
    root,
    boundary,
  })).toThrow(expected)
}

function projectUnknownRootChildren(xml: string): {
  yaml: Record<string, unknown>
  annotations: ReturnType<typeof createXmlAnomalyAnnotations>
} {
  const root = parseXmlDocumentWithSaxes(xml).roots[0]!
  const audit = createXmlImportAuditSession([root])
  audit.claim(root, boundary)
  const annotations = createXmlAnomalyAnnotations()
  const yaml: Record<string, unknown> = {}
  projectXmlAuditRemainder({ yaml, annotations, audit, root, boundary })
  return { yaml, annotations }
}

function child(parent: XmlElementNode, name: string): XmlElementNode {
  const found = parent.content.find(
    (node): node is XmlElementNode => node.type === "element" && node.name === name,
  )
  if (found === undefined) throw new Error(`Не найден XML-узел ${name}`)
  return found
}
