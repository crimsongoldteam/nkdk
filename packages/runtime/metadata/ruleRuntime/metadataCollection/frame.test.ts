import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import { ExecutionPath } from "../property/executionPath"
import { createMetadataCollectionFrame } from "./frame"

describe("общий кадр коллекции", () => {
  it("разрешает XML и YAML одним договором и подготавливает контекст только по запросу", () => {
    const rule = { itemType: "Child", properties: {} }
    let contexts = 0
    const frame = createMetadataCollectionFrame({
      descriptor: { kind: "collection", itemRule: rule, yamlShape: "record", resolveXMLItemRule: () => rule, resolveItemRule: () => rule },
      path: ExecutionPath.from<string | number>(["Корень"]),
      prepareContext: ({ name, index }) => { contexts++; return `${name}:${index}` },
    })
    const positions: unknown[] = []
    const xml = parseXmlDocumentWithSaxes("<Child/>").roots[0]!
    frame.visit([{ kind: "xml" as const, value: xml, name: "Один" }, { kind: "yaml" as const, value: {}, name: "Один" }],
      source => source, item => {
        expect(item.rule).toBe(rule)
        expect(item.context).toBe(item.context)
        positions.push([item.index, item.occurrence, item.path.toArray()])
      })
    expect(contexts).toBe(2)
    expect(positions).toEqual([[0, 0, ["Корень", "Один"]], [1, 1, ["Корень", "Один"]]])
  })

  it("не читает следующего ребёнка до завершения текущего и не готовит ненужный контекст", () => {
    let completed = 0
    function* inputs() {
      yield "Первый"
      expect(completed).toBe(1)
      yield "Второй"
    }
    const frame = createMetadataCollectionFrame({
      descriptor: { kind: "collection", itemRule: { itemType: "Child", properties: {} }, yamlShape: "record" },
      path: ExecutionPath.from<string | number>([]),
      prepareContext() { throw new Error("Контекст не запрашивался") },
    })
    frame.visit(inputs(), name => ({ kind: "yaml", value: {}, name }), item => {
      expect(item.rule.itemType).toBe("Child")
      completed++
    })
    expect(completed).toBe(2)
  })
})
