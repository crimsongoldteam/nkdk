import { describe, expect, it } from "vitest"

import { serializeYAMLDocument } from "../../../yaml/export"
import {
  createXmlAnomalyAnnotations,
  xmlAnnotatedMappingEntries,
} from "../../../yaml/xmlAnomalyAnnotations"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import type { XmlElementNode } from "../../../xml/import/document"
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

  it("сохраняет полностью неизвестный узел одним raw со всем содержимым", () => {
    const root = parseXmlDocumentWithSaxes(
      [
        "<Root>",
        "  <Properties>",
        '    <Future mode="x">42<Child extra="y">value</Child>',
        "    </Future>",
        "  </Properties>",
        "</Root>",
      ].join("\n"),
    ).roots[0]!
    const properties = child(root, "Properties")
    const audit = createXmlImportAuditSession([root])
    audit.claim(root, boundary)
    audit.claim(properties, boundary)
    const annotations = createXmlAnomalyAnnotations()
    const yaml: Record<string, unknown> = {}

    projectXmlAuditRemainder({ yaml, annotations, audit, root, boundary })

    expect(yaml).toEqual({
      "Properties\\Future": {
        _mode: "x",
        "#text": "42",
        Child: { _extra: "y", "#text": "value" },
      },
    })
    expect(yaml).not.toHaveProperty("Properties")
    expect(yaml).not.toHaveProperty("Properties\\Future\\#attributes")
    expect(annotations.at(yaml, "Properties\\Future")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
    })
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

    expect(yaml).toEqual({
      "Properties\\#attributes": {
        _future: "b",
        "#order": ["_known", "_future"],
      },
    })
    expect(annotations.at(yaml, "Properties\\#attributes")).toMatchObject({
      kind: "raw",
      target: "value",
    })
  })

  it("сохраняет whitespace-only текст неизвестного leaf-элемента", () => {
    const { yaml, annotations } = projectUnknownRootChildren("<Root><Future> \n\t </Future></Root>")

    expect(yaml).toEqual({ Future: " \n\t " })
    expect(annotations.at(yaml, "Future")).toMatchObject({ kind: "raw", target: "value" })
  })

  it("отбрасывает форматирующие отступы вокруг structural children", () => {
    const { yaml } = projectUnknownRootChildren(
      "<Root><Future>\n  <Child>value</Child>\n</Future></Root>",
    )

    expect(yaml).toEqual({ Future: { Child: "value" } })
  })

  it("нормализует mixed text без потери текста до и после ребёнка", () => {
    const { yaml } = projectUnknownRootChildren(
      "<Root><Future>before<Child/>after</Future></Root>",
    )

    expect(yaml).toEqual({ Future: { "#text": "beforeafter", Child: {} } })
    const decoded = decodeXmlRawValue(yaml.Future, { elementName: "Future" }).nodes[0]!
    expect(decoded.content.map((node) =>
      node.type === "text" ? node.value : node.type === "element" ? node.name : `?${node.target}`,
    )).toEqual([
      "beforeafter",
      "Child",
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

    expect(yaml).toEqual({ Известное: "future text", Сосед: "known" })
    expect(annotations.at(yaml, "Известное")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
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

    expect(yaml).toEqual({ Известное: { "?future": { _mode: "x" } } })
    expect(annotations.at(yaml, "Известное")).toMatchObject({ kind: "raw", target: "value" })
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
