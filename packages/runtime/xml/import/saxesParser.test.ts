import { expect, it } from "vitest"
import {
  parseXmlDocumentWithSaxes,
  parseXmlRootStructuresWithSaxes,
} from "./saxesParser"
import { xmlAttributeValue, xmlElementChildren, xmlTextValue } from "./document"

it("строит единственное XML-дерево без сохранённого объектного представления", () => {
  const document = parseXmlDocumentWithSaxes('<Root><ChildItems><A/><B/><A/></ChildItems><Value xsi:nil="true"/></Root>')
  expect(Object.hasOwn(document, "compatibility")).toBe(false)
  const pending = [...document.roots]
  for (const node of pending) {
    expect(Object.hasOwn(node, "compatibilityValue")).toBe(false)
    pending.push(...xmlElementChildren(node))
  }
  const root = document.roots[0]!
  expect(xmlElementChildren(xmlElementChildren(root, "ChildItems")[0]!).map(node => node.name)).toEqual(["A", "B", "A"])
  expect(xmlAttributeValue(xmlElementChildren(root, "Value")[0]!, "xsi:nil")).toBe("true")
})

it("сохраняет Unicode, CDATA и атрибуты после отделения строк от исходника", () => {
  const xml = '<Корень имя="Имя😀&amp;значение"><Текст>До😀<![CDATA[<&После]]></Текст><?режим имя="Значение😀"?></Корень>'
  const root = parseXmlDocumentWithSaxes(xml).roots[0]!
  expect(root.name).toBe("Корень")
  expect(xmlAttributeValue(root, "имя")).toBe("Имя😀&значение")
  expect(xmlTextValue(xmlElementChildren(root, "Текст")[0]!)).toBe("До😀<&После")
  const instruction = root.content.find(node => node.type === "processingInstruction")!
  expect(instruction).toMatchObject({ target: "режим", body: 'имя="Значение😀"', attributes: [{ name: "имя", value: "Значение😀" }] })
  expect(xml.slice(root.span.start, root.span.end)).toBe(xml)
})

it("вычисляет хэши XML-корней без полного адресного дерева", () => {
  const xml = [
    '<?xml version="1.0"?>',
    '<Root b="2" a="1">before<!-- split -->after<Child><?mode x="y"?></Child></Root>',
  ].join("")
  const document = parseXmlDocumentWithSaxes(xml)

  expect(parseXmlRootStructuresWithSaxes(xml)).toEqual({
    sourceLength: xml.length,
    roots: document.roots.map(({ path, name, structuralHash, span }) => ({
      path,
      name,
      structuralHash,
      span,
    })),
  })
})
