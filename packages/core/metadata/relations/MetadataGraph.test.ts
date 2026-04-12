import { describe, expect, it } from "vitest"
import { MetadataGraph } from "./MetadataGraph"

describe("MetadataGraph", () => {
  describe("ensureNode", () => {
    it("добавляет узел с атрибутами", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары", filePath: "catalogs/goods.yaml" })

      expect(g.hasNode("Справочник.Товары")).toBe(true)
      expect(g.getNodeAttributes("Справочник.Товары")).toMatchObject({ name: "Товары" })
    })

    it("не перезаписывает существующий узел при повторном вызове", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары" })
      g.setNodeAttribute("Справочник.Товары", "item", { itemType: "MetadataCatalog", name: "Товары" })
      g.ensureNode("Справочник.Товары", { name: "Другое" })

      expect(g.getNodeAttribute("Справочник.Товары", "item")).toBeDefined()
    })
  })

  describe("ensureEdge", () => {
    it("добавляет ребро с kind: composition", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник", { name: "Справочник" })
      g.ensureNode("Справочник.Товары", { name: "Товары" })
      g.ensureEdge("edge-1", "Справочник", "Справочник.Товары", {
        yaml: "MetadataCatalog",
        name: "MetadataCatalog",
        kind: "composition",
      })

      const entries = [...g.outEdgeEntries("Справочник")]
      expect(entries).toHaveLength(1)
      expect(entries[0].attributes.kind).toBe("composition")
    })

    it("добавляет ребро с kind: reference", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена" })
      g.ensureNode("Справочник.Валюты", { name: "Валюты" })
      g.ensureEdge("ref-1", "Справочник.Товары.Цена", "Справочник.Валюты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      const entries = [...g.outEdgeEntries("Справочник.Товары.Цена")]
      expect(entries[0].attributes.kind).toBe("reference")
    })

    it("не дублирует ребро при повторном вызове", () => {
      const g = new MetadataGraph()
      g.ensureNode("A", { name: "A" })
      g.ensureNode("B", { name: "B" })
      g.ensureEdge("key-1", "A", "B", { yaml: "Реквизит", name: "Реквизит", kind: "composition" })
      g.ensureEdge("key-1", "A", "B", { yaml: "Реквизит", name: "Реквизит", kind: "composition" })

      expect(g.outEdges("A")).toHaveLength(1)
    })
  })

  describe("обратный индекс (fileIndex)", () => {
    it("возвращает nodeId по filePath", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары", filePath: "catalogs/goods.yaml" })
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена", filePath: "catalogs/goods.yaml" })
      g.ensureNode("Справочник.Валюты", { name: "Валюты", filePath: "catalogs/currencies.yaml" })

      const nodes = g.getNodesByFile("catalogs/goods.yaml")
      expect(nodes.has("Справочник.Товары")).toBe(true)
      expect(nodes.has("Справочник.Товары.Цена")).toBe(true)
      expect(nodes.has("Справочник.Валюты")).toBe(false)
    })

    it("возвращает пустой Set для неизвестного файла", () => {
      const g = new MetadataGraph()
      expect(g.getNodesByFile("unknown.yaml").size).toBe(0)
    })

    it("не индексирует узлы без filePath", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник", { name: "Справочник" })

      const nodes = g.getNodesByFile("Справочник")
      expect(nodes.size).toBe(0)
    })
  })

  describe("clear", () => {
    it("удаляет все узлы, рёбра и обратный индекс", () => {
      const g = new MetadataGraph()
      g.ensureNode("A", { name: "A", filePath: "a.yaml" })
      g.ensureNode("B", { name: "B", filePath: "a.yaml" })
      g.ensureEdge("e1", "A", "B", { yaml: "x", name: "x", kind: "composition" })

      g.clear()

      expect(g.nodes()).toHaveLength(0)
      expect(g.getNodesByFile("a.yaml").size).toBe(0)
    })
  })

  describe("setNodeAttribute", () => {
    it("обновляет атрибут item после импорта", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена" })
      const item = { itemType: "MetadataAttribute", name: "Цена" }
      g.setNodeAttribute("Справочник.Товары.Цена", "item", item)

      expect(g.getNodeAttribute("Справочник.Товары.Цена", "item")).toBe(item)
    })
  })
})
