import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { xmlExport } from "../../../xml/export/exporter"
import { mergeXmlRawFragments } from "../../../xml/structure/merge"
import { createXmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { serializeYAMLDocument } from "../../../yaml/export"
import { createLocalXmlProof, type LocalXmlShape } from "./localProof"
import { completeLocalXmlScalarBoundary } from "./localScalarBoundary"
import { localXmlShapeFromObject } from "./localShape"

describe("завершение локальной скалярной XML-границы", () => {
  it.each([
    {
      source: '<Value a="1" b="2">right</Value>',
      ordinary: '<Value b="2" a="wrong">wrong</Value>',
      value: { _b: "2", _a: "wrong", "#text": "wrong" },
      order: ["_a", "_b"],
    },
    {
      source: '<Value a="1" b="2"/>', ordinary: '<Value b="2"/>', value: { _b: "2" },
      order: ["_a", "_b"],
    },
    {
      source: '<Value b="2" a="1"/>', ordinary: '<Value b="2"/>', value: { _b: "2" },
      order: undefined,
    },
    {
      source: '<Value a="1" b="2"/>', ordinary: '<Value b="2" a="1"/>', value: { _b: "2", _a: "1" },
      order: ["_a", "_b"],
    },
  ])("восстанавливает порядок после поправки собственных значений: $source", ({ source, ordinary, value, order }) => {
    const node = parseXmlDocumentWithSaxes(source).roots[0]!
    const yaml = { Поле: "semantic" }
    const annotations = createXmlAnomalyAnnotations()
    completeLocalXmlScalarBoundary({
      source: node, actual: localXmlShapeFromObject("Value", value),
      proof: createLocalXmlProof(), annotations,
      binding: { parent: yaml, key: "Поле", hasSemanticValue: true },
      orderTarget: { yaml, path: ["Value"] },
    })
    const orderAnnotation = annotations.at(yaml, "Value\\#attributes")
    expect(orderAnnotation?.xml).toEqual(order === undefined ? undefined : { "#order": order })
    const patch = annotations.at(yaml, "Поле")
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes(`<Root>${ordinary}</Root>`).roots, [
      ...(patch === undefined ? [] : [{ path: "Value", value: patch.xml, suppressOrdinaryOutput: false, hasSemanticValue: true }]),
      ...(orderAnnotation === undefined ? [] : [{
        path: "Value\\#attributes", value: orderAnnotation.xml, suppressOrdinaryOutput: false,
      }]),
    ])
    expect(xmlExport(restored, false)).toBe(`<Root>\n\t${source}\n</Root>`)
  })

  it("сохраняет весь скаляр при отсутствии смыслового YAML, а не только изменённую часть", () => {
    const node = parseXmlDocumentWithSaxes('<Value a="1" b="2">original</Value>').roots[0]!
    const yaml = {}
    const annotations = createXmlAnomalyAnnotations()
    completeLocalXmlScalarBoundary({
      source: node, actual: localXmlShapeFromObject("Value", { _b: "2", _a: "wrong", "#text": "original" }),
      proof: createLocalXmlProof(), annotations,
      binding: { parent: yaml, key: "Поле", hasSemanticValue: false },
    })
    const annotation = annotations.at(yaml, "Поле")!
    expect(annotation.xml).toEqual({ _a: "1", _b: "2", "#text": "original" })
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes('<Root><Value b="2" a="wrong">original</Value></Root>').roots, [{
      path: "Value", value: annotation.xml, suppressOrdinaryOutput: true,
    }])
    expect(xmlExport(restored, false)).toBe('<Root>\n\t<Value a="1" b="2">original</Value>\n</Root>')
  })

  it.each<{ source: string; ordinary: string; actual?: LocalXmlShape; expectedPatch: unknown }>([
    { source: "", ordinary: "<Value>default</Value>", actual: { name: "Value", content: [{ type: "text", value: "default" }] }, expectedPatch: null },
    { source: "<Value/>", ordinary: "", expectedPatch: {} },
    { source: "<Value>original</Value>", ordinary: "", expectedPatch: "original" },
    { source: "<Value>original</Value>", ordinary: "<Value>changed</Value>", actual: { name: "Value", content: [{ type: "text", value: "changed" }] }, expectedPatch: { "#text": "original" } },
  ])("сохраняет присутствие и значение: $source / $ordinary", ({ source, ordinary, actual, expectedPatch }) => {
    const root = parseXmlDocumentWithSaxes(`<Root>${source}</Root>`).roots[0]!
    const node = root.content[0]
    if (node !== undefined && node.type !== "element") throw new Error("Value")
    const yaml = { Поле: "semantic" }
    const annotations = createXmlAnomalyAnnotations()
    const proof = createLocalXmlProof()
    const receipt = completeLocalXmlScalarBoundary({
      source: node, actual, proof, annotations,
      binding: { parent: yaml, key: "Поле", hasSemanticValue: true },
    })
    const annotation = annotations.at(yaml, "Поле")
    expect(annotation).toMatchObject({ kind: "raw", xml: expectedPatch, hasSemanticValue: true })
    expect(yaml).toEqual({ Поле: "semantic" })
    expect(proof.compare(root, { name: "Root", content: receipt === undefined ? [] : [receipt] })).toEqual([])
    proof.finish(root)
    const restored = mergeXmlRawFragments(parseXmlDocumentWithSaxes(`<Root>${ordinary}</Root>`).roots, [{
      path: "Value", value: annotation!.xml, suppressOrdinaryOutput: false, hasSemanticValue: true,
    }])
    expect(xmlExport(restored, false)).toBe(source === "" ? "<Root/>" : `<Root>\n\t${source}\n</Root>`)
  })

  it.each([
    { source: "", actual: undefined },
    { source: "<Value/>", actual: { name: "Value" } },
    { source: "<Value>x</Value>", actual: { name: "Value", content: [{ type: "text" as const, value: "x" }] } },
  ])("не аннотирует совпавшее присутствие и значение: $source", ({ source, actual }) => {
    const root = parseXmlDocumentWithSaxes(`<Root>${source}</Root>`).roots[0]!
    const node = root.content[0]
    if (node !== undefined && node.type !== "element") throw new Error("Value")
    const yaml = {}
    const annotations = createXmlAnomalyAnnotations()
    const receipt = completeLocalXmlScalarBoundary({
      source: node, actual, proof: createLocalXmlProof(), annotations,
      binding: { parent: yaml, key: "Поле", hasSemanticValue: false },
    })
    expect(receipt?.name).toBe(node === undefined ? undefined : "Value")
    expect([...annotations.entries()]).toEqual([])
  })

  it("не превращает контейнер с самостоятельным ребёнком в скалярный raw", () => {
    const node = parseXmlDocumentWithSaxes("<Value><Child>x</Child></Value>").roots[0]!
    const yaml = { Поле: {} }
    const annotations = createXmlAnomalyAnnotations()
    expect(() => completeLocalXmlScalarBoundary({
      source: node, proof: createLocalXmlProof(), annotations,
      binding: { parent: yaml, key: "Поле", hasSemanticValue: true },
    })).toThrow(/скаляр/)
    expect([...annotations.entries()]).toEqual([])
  })

  it("включает поправку лишнего default в итоговый YAML даже без смыслового поля", () => {
    const yaml = {}
    const annotations = createXmlAnomalyAnnotations()
    completeLocalXmlScalarBoundary({
      actual: { name: "Value", content: [{ type: "text", value: "default" }] },
      proof: createLocalXmlProof(), annotations,
      binding: { parent: yaml, key: "Поле", hasSemanticValue: false },
    })
    expect(serializeYAMLDocument(yaml, annotations).text).toBe("Поле: !xml/raw\n  $xml: null")
  })
})
