import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import { xmlExport } from "./exporter"

const XML_ORDERED_CHILDREN = Symbol.for("xmlOrderedChildren")

describe("xmlExport", () => {
  it("groups ChildItems array into one XML node and preserves child order", () => {
    const xml = xmlExport(
      {
        ChildItems: [
          { InputField: { _name: "Input1" } },
          { LabelField: { _name: "Label2" } },
          { InputField: { _name: "Input3" } },
        ],
      },
      false
    )

    expect(xml).toBe(
      [
        "<ChildItems>",
        '\t<InputField name="Input1"/>',
        '\t<LabelField name="Label2"/>',
        '\t<InputField name="Input3"/>',
        "</ChildItems>",
      ].join("\n")
    )
  })

  it("preserves existing ordered children while normalizing export data", () => {
    const xml = xmlExport(
      {
        top: {
          [XML_ORDERED_CHILDREN]: [
            { key: "panel", value: { _id: "first-panel" } },
            { key: "group", value: { _id: "middle-group" } },
            { key: "panel", value: { _id: "last-panel" } },
          ],
        },
      },
      false
    )

    expect(xml).toBe(
      [
        "<top>",
        '\t<panel id="first-panel"/>',
        '\t<group id="middle-group"/>',
        '\t<panel id="last-panel"/>',
        "</top>",
      ].join("\n")
    )
  })

  it("exports structural nodes through the existing ordered XML builder", () => {
    const document = parseXmlDocumentWithSaxes(
      '<Root second="2" first="1"><A>one</A><B/><A>three</A></Root>'
    )

    expect(xmlExport(document.roots, false)).toBe(
      [
        '<Root second="2" first="1">',
        "\t<A>one</A>",
        "\t<B/>",
        "\t<A>three</A>",
        "</Root>",
      ].join("\n")
    )
  })

  it("round-trips the authoritative processing instruction body", () => {
    const source =
      '<Root><Before/><?legacy alpha a="1" z="2" a="3" &amp;?><After/></Root>'
    const document = parseXmlDocumentWithSaxes(source, { preserveXsiNil: true })

    const xml = xmlExport(document.roots, false)
    const roundTrippedRoot = parseXmlDocumentWithSaxes(xml, {
      preserveXsiNil: true,
    }).roots[0]
    const instruction = roundTrippedRoot?.content.find(
      (node) => node.type === "processingInstruction"
    )

    expect(xml).toContain('<?legacy alpha a="1" z="2" a="3" &amp;?>')
    expect(
      roundTrippedRoot?.content.flatMap((node) =>
        node.type === "text"
          ? []
          : [node.type === "element" ? node.name : `?${node.target}`]
      )
    ).toEqual(["Before", "?legacy", "After"])
    expect(instruction).toMatchObject({
      type: "processingInstruction",
      target: "legacy",
      body: 'alpha a="1" z="2" a="3" &amp;',
      attributes: [
        { name: "a", value: "1", occurrence: 1 },
        { name: "z", value: "2", occurrence: 1 },
        { name: "a", value: "3", occurrence: 2 },
      ],
    })
  })

  it("escapes normalized XML attribute whitespace as character references", () => {
    const source = '<Root value="line&#xA;carriage&#xD;tab&#x9;end"/>'
    const document = parseXmlDocumentWithSaxes(source, { preserveXsiNil: true })

    const xml = xmlExport(document.roots, false)
    const roundTripped = parseXmlDocumentWithSaxes(xml, {
      preserveXsiNil: true,
    }).roots[0]?.attributes[0]

    expect(xml).toBe(source)
    expect(roundTripped?.value).toBe("line\ncarriage\rtab\tend")
  })

  it.each([
    ['a="unterminated', /кавыч/],
    ['a="1" ?> trailing', /\?>/],
    ['a="2"', /псевдоатрибут/],
    ["alpha\u0000omega", /XML/],
  ])("rejects a processing instruction body that cannot round-trip: %s", (body, message) => {
    const document = parseXmlDocumentWithSaxes(
      '<Root><?legacy a="1"?></Root>',
      { preserveXsiNil: true }
    )
    const roots = document.roots.map((root) => ({
      ...root,
      content: root.content.map((node) =>
        node.type === "processingInstruction" ? { ...node, body } : node
      ),
    }))

    expect(() => xmlExport(roots, false)).toThrow(message)
  })
})
