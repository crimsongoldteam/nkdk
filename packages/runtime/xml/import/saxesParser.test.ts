import { expect, it } from "vitest"
import {
  parseXmlDocumentWithSaxes,
  parseXmlRootStructuresWithSaxes,
} from "./saxesParser"

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
