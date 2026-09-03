import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { createLocalXmlProof } from "./localProof"
import { createXmlAnomalyAnnotations, snapshotXmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { serializeYAMLDocument } from "../../../yaml/export"

describe("local XML proof", () => {
  it("проверяет содержимое дочернего узла один раз и сохраняет исходное дерево", () => {
    const document = parseXmlDocumentWithSaxes('<Root flag="yes"><Item><Value>x</Value></Item></Root>')
    const original = structuredClone(document)
    const root = document.roots[0]!
    const item = root.content[0]!
    if (item.type !== "element") throw new Error("Item")
    const value = item.content[0]!
    if (value.type !== "element") throw new Error("Value")
    const compared: string[] = []
    const proof = createLocalXmlProof({ onValue: (node) => compared.push(node.path) })
    expect(proof.compare(value, { name: "Value", content: [{ type: "text", value: "x" }] })).toEqual([])
    const valueReceipt = proof.finish(value)
    expect(proof.compare(item, { name: "Item", content: [valueReceipt] })).toEqual([])
    const itemReceipt = proof.finish(item)
    expect(proof.compare(root, { name: "Root", attributes: [{ name: "flag", value: "yes" }], content: [itemReceipt] })).toEqual([])
    proof.finish(root)
    expect(compared).toEqual([value.content[0]!.path, root.attributes[0]!.path])
    expect(() => proof.compare(value, { name: "Value" })).toThrow(/повтор/i)
    expect(document).toEqual(original)
  })

  it("не считает распознавание проверкой и не теряет лишний узел или порядок", () => {
    const source = parseXmlDocumentWithSaxes('<Root><A/><C/></Root>').roots[0]!
    const a = source.content[0]!
    const c = source.content[1]!
    if (a.type !== "element" || c.type !== "element") throw new Error("children")
    const proof = createLocalXmlProof()
    expect(() => proof.finish(a)).toThrow(/провер/)
    proof.compare(a, { name: "A" })
    proof.compare(c, { name: "C" })
    const actual = [proof.finish(c), { type: "element" as const, name: "B", occurrence: 1 }, proof.finish(a)]
    expect(proof.compare(source, { name: "Root", content: actual })).toEqual([
      { kind: "presence", path: `${source.path}/B[1]`, ownerPath: source.path },
      { kind: "order", path: `${source.path}/#order`, ownerPath: source.path },
    ])
    expect(() => proof.finish(source)).toThrow(/аномал/)
    proof.finish(source, { annotated: true })
  })

  it.each([
    { count: 8, depth: 1 },
    { count: 256, depth: 3 },
    { count: 8, depth: 64 },
  ])("сравнивает $count значений один раз при глубине $depth", ({ count, depth }) => {
    const item = `${"<Item>".repeat(depth)}<Value>x</Value>${"</Item>".repeat(depth)}`
    const source = parseXmlDocumentWithSaxes(`<Root>${item.repeat(count)}</Root>`).roots[0]!
    let comparisons = 0
    const proof = createLocalXmlProof({ onValue: () => comparisons++ })
    const visit = (element: typeof source): ReturnType<typeof proof.finish> => {
      const content = element.content.map((child) => {
        if (child.type === "element") return visit(child)
        if (child.type === "text") return { type: "text" as const, value: "x" }
        throw new Error("Unexpected PI")
      })
      expect(proof.compare(element, { name: element.name, content })).toEqual([])
      return proof.finish(element)
    }
    visit(source)
    expect(comparisons).toBe(count)
  })

  it("проверяет свои атрибуты, текст и PI, не пропуская значения из-за совпадения структуры", () => {
    const source = parseXmlDocumentWithSaxes('<Root a="1" b="2">before<?hint value="yes"?>after</Root>').roots[0]!
    const proof = createLocalXmlProof()
    const differences = proof.compare(source, {
      name: "Root", attributes: [{ name: "b", value: "2" }, { name: "a", value: "9" }],
      content: [{ type: "text", value: "changed" }, { type: "processingInstruction", target: "hint", body: 'value="no"' }, { type: "text", value: "after" }],
    })
    expect(differences).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "order", path: `${source.path}/#attributes/#order` }),
      expect.objectContaining({ kind: "value", path: source.attributes[0]!.path }),
      expect.objectContaining({ kind: "value", path: source.content[0]!.path }),
      expect.objectContaining({ kind: "value", path: source.content[1]!.path }),
    ]))
  })

  it("не принимает непроверенный дочерний вклад и не скрывает повторный вклад", () => {
    const source = parseXmlDocumentWithSaxes('<Root><Item/></Root>').roots[0]!
    const child = source.content[0]!
    if (child.type !== "element") throw new Error("Item")
    const proof = createLocalXmlProof()
    expect(() => proof.compare(source, { name: "Root", content: [{
      type: "element", name: "Item", occurrence: 1, sourceId: child.id,
    }] })).toThrow(/ещё не проверен/)
    expect(() => proof.finish(source)).toThrow(/не проверен/)
    const second = createLocalXmlProof()
    second.compare(child, { name: "Item" })
    const receipt = second.finish(child)
    expect(() => second.compare(source, { name: "Root", content: [receipt, receipt] })).toThrow(/Повторный структурный вклад/)
  })

  it("не скрывает повторный структурный вклад атрибута", () => {
    const source = parseXmlDocumentWithSaxes('<Root id="1"/>').roots[0]!
    const proof = createLocalXmlProof()
    expect(() => proof.compare(source, { name: "Root", attributes: [
      { name: "id", occurrence: 1, value: "wrong" },
      { name: "id", occurrence: 1, value: "1" },
    ] })).toThrow(/Повторный структурный вклад/)
    expect(() => proof.finish(source)).toThrow(/не проверен/)
  })

  it("завершает также атрибуты сохранённой неизвестной PI", () => {
    const source = parseXmlDocumentWithSaxes('<Root><?hint value="yes"?></Root>').roots[0]!
    const instruction = source.content[0]!
    if (instruction.type !== "processingInstruction") throw new Error("PI")
    const proof = createLocalXmlProof()
    proof.check(source, { name: "Root" }, () => {})
    expect(() => proof.checkValue(instruction.attributes[0]!, "yes")).toThrow(/повтор/i)
  })

  it("не сравнивает повторно атрибут-свойство, но проверяет неизвестный соседний атрибут", () => {
    const source = parseXmlDocumentWithSaxes('<Root id="1" future="yes"/>').roots[0]!
    const compared: string[] = []
    const proof = createLocalXmlProof({ onValue: (node) => compared.push(node.path) })
    const receipt = proof.checkValue(source.attributes[0]!, "1")
    expect(proof.compare(source, { name: "Root", attributes: [{ name: "id", ...receipt }] })).toEqual([
      { kind: "presence", path: source.attributes[1]!.path, ownerPath: source.path },
    ])
    proof.finish(source, { annotated: true })
    expect(compared).toEqual([source.attributes[0]!.path])
    expect(() => proof.checkValue(source.attributes[0]!, "1")).toThrow(/повтор/i)
  })

  it("оформляет обнаруженное отклонение скаляра до завершения, без повторной сверки", () => {
    const source = parseXmlDocumentWithSaxes('<Root id="1"/>').roots[0]!
    const changes: string[] = []
    let comparisons = 0
    const proof = createLocalXmlProof({ onValue: () => comparisons++ })
    const receipt = proof.checkValue(source.attributes[0]!, "2", (difference) => {
      changes.push(difference.path)
    })
    expect(proof.compare(source, { name: "Root", attributes: [{ name: "id", ...receipt }] })).toEqual([])
    proof.finish(source)
    expect(changes).toEqual([source.attributes[0]!.path])
    expect(comparisons).toBe(1)
  })

  it("оформляет аномалию дочернего элемента один раз и не меняет YAML при проверке родителя", () => {
    const source = parseXmlDocumentWithSaxes('<Root><Value>original</Value></Root>').roots[0]!
    const child = source.content[0]!
    if (child.type !== "element") throw new Error("Value")
    const yaml = { Поле: "converted" }
    const annotations = createXmlAnomalyAnnotations()
    let corrections = 0
    const proof = createLocalXmlProof()
    const receipt = proof.check(child, { name: "Value", content: [{ type: "text", value: "converted" }] }, () => {
      corrections++
      annotations.set(yaml, "Поле", {
        kind: "raw", target: "value", occurrence: 1, hasSemanticValue: true, xml: { "#text": "original" },
      })
    })
    const completed = { ...yaml }
    const completedAnnotations = snapshotXmlAnomalyAnnotations(yaml, annotations)
    const serializedAtCompletion = serializeYAMLDocument(yaml, annotations).text
    proof.check(source, { name: "Root", content: [receipt] }, () => { corrections++ })
    expect(corrections).toBe(1)
    expect(yaml).toEqual(completed)
    expect(snapshotXmlAnomalyAnnotations(yaml, annotations)).toEqual(completedAnnotations)
    expect(serializeYAMLDocument(yaml, annotations).text).toBe(serializedAtCompletion)
  })

  it("не теряет неизвестный пустой элемент рядом с проверенным", () => {
    const root = parseXmlDocumentWithSaxes('<Root><Known>value</Known><Unknown/></Root>').roots[0]!
    const known = root.content[0]!
    const unknown = root.content[1]!
    if (known.type !== "element" || unknown.type !== "element") throw new Error("children")
    const proof = createLocalXmlProof()
    const receipt = proof.check(known, { name: "Known", content: [{ type: "text", value: "value" }] })
    expect(proof.compare(root, { name: "Root", content: [receipt] })).toEqual([
      { kind: "presence", path: unknown.path, ownerPath: root.path },
    ])
    proof.finish(root, { annotated: true })
    expect(() => proof.compare(unknown, { name: "Unknown" })).toThrow(/повтор/i)
  })

  it("различает порядок одноимённых вхождений по их структурному вкладу", () => {
    const root = parseXmlDocumentWithSaxes('<Root><Item>a</Item><Item>b</Item></Root>').roots[0]!
    const proof = createLocalXmlProof()
    const receipts = root.content.map((child, index) => {
      if (child.type !== "element") throw new Error("Item")
      return proof.check(child, { name: "Item", content: [{ type: "text", value: index === 0 ? "a" : "b" }] })
    })
    expect(proof.compare(root, { name: "Root", content: receipts.reverse() })).toEqual([
      { kind: "order", path: `${root.path}/#order`, ownerPath: root.path },
    ])
  })
})
