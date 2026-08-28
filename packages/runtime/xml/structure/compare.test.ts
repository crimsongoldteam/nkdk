import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import type { XmlElementNode } from "../import/document"
import {
  compareXmlStructureDifferences,
  compareXmlStructures,
  createXmlElementPatch,
} from "./compare"

const roots = (xml: string): readonly XmlElementNode[] =>
  parseXmlDocumentWithSaxes(xml, { preserveXsiNil: true }).roots

describe("compareXmlStructures", () => {
  it("describes the changed attribute of the exact repeated element", () => {
    const expected = roots('<Root><Item name="first"/><Item name="expected"/></Root>')
    const actual = roots('<Root><Item name="first"/><Item name="actual"/></Root>')

    expect(compareXmlStructureDifferences(expected, actual)).toEqual([
      {
        kind: "value",
        path: "/Root[1]/Item[2]/@name[1]",
        ownerPath: "/Root[1]/Item[2]",
      },
    ])
  })

  it("describes text and presence differences with their immediate owners", () => {
    const expected = roots("<Root><Value>expected</Value></Root>")
    const actual = roots("<Root><Value>actual</Value><Extra/></Root>")

    expect(compareXmlStructureDifferences(expected, actual)).toEqual([
      {
        kind: "value",
        path: "/Root[1]/Value[1]/#text[1]",
        ownerPath: "/Root[1]/Value[1]",
      },
      {
        kind: "presence",
        path: "/Root[1]/Extra[1]",
        ownerPath: "/Root[1]",
      },
    ])
  })

  it("describes an order difference as the collection terminal", () => {
    const expected = roots("<Root><First/><Second/></Root>")
    const actual = roots("<Root><Second/><First/></Root>")

    expect(compareXmlStructureDifferences(expected, actual)).toEqual([
      {
        kind: "order",
        path: "/Root[1]/#order",
        ownerPath: "/Root[1]",
      },
    ])
  })

  it("описывает перестановку именованных повторяющихся элементов одним #order", () => {
    const expected = roots(
      '<Root><Button name="Вторая"/><Button name="Первая"/></Root>',
    )
    const actual = roots(
      '<Root><Button name="Первая"/><Button name="Вторая"/></Root>',
    )

    expect(compareXmlStructureDifferences(expected, actual)).toEqual([{
      kind: "order",
      path: "/Root[1]/#order",
      ownerPath: "/Root[1]",
    }])
  })

  it("builds a minimal recursive patch from ordinary export to source XML", () => {
    const source = roots(
      '<Value mode="new"><Known>kept</Known><Changed>new</Changed><Added>added</Added></Value>',
    )[0]!
    const ordinary = roots(
      '<Value mode="old"><Known>kept</Known><Changed>old</Changed><Removed>gone</Removed></Value>',
    )[0]!

    expect(createXmlElementPatch(source, ordinary)).toEqual({
      _mode: "new",
      Changed: "new",
      Added: "added",
      Removed: null,
      "#order": ["Known", "Changed", "Added"],
    })
  })

  it("records an order change inside a nested element", () => {
    const source = roots(
      "<Root><Table><Before/><RowFilter/><ChildItems/></Table></Root>",
    )[0]!
    const ordinary = roots(
      "<Root><Table><Before/><ChildItems/><RowFilter/></Table></Root>",
    )[0]!

    expect(createXmlElementPatch(source, ordinary)).toEqual({
      Table: {
        "#order": ["Before", "RowFilter", "ChildItems"],
      },
    })
  })

  it("сохраняет перестановку повторяющихся элементов только через краткий #order", () => {
    const source = roots(
      '<Root><Button name="Вторая"/><Button name="Первая"/></Root>',
    )[0]!
    const ordinary = roots(
      '<Root><Button name="Первая"/><Button name="Вторая"/></Root>',
    )[0]!

    expect(createXmlElementPatch(source, ordinary)).toEqual({
      "#order": ["Button:Вторая", "Button:Первая"],
    })
  })

  it("confirms equal structural hashes with a deep comparison", () => {
    const original = roots("<Root><Value>one</Value></Root>")[0]!
    const originalValue = original.content.find(
      (node): node is XmlElementNode => node.type === "element"
    )!
    const originalText = originalValue.content.find((node) => node.type === "text")!
    const sameHashWithDifferentContent: XmlElementNode = {
      ...original,
      content: [
        {
          ...originalValue,
          content: [{ ...originalText, value: "two" }],
        },
      ],
    }

    expect(compareXmlStructures([original], [sameHashWithDifferentContent])).toEqual([
      "/Root[1]/Value[1]/#text[1]",
    ])
  })

  it("returns only the deepest independently mismatching paths", () => {
    const expected = roots(
      '<Root mode="old"><Group><Value>one</Value></Group><Stable>same</Stable></Root>'
    )
    const actual = roots(
      '<Root mode="new"><Group><Value>two</Value></Group><Stable>same</Stable><Extra/></Root>'
    )

    expect(compareXmlStructures(expected, actual)).toEqual([
      "/Root[1]/@mode[1]",
      "/Root[1]/Group[1]/Value[1]/#text[1]",
      "/Root[1]/Extra[1]",
    ])
  })

  it.each([
    [
      '<Root first="1" second="2"/>',
      '<Root second="2" first="1"/>',
      "/Root[1]/#attributes/#order",
    ],
    ["<Root><A/><B/></Root>", "<Root><B/><A/></Root>", "/Root[1]/#order"],
  ])("reports an explicit order boundary for %s", (expected, actual, path) => {
    expect(compareXmlStructures(roots(expected), roots(actual))).toEqual([path])
  })
})
