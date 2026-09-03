import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { xmlExport } from "../../../xml/export/exporter"
import { mergeXmlRawFragments } from "../../../xml/structure/merge"
import { createXmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { createLocalXmlProof } from "./localProof"
import { completeLocalXmlContainerBoundary } from "./localContainerBoundary"

describe("локальная XML-граница контейнера", () => {
  it("оформляет собственные атрибуты и порядок, не переписывая проверенного ребёнка", () => {
    const root = parseXmlDocumentWithSaxes('<Root a="1" b="2"><Child>value</Child></Root>').roots[0]!
    const child = root.content[0]!
    if (child.type !== "element") throw new Error("Child")
    let comparisons = 0
    const proof = createLocalXmlProof({ onValue: () => comparisons++ })
    const receipt = proof.check(child, { name: "Child", content: [{ type: "text", value: "value" }] })
    const childYAML = Object.freeze({ Значение: "value" })
    const yaml: Record<string, unknown> = { Ребёнок: childYAML }
    const annotations = createXmlAnomalyAnnotations()
    completeLocalXmlContainerBoundary({
      source: root, actual: { name: "Root", attributes: [{ name: "b", value: "wrong" }], content: [receipt] },
      proof, yaml, annotations, path: ["Root"],
    })
    expect(comparisons).toBe(2)
    expect(yaml.Ребёнок).toBe(childYAML)
    const own = annotations.at(yaml, "Root")!
    const order = annotations.at(yaml, "Root\\#attributes")!
    expect(own.xml).toEqual({ _a: "1", _b: "2" })
    expect(order.xml).toEqual({ "#order": ["_a", "_b"] })
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes('<Document><Root b="wrong"><Child>value</Child></Root></Document>').roots, [
      // Как в assignment exporter: raw-путь дополняет существующую compiled-оболочку.
      { path: "Root", value: own.xml, suppressOrdinaryOutput: false, hasSemanticValue: true },
      { path: "Root\\#attributes", value: order.xml, suppressOrdinaryOutput: false },
    ])
    expect(xmlExport(restored, false)).toBe('<Document>\n\t<Root a="1" b="2">\n\t\t<Child>value</Child>\n\t</Root>\n</Document>')
    expect(() => proof.check(root, { name: "Root" })).toThrow(/Повтор/)
  })

  it("передаёт неизвестного ребёнка по прямой привязке, без raw всего контейнера", () => {
    const root = parseXmlDocumentWithSaxes('<Root><Unknown/><Known>x</Known></Root>').roots[0]!
    const unknown = root.content[0]!
    const known = root.content[1]!
    if (unknown.type !== "element" || known.type !== "element") throw new Error("children")
    const proof = createLocalXmlProof()
    const receipt = proof.check(known, { name: "Known", content: [{ type: "text", value: "x" }] })
    const yaml = {}
    const annotations = createXmlAnomalyAnnotations()
    const handled: unknown[] = []
    completeLocalXmlContainerBoundary({
      source: root, actual: { name: "Root", content: [receipt] }, proof, yaml, annotations,
      childPresence({ source, name, occurrence }) {
        handled.push({ source, name, occurrence })
        if (source === undefined) throw new Error("Expected unknown")
        proof.checkAbsent(source, () => {})
      },
    })
    expect(handled).toEqual([{ source: unknown, name: "Unknown", occurrence: 1 }])
    expect(annotations.at(yaml, "#order")?.xml).toEqual(["Unknown", "Known"])
    expect(annotations.at(yaml, "@")).toBeUndefined()
  })
})
