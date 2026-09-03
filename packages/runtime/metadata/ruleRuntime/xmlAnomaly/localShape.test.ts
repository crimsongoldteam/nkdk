import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { XML_ORDERED_CHILDREN } from "../../../xml/export/exporter"
import { createLocalXmlProof } from "./localProof"
import { localXmlShapeFromObject } from "./localShape"

describe("локальная форма обычного XML-выхода", () => {
  it.each([
    { value: undefined, content: [] },
    { value: "", content: [] },
    { value: null, content: [] },
    { value: 0, content: [{ type: "text", value: "0" }] },
    { value: false, content: [{ type: "text", value: "false" }] },
    { value: "   ", content: [{ type: "text", value: "   " }] },
    { value: { _id: 1, "#text": "text" }, attributes: [{ name: "id", value: "1" }], content: [{ type: "text", value: "text" }] },
    { value: { "?hint": 'mode="x"' }, content: [{ type: "text", value: "\n\t" }, { type: "processingInstruction", target: "hint", body: "", attributes: [] }, { type: "text", value: "\n" }] },
  ])("использует обычное представление собственного значения: $value", ({ value, attributes = [], content }) => {
    expect(localXmlShapeFromObject("Value", value)).toEqual({ name: "Value", attributes, content })
  })

  it("принимает только структурные результаты детей и не читает их содержимое", () => {
    const source = parseXmlDocumentWithSaxes('<Root><Item>a</Item><Other/><Item>b</Item></Root>').roots[0]!
    const proof = createLocalXmlProof()
    const receipts = source.content.map((child, index) => {
      if (child.type !== "element") throw new Error("child")
      return proof.check(child, { name: child.name, content: index === 1 ? [] : [{ type: "text", value: index === 0 ? "a" : "b" }] })
    })
    const opaque = Object.defineProperty({}, "mustNotRead", { enumerable: true, get() { throw new Error("Повторный обход ребёнка") } })
    let position = 0
    const shape = localXmlShapeFromObject("Root", {
      [XML_ORDERED_CHILDREN]: [{ key: "Item", value: opaque }, { key: "Other", value: opaque }, { key: "Item", value: opaque }],
    }, (name, value, occurrence) => {
      expect(value).toBe(opaque)
      const receipt = receipts[position++]!
      expect({ name, occurrence }).toEqual({ name: receipt.name, occurrence: receipt.occurrence })
      return receipt
    })
    expect(shape.content).toEqual(receipts)
    expect(proof.compare(source, shape)).toEqual([])
    proof.finish(source)
    expect(position).toBe(3)
  })

  it("не принимает вложенный выход без потребителя детей", () => {
    expect(() => localXmlShapeFromObject("Root", { Child: "value" })).toThrow(/потребитель/)
  })

  it("применяет обычную группировку ChildItems без обхода значений элементов", () => {
    const opaque = Object.defineProperty({}, "value", { enumerable: true, get() { throw new Error("Повторный обход") } })
    const names: string[] = []
    const outer = localXmlShapeFromObject("Root", { ChildItems: [{ Panel: opaque }, { Group: opaque }, { Panel: opaque }] }, (name, value, occurrence) => {
      names.push(name)
      const inner = localXmlShapeFromObject(name, value, (childName, childValue, childOccurrence) => {
        expect(childValue).toBe(opaque)
        return { type: "element", name: childName, occurrence: childOccurrence }
      })
      expect(inner.content).toEqual([
        { type: "element", name: "Panel", occurrence: 1 },
        { type: "element", name: "Group", occurrence: 1 },
        { type: "element", name: "Panel", occurrence: 2 },
      ])
      return { type: "element", name, occurrence }
    })
    expect(names).toEqual(["ChildItems"])
    expect(outer.content).toHaveLength(1)
  })
})
