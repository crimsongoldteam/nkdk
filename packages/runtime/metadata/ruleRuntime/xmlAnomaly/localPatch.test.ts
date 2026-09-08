import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { xmlExport } from "../../../xml/export/exporter"
import { mergeXmlRawFragments } from "../../../xml/structure/merge"
import type { XmlRawValue } from "../../../xml/structure/rawCodec"
import { createLocalXmlProof, type LocalXmlShape } from "./localProof"
import { createLocalXmlScalarPatch } from "./localPatch"

describe("локальная XML-поправка собственных значений", () => {
  it.each<{ source: string; ordinary: string; actual: LocalXmlShape; patch: XmlRawValue; expected: string }>([
    {
      source: "<Value>x</Value>", ordinary: "<Value>y</Value>",
      actual: { name: "Value", content: [{ type: "text", value: "y" }] },
      patch: { "#text": "x" }, expected: "<Document>\n\t<Value>x</Value>\n</Document>",
    },
    {
      source: "<Value/>", ordinary: "<Value>extra</Value>",
      actual: { name: "Value", content: [{ type: "text", value: "extra" }] },
      patch: { "#text": null }, expected: "<Document>\n\t<Value/>\n</Document>",
    },
    {
      source: '<Value mode="x">original</Value>', ordinary: '<Value mode="y" extra="1">changed</Value>',
      actual: { name: "Value", attributes: [{ name: "mode", value: "y" }, { name: "extra", value: "1" }], content: [{ type: "text", value: "changed" }] },
      patch: { _mode: "x", _extra: null, "#text": "original" },
      expected: '<Document>\n\t<Value mode="x">original</Value>\n</Document>',
    },
    {
      source: '<Value mode="x"/>', ordinary: "<Value/>", actual: { name: "Value" },
      patch: { _mode: "x" }, expected: '<Document>\n\t<Value mode="x"/>\n</Document>',
    },
  ])("оформляет $source из готового списка расхождений", ({ source, ordinary, actual, patch, expected }) => {
    const root = parseXmlDocumentWithSaxes(source).roots[0]!
    const proof = createLocalXmlProof()
    let correction: XmlRawValue | undefined
    proof.check(root, actual, (differences) => { correction = createLocalXmlScalarPatch(root, differences) })
    expect(correction).toEqual(patch)
    // Отдельная проверка обычного экспорта: в локальном proof второго сравнения нет.
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes(`<Document>${ordinary}</Document>`).roots, [{
      path: "Value", value: correction, suppressOrdinaryOutput: false, hasSemanticValue: true,
    }])
    expect(xmlExport(restored, false)).toBe(expected)
  })

  it("не включает проверенный дочерний элемент в поправку собственных скаляров", () => {
    const root = parseXmlDocumentWithSaxes('<Root mode="x"><Known>unchanged</Known></Root>').roots[0]!
    const child = root.content[0]!
    if (child.type !== "element") throw new Error("Expected Known")
    const proof = createLocalXmlProof()
    const receipt = proof.check(child, { name: "Known", content: [{ type: "text", value: "unchanged" }] })
    const differences = proof.compare(root, { name: "Root", attributes: [{ name: "mode", value: "y" }], content: [receipt] })
    expect(createLocalXmlScalarPatch(root, differences)).toEqual({ _mode: "x" })
    expect(() => createLocalXmlScalarPatch(root, [{ kind: "presence", path: child.path, ownerPath: root.path }])).toThrow(/собственн.*скаляр/)
  })
})
