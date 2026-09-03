import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { isXmlElementNode } from "../../../xml/import/document"
import { createLocalXmlProof, type LocalXmlChild } from "./localProof"
import { localXmlShapeFromObject } from "./localShape"
import { completeLocalXmlFragment } from "./localFragment"

describe("локальная сверка составного XML-фрагмента", () => {
  it("проверяет листья один раз и не читает значения уже закрытых детей", () => {
    const source = parseXmlDocumentWithSaxes('<Root flag="yes"><Item><Value>a</Value></Item><Item><Value>b</Value></Item><Tail><Value>c</Value></Tail></Root>').roots[0]!
    const original = structuredClone(source)
    const items = source.content.filter(isXmlElementNode)
    const compared: string[] = []
    const proof = createLocalXmlProof({ onValue: node => compared.push(node.path) })
    const closed = items[1]!
    const leaf = closed.content.find(isXmlElementNode)!
    const leafReceipt = proof.check(leaf, localXmlShapeFromObject("Value", "b"))
    const closedReceipt = proof.check(closed, { name: "Item", content: [leafReceipt] })
    const marker = Object.defineProperty({}, "Value", { enumerable: true, get() { throw new Error("Повторное чтение ребёнка") } })
    const result = completeLocalXmlFragment({
      source, name: "Root", value: { _flag: "yes", Item: [{ Value: "a" }, marker], Tail: { Value: "c" } }, proof,
      childReceipt: value => value === marker ? closedReceipt : undefined,
    })
    expect(result).toEqual({ type: "element", name: "Root", occurrence: 1, sourceId: source.id })
    expect(compared).toHaveLength(4)
    expect(new Set(compared).size).toBe(4)
    expect(source).toEqual(original)
  })

  it("выщёлкивает уже проверенный узел из последующей границы родителя", () => {
    const source = parseXmlDocumentWithSaxes("<Root><Settings><TypeSet>value</TypeSet></Settings></Root>").roots[0]!
    const settings = source.content.find(isXmlElementNode)!
    const typeSet = settings.content.find(isXmlElementNode)!
    let comparisons = 0
    const proof = createLocalXmlProof({ onValue: () => comparisons++ })
    proof.check(typeSet, localXmlShapeFromObject("TypeSet", "value"))

    expect(completeLocalXmlFragment({
      source,
      name: "Root",
      value: { Settings: { TypeSet: "value" } },
      proof,
    })).toMatchObject({ sourceId: source.id })
    expect(comparisons).toBe(1)
  })

  it("передаёт расхождения ближайшей границе и не обходит лишнее экспортное поддерево", () => {
    const source = parseXmlDocumentWithSaxes('<Root><Lost><Deep>x</Deep></Lost><Item><Value>original</Value></Item><Tail/></Root>').roots[0]!
    const differences: { path: string; kinds: readonly string[] }[] = []
    const extra = Object.defineProperty({}, "Deep", { enumerable: true, get() { throw new Error("Лишнее поддерево не нужно обходить") } })
    let comparisons = 0
    const result = completeLocalXmlFragment({
      source, name: "Root", value: { Tail: "", Item: { Value: "changed" }, Extra: extra },
      proof: createLocalXmlProof({ onValue: () => comparisons++ }),
      annotate: ({ source, differences: found }) => differences.push({ path: source.path, kinds: found.map(difference => difference.kind) }),
    })
    expect(result.sourceId).toBe(source.id)
    expect(comparisons).toBe(1)
    expect(differences).toEqual([
      { path: "/Root[1]/Item[1]/Value[1]", kinds: ["value"] },
      { path: "/Root[1]", kinds: ["presence", "presence", "order"] },
    ])
  })

  it("проверяет порядок одинаково названных закрытых детей, не сравнивая их значения повторно", () => {
    const source = parseXmlDocumentWithSaxes("<Root><Item>a</Item><Item>b</Item></Root>").roots[0]!
    const proof = createLocalXmlProof()
    const receipts = new Map<object, LocalXmlChild>()
    const markers = source.content.filter(isXmlElementNode).map((child, index) => {
      const marker = {}
      receipts.set(marker, proof.check(child, localXmlShapeFromObject("Item", index === 0 ? "a" : "b")))
      return marker
    })
    const found: string[] = []
    completeLocalXmlFragment({
      source, name: "Root", value: { Item: markers.reverse() }, proof,
      childReceipt: value => typeof value === "object" && value !== null ? receipts.get(value) : undefined,
      annotate: ({ differences }) => found.push(...differences.map(difference => difference.kind)),
    })
    expect(found).toEqual(["order"])
  })

  it("не подменяет экспортное имя исходным alias", () => {
    const source = parseXmlDocumentWithSaxes("<Alias>x</Alias>").roots[0]!
    expect(() => completeLocalXmlFragment({ source, name: "Value", value: "x", proof: createLocalXmlProof() }))
      .toThrow(/Не оформлены аномалии/)
  })

  it("доверяет имени уже оформленного дочернего вклада", () => {
    const source = parseXmlDocumentWithSaxes("<Root><Alias>x</Alias></Root>").roots[0]!
    const child = source.content.find(isXmlElementNode)!
    const proof = createLocalXmlProof()
    const receipt = proof.check(child, localXmlShapeFromObject("Alias", "x"))
    const marker = {}
    expect(completeLocalXmlFragment({
      source, name: "Root", value: { Value: marker }, proof,
      childReceipt: value => value === marker ? receipt : undefined,
    })).toMatchObject({ sourceId: source.id })
  })
})
