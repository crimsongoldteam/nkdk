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

  describe("updateNodeFilePath", () => {
    it("обновляет filePath и обратный индекс", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары" })
      g.updateNodeFilePath("Справочник.Товары", "new.yaml")

      expect(g.getNodeAttribute("Справочник.Товары", "filePath")).toBe("new.yaml")
      expect(g.getNodesByFile("new.yaml").has("Справочник.Товары")).toBe(true)
    })

    it("удаляет из старого индекса при обновлении", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары", filePath: "old.yaml" })
      g.updateNodeFilePath("Справочник.Товары", "new.yaml")

      expect(g.getNodesByFile("old.yaml").has("Справочник.Товары")).toBe(false)
      expect(g.getNodesByFile("new.yaml").has("Справочник.Товары")).toBe(true)
    })

    it("не меняет индекс при одинаковом filePath", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары", filePath: "same.yaml" })
      g.updateNodeFilePath("Справочник.Товары", "same.yaml")

      expect(g.getNodesByFile("same.yaml").has("Справочник.Товары")).toBe(true)
    })
  })

  describe("invalidateFile", () => {
    it("удаляет узлы без входящих reference-рёбер", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары", filePath: "goods.yaml" })
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена", filePath: "goods.yaml" })
      g.ensureEdge("comp-1", "Справочник.Товары", "Справочник.Товары.Цена", {
        yaml: "Реквизит",
        name: "Реквизит",
        kind: "composition",
      })

      g.invalidateFile("goods.yaml")

      expect(g.hasNode("Справочник.Товары")).toBe(false)
      expect(g.hasNode("Справочник.Товары.Цена")).toBe(false)
      expect(g.getNodesByFile("goods.yaml").size).toBe(0)
    })

    it("превращает узел с входящим reference-ребром в заглушку", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена", filePath: "goods.yaml" })
      g.ensureNode("Справочник.Валюты", { name: "Валюты", filePath: "currencies.yaml" })
      g.setNodeAttribute("Справочник.Валюты", "item", { itemType: "MetadataCatalog", name: "Валюты" })
      g.ensureEdge("ref-1", "Справочник.Товары.Цена", "Справочник.Валюты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      g.invalidateFile("currencies.yaml")

      expect(g.hasNode("Справочник.Валюты")).toBe(true)
      expect(g.getNodeAttribute("Справочник.Валюты", "item")).toBeUndefined()
      expect(g.getNodeAttribute("Справочник.Валюты", "filePath")).toBeUndefined()
      expect(g.getNodesByFile("currencies.yaml").size).toBe(0)
    })

    it("удаляет исходящие рёбра заглушки", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена", filePath: "goods.yaml" })
      g.ensureNode("Справочник.Валюты", { name: "Валюты", filePath: "currencies.yaml" })
      g.ensureNode("Справочник.Валюты.Код", { name: "Код", filePath: "currencies.yaml" })
      g.setNodeAttribute("Справочник.Валюты", "item", { itemType: "MetadataCatalog", name: "Валюты" })
      g.ensureEdge("ref-1", "Справочник.Товары.Цена", "Справочник.Валюты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })
      g.ensureEdge("comp-1", "Справочник.Валюты", "Справочник.Валюты.Код", {
        yaml: "Реквизит",
        name: "Реквизит",
        kind: "composition",
      })

      g.invalidateFile("currencies.yaml")

      expect(g.outEdges("Справочник.Валюты")).toHaveLength(0)
    })

    it("не затрагивает узлы других файлов", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары", filePath: "goods.yaml" })
      g.ensureNode("Справочник.Валюты", { name: "Валюты", filePath: "currencies.yaml" })

      g.invalidateFile("goods.yaml")

      expect(g.hasNode("Справочник.Валюты")).toBe(true)
      expect(g.getNodesByFile("currencies.yaml").has("Справочник.Валюты")).toBe(true)
    })

    it("мульти-файловый объект: инвалидация одного файла не затрагивает узлы другого", () => {
      const g = new MetadataGraph()
      g.ensureNode("Форма.ФормаСписка", { name: "ФормаСписка", filePath: "form.yaml" })
      g.ensureNode("Форма.ФормаСписка.Список", { name: "Список", filePath: "form.nkdk" })

      g.invalidateFile("form.yaml")

      expect(g.hasNode("Форма.ФормаСписка")).toBe(false)
      expect(g.hasNode("Форма.ФормаСписка.Список")).toBe(true)
      expect(g.getNodesByFile("form.nkdk").has("Форма.ФормаСписка.Список")).toBe(true)
    })

    it("orphan stub: удаляется если 1.yaml отсутствует и ссылающийся файл перезаписан", () => {
      // 1.yaml нет → Контрагенты — заглушка (item undefined)
      // 2.yaml ссылается → при инвалидации 2.yaml единственное входящее ребро пропадает
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Контрагенты", { name: "Контрагенты" }) // stub: нет item, нет filePath
      g.ensureNode("Справочник.Товары.Контрагент", { name: "Контрагент", filePath: "2.yaml" })
      g.ensureEdge("ref-1", "Справочник.Товары.Контрагент", "Справочник.Контрагенты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      g.invalidateFile("2.yaml")

      expect(g.hasNode("Справочник.Контрагенты")).toBe(false)
    })

    it("orphan stub: остаётся если два файла ссылаются и только один перезаписан", () => {
      // 1.yaml нет → Контрагенты — заглушка
      // 2.yaml и 3.yaml оба ссылаются → после инвалидации 2.yaml остаётся ребро из 3.yaml
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Контрагенты", { name: "Контрагенты" }) // stub
      g.ensureNode("Справочник.Товары.Контрагент", { name: "Контрагент", filePath: "2.yaml" })
      g.ensureNode("Справочник.Документ.Контрагент", { name: "Контрагент", filePath: "3.yaml" })
      g.ensureEdge("ref-1", "Справочник.Товары.Контрагент", "Справочник.Контрагенты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })
      g.ensureEdge("ref-2", "Справочник.Документ.Контрагент", "Справочник.Контрагенты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      g.invalidateFile("2.yaml")

      expect(g.hasNode("Справочник.Контрагенты")).toBe(true)
    })

    it("orphan stub: узел с item не удаляется даже если входящих рёбер не осталось", () => {
      // 1.yaml существует → Контрагенты — полноценный узел (item задан)
      // 2.yaml ссылается → после инвалидации 2.yaml Контрагенты должны остаться
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Контрагенты", {
        name: "Контрагенты",
        filePath: "1.yaml",
        item: { itemType: "MetadataCatalog", name: "Контрагенты" },
      })
      g.ensureNode("Справочник.Товары.Контрагент", { name: "Контрагент", filePath: "2.yaml" })
      g.ensureEdge("ref-1", "Справочник.Товары.Контрагент", "Справочник.Контрагенты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      g.invalidateFile("2.yaml")

      expect(g.hasNode("Справочник.Контрагенты")).toBe(true)
      expect(g.getNodeAttribute("Справочник.Контрагенты", "item")).toBeDefined()
    })

    it("нет эффекта при инвалидации несуществующего файла", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары", filePath: "goods.yaml" })

      expect(() => g.invalidateFile("unknown.yaml")).not.toThrow()
      expect(g.hasNode("Справочник.Товары")).toBe(true)
    })
  })

  describe("getBrokenReferences", () => {
    it("возвращает пустую Map при отсутствии reference-рёбер", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары" })

      expect(g.getBrokenReferences().size).toBe(0)
    })

    it("возвращает пустую Map если все цели reference-рёбер имеют item", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена" })
      g.ensureNode("Справочник.Валюты", { name: "Валюты" })
      g.setNodeAttribute("Справочник.Валюты", "item", { itemType: "MetadataCatalog", name: "Валюты" })
      g.ensureEdge("ref-1", "Справочник.Товары.Цена", "Справочник.Валюты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      expect(g.getBrokenReferences().size).toBe(0)
    })

    it("возвращает узлы-заглушки — цели reference-рёбер без item", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена" })
      g.ensureNode("Справочник.Валюты", { name: "Валюты" })
      g.ensureEdge("ref-1", "Справочник.Товары.Цена", "Справочник.Валюты", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      const broken = g.getBrokenReferences()
      expect(broken.size).toBe(1)
      expect(broken.has("Справочник.Валюты")).toBe(true)
    })

    it("не включает composition-рёбра без item", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.Товары", { name: "Товары" })
      g.ensureNode("Справочник.Товары.Цена", { name: "Цена" })
      g.ensureEdge("comp-1", "Справочник.Товары", "Справочник.Товары.Цена", {
        yaml: "Реквизит",
        name: "Реквизит",
        kind: "composition",
      })

      expect(g.getBrokenReferences().size).toBe(0)
    })

    it("не дублирует узел при нескольких reference-рёбрах к одной заглушке", () => {
      const g = new MetadataGraph()
      g.ensureNode("Справочник.А.Реквизит1", { name: "Реквизит1" })
      g.ensureNode("Справочник.А.Реквизит2", { name: "Реквизит2" })
      g.ensureNode("Справочник.Б", { name: "Б" })
      g.ensureEdge("ref-1", "Справочник.А.Реквизит1", "Справочник.Б", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })
      g.ensureEdge("ref-2", "Справочник.А.Реквизит2", "Справочник.Б", {
        yaml: "Тип",
        name: "Тип",
        kind: "reference",
      })

      expect(g.getBrokenReferences().size).toBe(1)
    })
  })
})
