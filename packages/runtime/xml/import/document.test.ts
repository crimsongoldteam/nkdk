import { describe, expect, it } from "vitest"
import type { XmlAddressedNode, XmlElementNode } from "./document"
import { parseXmlDocumentWithSaxes } from "./saxesParser"

const elementChildren = (element: XmlElementNode): XmlElementNode[] =>
  element.content.filter((node): node is XmlElementNode => node.type === "element")

const sourceOf = (source: string, node: XmlAddressedNode | undefined): string | undefined =>
  node === undefined ? undefined : source.slice(node.span.start, node.span.end)

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
      {
        id: 2,
        name: "b",
        occurrence: 1,
        path: "/Root[1]/@b[1]",
        value: "2",
        span: { start: 6, end: 11 },
      },
      {
        id: 3,
        name: "a",
        occurrence: 1,
        path: "/Root[1]/@a[1]",
        value: "1",
        span: { start: 12, end: 17 },
      },
    ])
    expect([root, ...children].map(({ id }) => id)).toEqual([1, 4, 5, 7])
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
    expect(children[1]?.content).toEqual([
      {
        type: "text",
        id: 6,
        occurrence: 1,
        path: "/Root[1]/Value[2]/#text[1]",
        value: "2",
        span: { start: 33, end: 34 },
      },
    ])
    expect(children[1]?.compatibilityValue).toBe("2")
    expect(children[2]?.attributes).toEqual([
      {
        id: 8,
        name: "x",
        occurrence: 1,
        path: "/Root[1]/Future[1]/@x[1]",
        value: "y",
        span: { start: 50, end: 55 },
      },
    ])
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
    expect(nilValue?.attributes).toMatchObject([{ name: "xsi:nil", value: "true" }])
    expect(nilValue?.compatibilityValue).toBeUndefined()
    expect(textValue?.content).toMatchObject([{ type: "text", value: "ABC" }])
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

  it("адресует атрибуты, mixed text и PI точными координатами", () => {
    const xml =
      '<Корень\r\n атр = "Б&amp;В">\r\nДо<Child/>После<![CDATA[!]]><?p key = "значение" alpha?>Конец</Корень>'
    const root = parseXmlDocumentWithSaxes(xml).roots[0]

    expect(root?.attributes[0]).toMatchObject({
      id: 2,
      name: "атр",
      occurrence: 1,
      path: "/Корень[1]/@атр[1]",
      value: "Б&В",
      span: { start: 10, end: 25 },
    })
    expect(root?.content[0]).toMatchObject({
      type: "text",
      id: 3,
      occurrence: 1,
      path: "/Корень[1]/#text[1]",
      value: "\nДо",
      span: { start: 26, end: 30 },
    })
    expect(root?.content[1]).toMatchObject({
      type: "element",
      id: 4,
      path: "/Корень[1]/Child[1]",
      span: { start: 30, end: 38 },
    })
    expect(root?.content[2]).toMatchObject({
      type: "text",
      id: 5,
      occurrence: 2,
      path: "/Корень[1]/#text[2]",
      value: "После!",
      span: { start: 38, end: 56 },
    })
    expect(root?.content[3]).toMatchObject({
      type: "processingInstruction",
      id: 6,
      target: "p",
      occurrence: 1,
      path: "/Корень[1]/?p[1]",
      body: 'key = "значение" alpha',
      span: { start: 56, end: 84 },
      attributes: [
        {
          id: 7,
          name: "key",
          occurrence: 1,
          path: "/Корень[1]/?p[1]/@key[1]",
          value: "значение",
          span: { start: 60, end: 76 },
        },
      ],
    })
    expect(root?.content[4]).toMatchObject({
      type: "text",
      id: 8,
      occurrence: 3,
      path: "/Корень[1]/#text[3]",
      value: "Конец",
      span: { start: 84, end: 89 },
    })
    expect(sourceOf(xml, root?.attributes[0])).toBe('атр = "Б&amp;В"')
    expect(sourceOf(xml, root?.content[0])).toBe("\r\nДо")
    expect(sourceOf(xml, root?.content[1])).toBe("<Child/>")
    expect(sourceOf(xml, root?.content[2])).toBe("После<![CDATA[!]]>")
    expect(sourceOf(xml, root?.content[3])).toBe('<?p key = "значение" alpha?>')
    const pi = root?.content[3]
    expect(sourceOf(xml, pi?.type === "processingInstruction" ? pi.attributes[0] : undefined)).toBe(
      'key = "значение"'
    )
    expect(sourceOf(xml, root?.content[4])).toBe("Конец")
  })

  it("сохраняет PI до, между и после корней в документном порядке", () => {
    const xml = "<?p before?>\r\n<R/><?p between?>текст<S/><?p after?>"
    const document = parseXmlDocumentWithSaxes(xml)

    expect(document.content).toMatchObject([
      {
        type: "processingInstruction",
        id: 1,
        target: "p",
        occurrence: 1,
        path: "/?p[1]",
        body: "before",
        span: { start: 0, end: 12 },
      },
      {
        type: "text",
        id: 2,
        occurrence: 1,
        path: "/#text[1]",
        value: "\n",
        span: { start: 12, end: 14 },
      },
      { type: "element", id: 3, path: "/R[1]", span: { start: 14, end: 18 } },
      {
        type: "processingInstruction",
        id: 4,
        target: "p",
        occurrence: 2,
        path: "/?p[2]",
        body: "between",
        span: { start: 18, end: 31 },
      },
      {
        type: "text",
        id: 5,
        occurrence: 2,
        path: "/#text[2]",
        value: "текст",
        span: { start: 31, end: 36 },
      },
      { type: "element", id: 6, path: "/S[1]", span: { start: 36, end: 40 } },
      {
        type: "processingInstruction",
        id: 7,
        target: "p",
        occurrence: 3,
        path: "/?p[3]",
        body: "after",
        span: { start: 40, end: 51 },
      },
    ])
    expect(document.roots.map(({ id }) => id)).toEqual([3, 6])
    expect(document.compatibility).toEqual({
      "?p": [{}, {}, {}],
      R: undefined,
      S: undefined,
    })
    expect(
      (document.compatibility as Record<PropertyKey, unknown>)[Symbol.for("metadata")]
    ).toEqual({
      childOrder: [
        { key: "?p", index: 0 },
        { key: "R", index: 0 },
        { key: "?p", index: 1 },
        { key: "S", index: 0 },
        { key: "?p", index: 2 },
      ],
    })
  })

  it("не принимает внутренний <? за начало PI", () => {
    const xml = "<Root><?p alpha <? beta?></Root>"
    const instruction = parseXmlDocumentWithSaxes(xml).roots[0]?.content[0]

    expect(instruction).toMatchObject({
      type: "processingInstruction",
      body: "alpha <? beta",
    })
    expect(sourceOf(xml, instruction)).toBe("<?p alpha <? beta?>")
  })

  it("не принимает внутренний <![CDATA[ за начало CDATA", () => {
    const xml = "<Root><![CDATA[alpha <![CDATA[ beta]]></Root>"
    const text = parseXmlDocumentWithSaxes(xml).roots[0]?.content[0]

    expect(text).toMatchObject({
      type: "text",
      value: "alpha <![CDATA[ beta",
    })
    expect(sourceOf(xml, text)).toBe("<![CDATA[alpha <![CDATA[ beta]]>")
  })

  it("не включает DOCTYPE в span документного текста", () => {
    const xml = '<?xml version="1.0"?>\r\n<!DOCTYPE Root>\r\n<Root/>'
    const document = parseXmlDocumentWithSaxes(xml)
    const textNodes = document.content.filter((node) => node.type === "text")

    expect(textNodes).toEqual([
      {
        type: "text",
        id: 1,
        occurrence: 1,
        path: "/#text[1]",
        value: "\n",
        span: { start: 21, end: 23 },
      },
      {
        type: "text",
        id: 2,
        occurrence: 2,
        path: "/#text[2]",
        value: "\n",
        span: { start: 38, end: 40 },
      },
    ])
    expect(textNodes.map((node) => sourceOf(xml, node))).toEqual(["\r\n", "\r\n"])
    expect(document.roots[0]).toMatchObject({
      id: 3,
      path: "/Root[1]",
      span: { start: 40, end: xml.length },
    })
    expect(document.compatibility).toEqual({
      "?xml": { _version: "1.0" },
      Root: undefined,
    })
  })

  it("начинает self-closing root после завершающего > комментария", () => {
    const xml = "<!--before--><Root/>"
    const root = parseXmlDocumentWithSaxes(xml).roots[0]

    expect(sourceOf(xml, root)).toBe("<Root/>")
  })

  it("не сливает текст через comment и не включает его > в следующий span", () => {
    const xml = "<Root>A<!--between-->B</Root>"
    const content = parseXmlDocumentWithSaxes(xml).roots[0]?.content ?? []

    expect(content).toMatchObject([
      { type: "text", value: "A" },
      { type: "text", value: "B" },
    ])
    expect(content.map((node) => sourceOf(xml, node))).toEqual(["A", "B"])
  })

  it("начинает CDATA, PI и вложенный элемент после полного comment", () => {
    const xml =
      "<Root><!--cdata--><![CDATA[x]]><!--pi--><?p y?><!--child--><Child/></Root>"
    const content = parseXmlDocumentWithSaxes(xml).roots[0]?.content ?? []

    expect(content.map(({ type }) => type)).toEqual([
      "text",
      "processingInstruction",
      "element",
    ])
    expect(content.map((node) => sourceOf(xml, node))).toEqual([
      "<![CDATA[x]]>",
      "<?p y?>",
      "<Child/>",
    ])
  })
})
