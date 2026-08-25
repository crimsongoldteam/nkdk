import { describe, expect, it } from "vitest"
import type { XmlElementNode } from "../import/document"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import { xmlExport } from "../export/exporter"
import { mergeXmlRawFragments, type XmlRawMergeBoundary } from "./merge"

const roots = (xml: string): readonly XmlElementNode[] =>
  parseXmlDocumentWithSaxes(xml, { preserveXsiNil: true }).roots

describe("mergeXmlRawFragments", () => {
  it("recursively applies an XML patch without replacing the semantic boundary", () => {
    const ordinary = roots(
      '<Root><Value mode="old"><Known>kept</Known><Changed>old</Changed><Removed>gone</Removed></Value></Root>',
    )

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Value",
        value: {
          _mode: "new",
          Changed: "new",
          Removed: null,
          Added: "added",
          "#order": ["Known", "Changed", "Added"],
        },
        suppressOrdinaryOutput: false,
        hasSemanticValue: true,
      },
    ])

    expect(xmlExport(merged, false)).toBe([
      '<Root>',
      '\t<Value mode="new">',
      '\t\t<Known>kept</Known>',
      '\t\t<Changed>new</Changed>',
      '\t\t<Added>added</Added>',
      '\t</Value>',
      '</Root>',
    ].join("\n"))
  })

  it("merges a hierarchical raw path with attribute and child-order terminals", () => {
    const ordinary = roots('<Root><Properties id="known"><Name>Items</Name></Properties></Root>')

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Properties\\Future",
        value: { _mode: "new", "#text": "42" },
        suppressOrdinaryOutput: false,
      },
      {
        path: "Properties\\#attributes",
        value: { _custom: "x", "#order": ["_custom", "_id"] },
        suppressOrdinaryOutput: false,
      },
      {
        path: "Properties\\#order",
        value: ["Future", "Name"],
        suppressOrdinaryOutput: false,
      },
    ])

    expect(xmlExport(merged, false)).toBe(
      [
        "<Root>",
        '\t<Properties custom="x" id="known">',
        '\t\t<Future mode="new">42</Future>',
        "\t\t<Name>Items</Name>",
        "\t</Properties>",
        "</Root>",
      ].join("\n")
    )
  })

  it("applies a #order terminal to text occurrences and structural children", () => {
    const ordinary = roots(
      "<Root><Properties>before<Name>Items</Name>after</Properties></Root>",
    )

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Properties\\#order",
        value: ["#text", "Name", "#text"],
        suppressOrdinaryOutput: false,
      },
    ])

    expect(xmlExport(merged, false)).toBe(
      [
        "<Root>",
        "\t<Properties>before<Name>Items</Name>after</Properties>",
        "</Root>",
      ].join("\n"),
    )
  })

  it("восстанавливает точный текст оболочки при вставке отсутствующего raw-ребёнка", () => {
    const merged = mergeXmlRawFragments(roots("<Root><Properties><B/></Properties></Root>"), [
      {
        path: "Properties\\A",
        value: {},
        suppressOrdinaryOutput: true,
      },
      {
        path: "Properties\\#order",
        value: {
          "#text": ["\n  ", "\n  ", "\n"],
          "#order": ["#text", "A", "#text", "B", "#text"],
        },
        suppressOrdinaryOutput: false,
      },
    ])
    const properties = merged[0]!.content.find(
      (node): node is XmlElementNode => node.type === "element" && node.name === "Properties",
    )!

    expect(properties.content.map((node) =>
      node.type === "text" ? node.value : node.type === "element" ? node.name : `?${node.target}`
    )).toEqual(["\n  ", "A", "\n  ", "B", "\n"])
  })

  it("не восстанавливает форматирующий whitespace вокруг ребёнка", () => {
    const ordinary = roots(
      "<Root><Properties><Name>Items</Name> </Properties></Root>",
    )

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Properties\\#order",
        value: ["Name"],
        suppressOrdinaryOutput: false,
      },
    ])

    expect(xmlExport(merged, false)).toBe([
      "<Root>",
      "\t<Properties>",
      "\t\t<Name>Items</Name>",
      "\t</Properties>",
      "</Root>",
    ].join("\n"))
  })

  it("сохраняет scalar text как префикс при legacy child-only #order", () => {
    const ordinary = roots(
      "<Root><Properties>prefix<A/><B/></Properties></Root>",
    )

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Properties\\#order",
        value: ["B", "A"],
        suppressOrdinaryOutput: false,
      },
    ])

    expect(xmlExport(merged, false)).toBe(
      ["<Root>", "\t<Properties>prefix<B/><A/></Properties>", "</Root>"].join("\n"),
    )
  })

  it("creates missing wrappers for a path of arbitrary depth", () => {
    const merged = mergeXmlRawFragments(roots("<Root><Properties/></Root>"), [
      {
        path: "Properties\\Appearance\\Future",
        value: "42",
        suppressOrdinaryOutput: false,
      },
    ])

    expect(xmlExport(merged, false)).toBe(
      [
        "<Root>",
        "\t<Properties>",
        "\t\t<Appearance>",
        "\t\t\t<Future>42</Future>",
        "\t\t</Appearance>",
        "\t</Properties>",
        "</Root>",
      ].join("\n")
    )
  })

  it.each([
    ["root-inclusive", "Root\\Root\\Properties\\Future"],
    ["relative", "Root\\Properties\\Future"],
  ])("resolves a %s path into a same-name root wrapper exactly once", (_kind, path) => {
    const ordinary = roots("<Root><Root><Properties/></Root></Root>")

    const merged = mergeXmlRawFragments(ordinary, [
      { path, value: "42", suppressOrdinaryOutput: false },
    ])

    expect(xmlExport(merged, false)).toBe(
      [
        "<Root>",
        "\t<Root>",
        "\t\t<Properties>",
        "\t\t\t<Future>42</Future>",
        "\t\t</Properties>",
        "\t</Root>",
        "</Root>",
      ].join("\n")
    )
  })

  it("always treats a single leading root name as a relative wrapper", () => {
    const ordinary = roots("<Root><Properties/></Root>")

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Root\\Properties\\Future",
        value: "42",
        suppressOrdinaryOutput: false,
      },
    ])

    expect(xmlExport(merged, false)).toBe(
      [
        "<Root>",
        "\t<Properties/>",
        "\t<Root>",
        "\t\t<Properties>",
        "\t\t\t<Future>42</Future>",
        "\t\t</Properties>",
        "\t</Root>",
        "</Root>",
      ].join("\n")
    )
  })

  it("canonicalizes relative and root-inclusive paths to the same root wrapper", () => {
    const ordinary = roots("<Root><Root><Properties/></Root></Root>")
    const before = xmlExport(ordinary, false)

    expect(() =>
      mergeXmlRawFragments(ordinary, [
        {
          path: "Root\\Root\\Properties\\Future",
          value: "one",
          suppressOrdinaryOutput: false,
        },
        {
          path: "Root\\Properties\\Future",
          value: "two",
          suppressOrdinaryOutput: false,
        },
      ])
    ).toThrow(/повторн.*пут/)
    expect(xmlExport(ordinary, false)).toBe(before)
  })

  it("replaces or suppresses ordinary output only for an explicit known boundary", () => {
    const merged = mergeXmlRawFragments(
      roots("<Root><Properties><Visibility>true</Visibility><Default>auto</Default></Properties></Root>"),
      [
        {
          path: "Properties\\Visibility",
          value: "Switch",
          suppressOrdinaryOutput: true,
        },
        {
          path: "Properties\\Default",
          value: null,
          suppressOrdinaryOutput: true,
        },
      ]
    )

    expect(xmlExport(merged, false)).toBe(
      [
        "<Root>",
        "\t<Properties>",
        "\t\t<Visibility>Switch</Visibility>",
        "\t</Properties>",
        "</Root>",
      ].join("\n")
    )
  })

  it("сохраняет физические вхождения коллекции при удалении более раннего item", () => {
    const ordinary = roots(
      "<Root><Items><Item><Value>one</Value></Item><Item><Value>two</Value></Item><Item><Value>three</Value></Item></Items></Root>",
    )

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Items\\Item",
        occurrencePath: [null, 1],
        value: null,
        suppressOrdinaryOutput: true,
      },
      {
        path: "Items\\Item\\Value",
        occurrencePath: [null, 3, null],
        value: "raw-three",
        suppressOrdinaryOutput: true,
      },
    ])

    expect(xmlExport(merged, false)).toBe([
      "<Root>",
      "\t<Items>",
      "\t\t<Item>",
      "\t\t\t<Value>two</Value>",
      "\t\t</Item>",
      "\t\t<Item>",
      "\t\t\t<Value>raw-three</Value>",
      "\t\t</Item>",
      "\t</Items>",
      "</Root>",
    ].join("\n"))
  })

  it("фиксирует terminal и attribute override на узлах до удаления раннего item", () => {
    const ordinary = roots([
      '<Root><Items><Item name="one"><A>1</A><B>1</B></Item>',
      '<Item name="two"><A>2</A><B>2</B></Item>',
      '<Item name="three"><A>3</A><B>3</B></Item></Items></Root>',
    ].join(""))

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Items\\Item",
        occurrencePath: [null, 1],
        value: null,
        suppressOrdinaryOutput: true,
      },
      {
        path: "Items\\Item\\#attributes",
        occurrencePath: [null, 2, null],
        value: { _future: "x", "#order": ["_name", "_future"] },
        suppressOrdinaryOutput: false,
      },
      {
        path: "Items\\Item\\#order",
        occurrencePath: [null, 2, null],
        value: ["B", "A"],
        suppressOrdinaryOutput: false,
      },
      {
        path: "Items\\Item",
        occurrencePath: [null, 3],
        value: "renamed-three",
        suppressOrdinaryOutput: false,
        attributeOverride: { name: "name", value: "renamed-three" },
      },
    ])

    expect(xmlExport(merged, false)).toBe([
      "<Root>",
      "\t<Items>",
      '\t\t<Item name="two" future="x">',
      "\t\t\t<B>2</B>",
      "\t\t\t<A>2</A>",
      "\t\t</Item>",
      '\t\t<Item name="renamed-three">',
      "\t\t\t<A>3</A>",
      "\t\t\t<B>3</B>",
      "\t\t</Item>",
      "\t</Items>",
      "</Root>",
    ].join("\n"))
  })

  it("treats null at an absent deep path as a no-op without creating wrappers", () => {
    const ordinary = roots("<Root><Properties><Name>Items</Name></Properties></Root>")

    const merged = mergeXmlRawFragments(ordinary, [
      {
        path: "Properties\\Missing\\Value",
        value: null,
        suppressOrdinaryOutput: true,
      },
    ])

    expect(xmlExport(merged, false)).toBe(xmlExport(ordinary, false))
  })

  it("rejects an effective #name that collides with an ordinary sibling", () => {
    const ordinary = roots("<Root><Properties><Legacy/></Properties></Root>")

    expect(() =>
      mergeXmlRawFragments(ordinary, [
        {
          path: "Properties\\Future",
          value: { "#name": "Legacy" },
          suppressOrdinaryOutput: false,
        },
      ])
    ).toThrow(/обычн.*вывод/)
  })

  it("rejects equal effective #name values from separate planned children", () => {
    const ordinary = roots("<Root><Properties/></Root>")

    expect(() =>
      mergeXmlRawFragments(ordinary, [
        {
          path: "Properties\\Future",
          value: { "#name": "Legacy" },
          suppressOrdinaryOutput: false,
        },
        {
          path: "Properties\\Other",
          value: { "#name": "Legacy" },
          suppressOrdinaryOutput: false,
        },
      ])
    ).toThrow(/обычн.*вывод/)
  })

  it("does not let suppression replace a previously planned effective #name", () => {
    const ordinary = roots("<Root><Properties/></Root>")
    const before = xmlExport(ordinary, false)

    expect(() =>
      mergeXmlRawFragments(ordinary, [
        {
          path: "Properties\\Future",
          value: { "#name": "Legacy" },
          suppressOrdinaryOutput: false,
        },
        {
          path: "Properties\\Legacy",
          value: { "#name": "Legacy" },
          suppressOrdinaryOutput: true,
        },
      ])
    ).toThrow(/обычн.*вывод/)
    expect(xmlExport(ordinary, false)).toBe(before)
  })

  it.each<{
    name: string
    boundaries: readonly XmlRawMergeBoundary[]
    expectedMessage: RegExp
  }>([
    {
      name: "ordinary output intersection",
      boundaries: [
        { path: "Properties\\Name", value: "Other", suppressOrdinaryOutput: false },
      ],
      expectedMessage: /обычн.*вывод/,
    },
    {
      name: "duplicate path",
      boundaries: [
        { path: "Properties\\Future", value: "one", suppressOrdinaryOutput: false },
        { path: "Properties\\Future", value: "two", suppressOrdinaryOutput: false },
      ],
      expectedMessage: /повторн.*пут/,
    },
    {
      name: "duplicate resolved path with relative and root-inclusive spellings",
      boundaries: [
        { path: "Root\\Properties\\Future", value: "one", suppressOrdinaryOutput: false },
        {
          path: "Root\\Root\\Properties\\Future",
          value: "two",
          suppressOrdinaryOutput: false,
        },
      ],
      expectedMessage: /повторн.*пут/,
    },
    {
      name: "invalid combined order",
      boundaries: [
        {
          path: "Properties\\#order",
          value: ["Name", "Missing"],
          suppressOrdinaryOutput: false,
        },
      ],
      expectedMessage: /#order/,
    },
    {
      name: "overlapping raw boundaries",
      boundaries: [
        { path: "Properties\\Future", value: {}, suppressOrdinaryOutput: false },
        {
          path: "Properties\\Future\\Nested",
          value: "value",
          suppressOrdinaryOutput: false,
        },
      ],
      expectedMessage: /перекрыв/,
    },
    {
      name: "overlap with relative and root-inclusive spellings",
      boundaries: [
        { path: "Root\\Properties\\Future", value: {}, suppressOrdinaryOutput: false },
        {
          path: "Root\\Root\\Properties\\Future\\Nested",
          value: "value",
          suppressOrdinaryOutput: false,
        },
      ],
      expectedMessage: /перекрыв/,
    },
  ])("rejects $name before applying any operation", ({ boundaries, expectedMessage }) => {
    const ordinary = roots("<Root><Properties><Name>Items</Name></Properties></Root>")
    const before = xmlExport(ordinary, false)

    expect(() => mergeXmlRawFragments(ordinary, boundaries)).toThrow(expectedMessage)
    expect(xmlExport(ordinary, false)).toBe(before)
  })

  it("rejects null for an unknown XML place", () => {
    expect(() =>
      mergeXmlRawFragments(roots("<Root><Properties/></Root>"), [
        {
          path: "Properties\\Future",
          value: null,
          suppressOrdinaryOutput: false,
        },
      ])
    ).toThrow(/null/)
  })
})
