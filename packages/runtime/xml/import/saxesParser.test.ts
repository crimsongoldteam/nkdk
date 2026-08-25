import { expect, it } from "vitest"
import {
  parseXmlCompatibilityWithRootStructures,
  parseXmlDocumentWithSaxes,
  parseXmlRootStructuresWithSaxes,
  parseXmlWithSaxes,
} from "./saxesParser"

it("оставляет прежнее объектное представление доступным без структурных полей", () => {
  const xml = '<Root b="2" a="1"><Value/><Value>2</Value><Future x="y"/></Root>'
  const document = parseXmlDocumentWithSaxes(xml)
  const compatibility = parseXmlWithSaxes(xml)

  expect(compatibility).toEqual(document.compatibility)
  expect(compatibility).toEqual({
    Root: {
      Value: [undefined, "2"],
      Future: { _x: "y" },
      _b: "2",
      _a: "1",
    },
  })
  expect(compatibility).not.toHaveProperty("roots")
  expect(compatibility).not.toHaveProperty("sourceLength")
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

it("возвращает объектное представление и корневые хэши одним разбором", () => {
  const xml = '<Root b="2"><Value>text</Value></Root>'
  const document = parseXmlDocumentWithSaxes(xml)

  expect(parseXmlCompatibilityWithRootStructures(xml)).toEqual({
    compatibility: document.compatibility,
    sourceLength: xml.length,
    roots: document.roots.map(({ path, name, structuralHash, span }) => ({
      path,
      name,
      structuralHash,
      span,
    })),
  })
})
