import { describe, expect, it } from "vitest"
import type { XmlElementNode } from "./document"
import { parseXmlDocumentWithSaxes } from "./saxesParser"

const elementChildren = (element: XmlElementNode): XmlElementNode[] =>
  element.content.filter((node): node is XmlElementNode => node.type === "element")

describe("структурный XML-документ", () => {
  it("сохраняет идентичность повторов, порядок, пути и координаты", () => {
    const xml = '<Root b="2" a="1"><Value/><Value>2</Value><Future x="y"/></Root>'

    const document = parseXmlDocumentWithSaxes(xml)
    const root = document.roots[0]

    expect(document.sourceLength).toBe(xml.length)
    expect(document.compatibility).toEqual({
      Root: {
        Value: [undefined, "2"],
        Future: { _x: "y" },
        _b: "2",
        _a: "1",
      },
    })
    expect(root).toBeDefined()
    if (root === undefined) return

    const children = elementChildren(root)
    expect(root.attributes).toEqual([
      { name: "b", value: "2" },
      { name: "a", value: "1" },
    ])
    expect([root, ...children].map(({ id }) => id)).toEqual([1, 2, 3, 4])
    expect([root, ...children].map(({ occurrence }) => occurrence)).toEqual([1, 1, 2, 1])
    expect([root, ...children].map(({ path }) => path)).toEqual([
      "/Root[1]",
      "/Root[1]/Value[1]",
      "/Root[1]/Value[2]",
      "/Root[1]/Future[1]",
    ])
    expect(children.map(({ name }) => name)).toEqual(["Value", "Value", "Future"])
    expect(children[0]?.content).toEqual([])
    expect(children[0]?.compatibilityValue).toBeUndefined()
    expect(children[1]?.content).toEqual([{ type: "text", value: "2" }])
    expect(children[1]?.compatibilityValue).toBe("2")
    expect(children[2]?.attributes).toEqual([{ name: "x", value: "y" }])
    expect(xml.slice(root.span.start, root.span.end)).toBe(xml)
    expect(xml.slice(children[0]?.span.start, children[0]?.span.end)).toBe("<Value/>")
    expect(xml.slice(children[1]?.span.start, children[1]?.span.end)).toBe(
      "<Value>2</Value>"
    )
  })

  it("нормализует CDATA в текст и не теряет xsi:nil, canonical и alias", () => {
    const document = parseXmlDocumentWithSaxes(
      '<Root><Value xsi:nil="true"/><Value>A<![CDATA[B]]>C</Value><Canonical/><Alias/></Root>'
    )
    const root = document.roots[0]
    expect(root).toBeDefined()
    if (root === undefined) return

    const [nilValue, textValue, canonical, alias] = elementChildren(root)
    expect(nilValue?.attributes).toEqual([{ name: "xsi:nil", value: "true" }])
    expect(nilValue?.compatibilityValue).toBeUndefined()
    expect(textValue?.content).toEqual([{ type: "text", value: "ABC" }])
    expect(canonical).toMatchObject({ name: "Canonical", path: "/Root[1]/Canonical[1]" })
    expect(alias).toMatchObject({ name: "Alias", path: "/Root[1]/Alias[1]" })
  })

  it("нумерует одноимённые корни независимо", () => {
    const document = parseXmlDocumentWithSaxes('<Command id="1"/><Command id="2"/>')

    expect(document.roots.map(({ path }) => path)).toEqual(["/Command[1]", "/Command[2]"])
    expect(document.roots.map(({ occurrence }) => occurrence)).toEqual([1, 2])
  })

  it("задаёт span по индексам исходной строки при CRLF после имени", () => {
    const xml = '<Root\r\n id="1"/>'
    const root = parseXmlDocumentWithSaxes(xml).roots[0]

    expect(root?.span).toEqual({ start: 0, end: xml.length })
    expect(xml.slice(root?.span.start, root?.span.end)).toBe(xml)
  })
})
