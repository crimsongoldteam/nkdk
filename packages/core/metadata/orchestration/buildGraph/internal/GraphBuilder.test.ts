import { describe, expect, it } from "vitest"
import { GraphBuilder } from "./GraphBuilder"

// ──────────────────────────────────────────────────────────────
// A: ensureNode + getNodeAttributes + hasNode
// ──────────────────────────────────────────────────────────────
describe("GraphBuilder: ensureNode / getNodeAttributes / hasNode", () => {
  it("ensureNode создаёт узел с пустыми атрибутами", () => {
    const g = new GraphBuilder()
    g.ensureNode("Справочник.Клиенты")
    expect(g.hasNode("Справочник.Клиенты")).toBe(true)
    expect(g.getNodeAttributes("Справочник.Клиенты")).toEqual({
      name: undefined,
      item: undefined,
      filePaths: [],
      contributedFilePaths: [],
      flattenSkipKeys: new Set(),
      itemFlattenTransforms: [],
    })
  })

  it("ensureNode идемпотентен и принимает опциональные attrs", () => {
    const g = new GraphBuilder()
    g.ensureNode("X", { name: "X" })
    g.ensureNode("X") // повторный вызов не сбрасывает
    expect(g.getNodeAttributes("X").name).toBe("X")
  })

  it("ensureNode не перезаписывает уже установленные attrs при повторном вызове с другими", () => {
    const g = new GraphBuilder()
    g.ensureNode("X", { name: "first" })
    g.ensureNode("X", { name: "second" })
    expect(g.getNodeAttributes("X").name).toBe("first")
  })

  it("hasNode возвращает false для несуществующего узла", () => {
    const g = new GraphBuilder()
    expect(g.hasNode("Справочник.Несуществующий")).toBe(false)
  })

  it("getNodeAttributes на неизвестном узле бросает", () => {
    const g = new GraphBuilder()
    expect(() => g.getNodeAttributes("Y")).toThrow(/Unknown node/)
  })
})

// ──────────────────────────────────────────────────────────────
// B: addFilePath / removeFilePath
// ──────────────────────────────────────────────────────────────
describe("GraphBuilder: addFilePath / removeFilePath", () => {
  it("addFilePath дописывает уникально", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")
    g.addFilePath("X", "a.yaml")
    g.addFilePath("X", "a.yaml")
    g.addFilePath("X", "b.yaml")
    expect(g.getNodeAttributes("X").filePaths).toEqual(["a.yaml", "b.yaml"])
  })

  it("removeFilePath удаляет указанный путь", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")
    g.addFilePath("X", "a.yaml")
    g.addFilePath("X", "b.yaml")
    g.removeFilePath("X", "a.yaml")
    expect(g.getNodeAttributes("X").filePaths).toEqual(["b.yaml"])
  })

  it("removeFilePath на отсутствующем пути — no-op", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")
    g.removeFilePath("X", "a.yaml")
    expect(g.getNodeAttributes("X").filePaths).toEqual([])
  })

  it("addContributedFilePath дописывает уникально", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")
    g.addContributedFilePath("X", "a.yaml")
    g.addContributedFilePath("X", "a.yaml")
    g.addContributedFilePath("X", "b.yaml")
    expect(g.getNodeAttributes("X").contributedFilePaths).toEqual(["a.yaml", "b.yaml"])
  })
})

// ──────────────────────────────────────────────────────────────
// C: setItem
// ──────────────────────────────────────────────────────────────
describe("GraphBuilder: setItem", () => {
  it("setItem заменяет item", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")
    g.setItem("X", { itemType: "MetadataCatalog", name: "Клиенты" })
    expect(g.getNodeAttributes("X").item).toEqual({ itemType: "MetadataCatalog", name: "Клиенты" })
  })

  it("setItem синхронизирует attrs.name из item.name (если строка)", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")
    g.setItem("X", { itemType: "Form", name: "ФормаСписка" })
    expect(g.getNodeAttributes("X").name).toBe("ФормаСписка")
  })

  it("setItem с item без строки name не трогает attrs.name", () => {
    const g = new GraphBuilder()
    g.ensureNode("X", { name: "preset" })
    g.setItem("X", { itemType: "Form" })
    expect(g.getNodeAttributes("X").name).toBe("preset")
  })
})

// ──────────────────────────────────────────────────────────────
// D: addFlattenSkipKeys
// ──────────────────────────────────────────────────────────────
describe("GraphBuilder: addFlattenSkipKeys", () => {
  it("addFlattenSkipKeys добавляет ключи идемпотентно", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")
    g.addFlattenSkipKeys("X", ["name", "owner"])
    g.addFlattenSkipKeys("X", ["name"])
    expect(g.getNodeAttributes("X").flattenSkipKeys).toEqual(new Set(["name", "owner"]))
  })
})

describe("GraphBuilder: item flatten transforms", () => {
  it("addItemFlattenTransform добавляет преобразователи в порядке регистрации", () => {
    const g = new GraphBuilder()
    g.ensureNode("X")

    const first = (item: unknown): unknown =>
      item && typeof item === "object" ? { ...(item as Record<string, unknown>), first: true } : item
    const second = (item: unknown): unknown =>
      item && typeof item === "object" ? { ...(item as Record<string, unknown>), second: true } : item

    g.addItemFlattenTransform("X", first)
    g.addItemFlattenTransform("X", second)

    expect(g.getNodeAttributes("X").itemFlattenTransforms).toEqual([first, second])
  })
})

// ──────────────────────────────────────────────────────────────
// E: ensureEdge + outEdgeEntries
// ──────────────────────────────────────────────────────────────
describe("GraphBuilder: ensureEdge / outEdgeEntries", () => {
  it("ensureEdge добавляет ребро (мульти-граф по kind)", () => {
    const g = new GraphBuilder()
    g.ensureNode("A")
    g.ensureNode("B")
    g.ensureEdge("A", "B", "VALUE", { yaml: "Значение" })
    g.ensureEdge("A", "B", "OBJECT", { yaml: "Объект" })
    const out = [...g.outEdgeEntries("A")]
    expect(out).toEqual([
      { target: "B", attributes: { kind: "VALUE", yaml: "Значение" } },
      { target: "B", attributes: { kind: "OBJECT", yaml: "Объект" } },
    ])
  })

  it("ensureEdge идемпотентен по (src, tgt, kind), обновляя attrs", () => {
    const g = new GraphBuilder()
    g.ensureNode("A")
    g.ensureNode("B")
    g.ensureEdge("A", "B", "VALUE", { yaml: "v1" })
    g.ensureEdge("A", "B", "VALUE", { yaml: "v2" })
    expect([...g.outEdgeEntries("A")]).toEqual([
      { target: "B", attributes: { kind: "VALUE", yaml: "v2" } },
    ])
  })

  it("outEdgeEntries не выдаёт исходящие из других узлов", () => {
    const g = new GraphBuilder()
    g.ensureNode("A")
    g.ensureNode("B")
    g.ensureNode("C")
    g.ensureEdge("A", "B", "VALUE")
    g.ensureEdge("C", "B", "VALUE")
    expect([...g.outEdgeEntries("A")]).toHaveLength(1)
  })

  it("ensureEdge без attrs использует пустые дополнительные атрибуты", () => {
    const g = new GraphBuilder()
    g.ensureNode("A")
    g.ensureNode("B")
    g.ensureEdge("A", "B", "LINK")
    const out = [...g.outEdgeEntries("A")]
    expect(out).toEqual([{ target: "B", attributes: { kind: "LINK" } }])
  })

  it("edgeEntriesTouching возвращает входящие и исходящие рёбра без дублей", () => {
    const g = new GraphBuilder()
    for (const nodeId of ["A", "B", "C", "D"]) {
      g.ensureNode(nodeId)
    }
    g.ensureEdge("A", "B", "AB", { yaml: "ab" })
    g.ensureEdge("C", "A", "CA", { yaml: "ca" })
    g.ensureEdge("B", "D", "BD", { yaml: "bd" })
    g.ensureEdge("C", "D", "CD", { yaml: "cd" })

    const edges = [...g.edgeEntriesTouching(["A", "B"])]
    expect(edges).toHaveLength(3)
    expect(edges.map((edge) => [edge.source, edge.target, edge.attributes.kind])).toEqual([
      ["A", "B", "AB"],
      ["C", "A", "CA"],
      ["B", "D", "BD"],
    ])
  })

  it("массовый обход исходящих рёбер остаётся линейным", () => {
    const g = new GraphBuilder()
    const size = 20_000
    for (let i = 0; i < size; i += 1) {
      g.ensureNode(`src-${i}`)
      g.ensureNode(`tgt-${i}`)
      g.ensureEdge(`src-${i}`, `tgt-${i}`, "LINK")
    }

    const startedAt = performance.now()
    let edgeCount = 0
    for (let i = 0; i < size; i += 1) {
      edgeCount += [...g.outEdgeEntries(`src-${i}`)].length
    }

    expect(edgeCount).toBe(size)
    expect(performance.now() - startedAt).toBeLessThan(500)
  })
})

// ──────────────────────────────────────────────────────────────
// F: nodes()
// ──────────────────────────────────────────────────────────────
describe("GraphBuilder: nodes()", () => {
  it("nodes() обходит все добавленные узлы в порядке вставки", () => {
    const g = new GraphBuilder()
    g.ensureNode("C")
    g.ensureNode("A")
    g.ensureNode("B")
    expect([...g.nodes()]).toEqual(["C", "A", "B"])
  })

  it("nodes() возвращает пустой итератор для пустого графа", () => {
    const g = new GraphBuilder()
    expect([...g.nodes()]).toEqual([])
  })

  it("nodesWithPrefix возвращает узлы с заданным префиксом в порядке вставки", () => {
    const g = new GraphBuilder()
    g.ensureNode("Справочник.Товары.Форма.ФормаСписка.Элемент.Группа")
    g.ensureNode("Справочник.Товары.Форма.ФормаСписка.Элемент.Поле")
    g.ensureNode("Справочник.Товары.Форма.ФормаСписка.Реквизит.Поле")
    g.ensureNode("Справочник.Товары.Форма.ДругаяФорма.Элемент.Поле")

    expect([
      ...g.nodesWithPrefix("Справочник.Товары.Форма.ФормаСписка.Элемент."),
    ]).toEqual([
      "Справочник.Товары.Форма.ФормаСписка.Элемент.Группа",
      "Справочник.Товары.Форма.ФормаСписка.Элемент.Поле",
    ])
  })

  it("nodesWithPrefix не считает похожий сегмент подходящим префиксом", () => {
    const g = new GraphBuilder()
    g.ensureNode("Root.Элемент.A")
    g.ensureNode("Root.Элемент2.B")

    expect([...g.nodesWithPrefix("Root.Элемент.")]).toEqual(["Root.Элемент.A"])
  })
})
