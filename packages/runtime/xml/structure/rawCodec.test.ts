import { describe, expect, it } from "vitest"
import { xmlExport } from "../export/exporter"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import { compareXmlStructures } from "./compare"
import {
  applyXmlPatch,
  decodeXmlRawEnvelope,
  decodeXmlRawOrderPatch,
  decodeXmlRawValue,
  readdressXmlElementNodes,
} from "./rawCodec"

const contentLabels = (nodes: ReturnType<typeof decodeXmlRawValue>["nodes"]): string[] =>
  nodes[0]?.content.map((node) =>
    node.type === "text" ? node.value : node.type === "element" ? node.name : `?${node.target}`,
  ) ?? []

describe("decodeXmlRawValue", () => {
  it("сохраняет порядок полного вложенного XML-патча при добавлении ребёнка", () => {
    const patched = applyXmlPatch(
      {
        A: {},
        B: {},
        ChildItems: {},
      },
      {
        A: {},
        RowFilter: { "_xsi:nil": "true" },
        B: {},
        ChildItems: {},
      },
    )

    const fragment = decodeXmlRawValue(patched, { elementName: "Table" })

    expect(contentLabels(fragment.nodes)).toEqual(["A", "RowFilter", "B", "ChildItems"])
  })

  it("декодирует точный текст оболочки вместе с #order", () => {
    expect(decodeXmlRawOrderPatch({
      "#text": ["\n  ", "\n  ", "\n"],
      "#order": ["#text", "A", "#text", "B", "#text"],
    })).toEqual({
      text: ["\n  ", "\n  ", "\n"],
      order: ["#text", "A", "#text", "B", "#text"],
    })
  })

  it("decodes only the explicit semantic value and XML patch envelope", () => {
    expect(decodeXmlRawEnvelope({
      "$значение": 1,
      "$xml": { "#text": "01" },
    })).toEqual({
      semanticValue: 1,
      hasSemanticValue: true,
      xml: { "#text": "01" },
    })
    expect(decodeXmlRawEnvelope({ "$xml": { Future: "42" } })).toEqual({
      semanticValue: undefined,
      hasSemanticValue: false,
      xml: { Future: "42" },
    })
    expect(() => decodeXmlRawEnvelope({ "$значение": 1 })).toThrow(/\$xml/)
    expect(() => decodeXmlRawEnvelope({ "$xml": {}, "$future": true })).toThrow(/\$future/)
  })

  it("preserves scalar text and distinguishes an absent XML place", () => {
    const scalar = decodeXmlRawValue("01", { elementName: "Value" })
    const absent = decodeXmlRawValue(null, { elementName: "Value" })

    expect(scalar.nodes).toHaveLength(1)
    expect(scalar.nodes[0]).toMatchObject({
      name: "Value",
      path: "/Value[1]",
      content: [{ type: "text", value: "01", path: "/Value[1]/#text[1]" }],
    })
    expect(scalar.suppressOrdinaryOutput).toBe(true)
    expect(absent).toEqual({ nodes: [], suppressOrdinaryOutput: true })
  })

  it("decodes attributes, text, an external name, repeated children and explicit order", () => {
    const fragment = decodeXmlRawValue(
      {
        "#name": "LegacyValue",
        _second: "2",
        _first: "1",
        "#text": "prefix",
        A: ["one", "three"],
        B: { _mode: "new", "#text": "two" },
        "#order": ["#text", "A", "B", "A"],
      },
      { elementName: "Value" }
    )

    expect(fragment.nodes[0]).toMatchObject({
      name: "LegacyValue",
      attributes: [
        { name: "second", value: "2" },
        { name: "first", value: "1" },
      ],
      content: [
        { type: "text", value: "prefix" },
        { type: "element", name: "A", content: [{ type: "text", value: "one" }] },
        {
          type: "element",
          name: "B",
          attributes: [{ name: "mode", value: "new" }],
          content: [{ type: "text", value: "two" }],
        },
        { type: "element", name: "A", content: [{ type: "text", value: "three" }] },
      ],
    })
  })

  it("round-trips text occurrences interleaved with an XML child", () => {
    const source = parseXmlDocumentWithSaxes(
      "<Value>before<Child/>after</Value>",
    ).roots
    const fragment = decodeXmlRawValue(
      {
        "#text": ["before", "after"],
        Child: {},
        "#order": ["#text", "Child", "#text"],
      },
      { elementName: "Value" },
    )

    expect(contentLabels(fragment.nodes)).toEqual(["before", "Child", "after"])
    const exportedXml = xmlExport(fragment.nodes, false)
    expect(exportedXml).toBe("<Value>before<Child/>after</Value>")
    const exported = parseXmlDocumentWithSaxes(exportedXml).roots
    expect(compareXmlStructures(source, exported)).toEqual([])
  })

  it("поддерживает legacy scalar #text как неявный префикс child-only #order", () => {
    const fragment = decodeXmlRawValue(
      {
        "#text": "prefix",
        A: "one",
        B: "two",
        "#order": ["B", "A"],
      },
      { elementName: "Value" },
    )

    expect(contentLabels(fragment.nodes)).toEqual(["prefix", "B", "A"])
    expect(xmlExport(fragment.nodes, false)).toBe(
      "<Value>prefix<B>two</B><A>one</A></Value>",
    )
  })

  it("uses the SAX-canonical processing instruction body without a leading separator", () => {
    const fragment = decodeXmlRawValue(
      { "?legacy": { _first: "x&amp;y", _second: "2" } },
      { elementName: "Value" }
    )

    expect(fragment.nodes[0]?.content[0]).toMatchObject({
      type: "processingInstruction",
      body: 'first="x&amp;y" second="2"',
    })
  })

  it("readdresses processing instruction pseudo-attributes per name", () => {
    const roots = parseXmlDocumentWithSaxes(
      '<Root><?legacy a="1" z="2" a="3"?></Root>',
      { preserveXsiNil: true }
    ).roots
    const instruction = readdressXmlElementNodes(roots)[0]?.content[0]

    expect(instruction).toMatchObject({
      type: "processingInstruction",
      attributes: [
        { name: "a", occurrence: 1, path: "/Root[1]/?legacy[1]/@a[1]" },
        { name: "z", occurrence: 1, path: "/Root[1]/?legacy[1]/@z[1]" },
        { name: "a", occurrence: 2, path: "/Root[1]/?legacy[1]/@a[2]" },
      ],
    })
  })

  it.each([
    [1, "строкой"],
    [true, "строкой"],
    [{ _id: 1 }, "атрибута"],
    [{ "#text": false }, "#text"],
    [{ "#text": ["before", 1] }, "#text"],
    [{ Child: null }, "null"],
    [{ Child: { "#name": "Renamed" } }, "#name"],
    [{ A: ["one", "two"], "#order": ["A"] }, "#order"],
    [{ "#text": ["before", "after"], Child: {}, "#order": ["#text", "Child"] }, "#order"],
    [{ "?xml": { _version: "1.0" } }, "декларац"],
    [{ "!DOCTYPE": "Root" }, "DOCTYPE"],
  ])("rejects an invalid raw payload %#", (value, expectedMessage) => {
    expect(() => decodeXmlRawValue(value, { elementName: "Value" })).toThrow(
      expectedMessage as string
    )
  })

  it("rejects a pseudo-attribute value that disagrees with its canonical PI body", () => {
    expect(() =>
      decodeXmlRawValue(
        { "?legacy": { _value: 'broken"' } },
        { elementName: "Value" }
      )
    ).toThrow(/псевдоатрибут/)
  })

  it("rejects a PI terminator inside a pseudo-attribute value", () => {
    expect(() =>
      decodeXmlRawValue(
        { "?legacy": { _value: "broken?>" } },
        { elementName: "Value" }
      )
    ).toThrow(/\?>/)
  })

  it("rejects !xml/raw on a YAML key", () => {
    expect(() =>
      decodeXmlRawValue("value", { elementName: "Value", placement: "key" })
    ).toThrow(/ключ/)
  })
})
