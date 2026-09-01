import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import { XML_ORDERED_CHILDREN, xmlExport } from "./exporter"
import { xmlObjectDocument } from "./document"

describe("xmlObjectDocument", () => {
  it.each([
    ["атрибуты, текст и пустой элемент", { Root: { _id: "1", Text: "value", Empty: "" } }],
    ["повторные дети", { Root: { Item: [{ "#text": "one" }, { "#text": "two" }] } }],
    ["несколько корней", { Root: [{ _id: "1" }, { _id: "2" }], Tail: "done" }],
    ["xsi:nil", { Root: { "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance", "_xsi:nil": "true" } }],
    ["пустой #text", { Root: { "_xsi:type": "dcscor:Field", "#text": "" } }],
    ["processing instruction", { Root: { "?future": 'mode="x" alpha' } }],
    ["смешанный текст", { Root: { "#text": "prefix", Child: "value" } }],
  ])("строит то же адресное дерево без строки: %s", (_name, value) => {
    expect(normalize(xmlObjectDocument(value).document.roots)).toEqual(
      normalize(parseXmlDocumentWithSaxes(xmlExport(value, false), {
        preserveXsiNil: true,
        preserveEmptyElements: true,
      }).roots),
    )
  })

  it("сохраняет XML_ORDERED_CHILDREN", () => {
    const value = orderedDocument(
      ["Panel", { _id: "first" }],
      ["Group", { _id: "middle" }],
      ["Panel", { _id: "last" }],
    )

    expect(normalize(xmlObjectDocument(value).document.roots)).toEqual(
      normalize(parseXmlDocumentWithSaxes(xmlExport(value, false)).roots),
    )
  })
})

function orderedDocument(...children: readonly (readonly [string, unknown])[]): Record<string, unknown> {
  return {
    Root: {
      [XML_ORDERED_CHILDREN]: children.map(([key, value]) => ({ key, value })),
    },
  }
}

function normalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map((child) => normalize(child))
  const result: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    if (key === "id" || key === "span" || key === "compatibilityValue") continue
    result[key] = normalize(child)
  }
  return result
}
