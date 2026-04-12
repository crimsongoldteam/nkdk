import { describe, expect, it } from "vitest"
import { MetadataGraph } from "./MetadataGraph"
import { parsePathSegments, walk, walkPath } from "./GraphWalker"

/**
 * Граф для тестов:
 *
 *   Справочник.Заказы
 *     → "Реквизит"   → Справочник.Заказы.Контрагент
 *                          → "Тип" → Справочник.Контрагенты
 *     → "Реквизит"   → Справочник.Заказы.Сумма          (примитив)
 *     → "Реквизит"   → Справочник.Заказы.СоставнойТип  (union: Контрагенты + Договоры)
 *                          → "Тип" → Справочник.Контрагенты
 *                          → "Тип" → Справочник.Договоры
 *     → "Реквизит"   → Справочник.Заказы.УдалённыйТип
 *                          → "Тип" → Справочник.УдалённыйСправочник  (заглушка, нет item)
 *     → "ТабличнаяЧасть" → Справочник.Заказы.Строки
 *                              → "Реквизит" → Справочник.Заказы.Строки.Количество (примитив)
 *
 *   Справочник.Контрагенты
 *     → "Реквизит"   → Справочник.Контрагенты.Наименование  (примитив)
 *     → "ТабличнаяЧасть" → Справочник.Контрагенты.Адреса
 *                              → "Реквизит" → Справочник.Контрагенты.Адреса.Город (примитив)
 *
 *   Справочник.Договоры
 *     → "Реквизит"   → Справочник.Договоры.Номер  (примитив)
 */
function buildGraph(): MetadataGraph {
  const g = new MetadataGraph()
  const item = (name: string) => ({ name })

  // Заказы
  g.ensureNode("Справочник.Заказы", { name: "Заказы", item: item("Заказы") })

  // Реквизит Контрагент → Справочник.Контрагенты
  g.ensureNode("Справочник.Заказы.Контрагент", { name: "Контрагент", item: item("Контрагент") })
  g.ensureEdge("comp:Заказы:Контрагент", "Справочник.Заказы", "Справочник.Заказы.Контрагент", {
    yaml: "Реквизит",
    name: "Реквизит",
    kind: "composition",
  })

  // Реквизит Сумма (примитив, без reference)
  g.ensureNode("Справочник.Заказы.Сумма", { name: "Сумма", item: item("Сумма") })
  g.ensureEdge("comp:Заказы:Сумма", "Справочник.Заказы", "Справочник.Заказы.Сумма", {
    yaml: "Реквизит",
    name: "Реквизит",
    kind: "composition",
  })

  // Реквизит СоставнойТип → Контрагенты | Договоры (union)
  g.ensureNode("Справочник.Заказы.СоставнойТип", {
    name: "СоставнойТип",
    item: item("СоставнойТип"),
  })
  g.ensureEdge(
    "comp:Заказы:СоставнойТип",
    "Справочник.Заказы",
    "Справочник.Заказы.СоставнойТип",
    { yaml: "Реквизит", name: "Реквизит", kind: "composition" },
  )

  // Реквизит УдалённыйТип → заглушка
  g.ensureNode("Справочник.Заказы.УдалённыйТип", {
    name: "УдалённыйТип",
    item: item("УдалённыйТип"),
  })
  g.ensureEdge(
    "comp:Заказы:УдалённыйТип",
    "Справочник.Заказы",
    "Справочник.Заказы.УдалённыйТип",
    { yaml: "Реквизит", name: "Реквизит", kind: "composition" },
  )

  // Табличная часть Строки
  g.ensureNode("Справочник.Заказы.Строки", { name: "Строки", item: item("Строки") })
  g.ensureEdge("comp:Заказы:Строки", "Справочник.Заказы", "Справочник.Заказы.Строки", {
    yaml: "ТабличнаяЧасть",
    name: "ТабличнаяЧасть",
    kind: "composition",
  })
  g.ensureNode("Справочник.Заказы.Строки.Количество", {
    name: "Количество",
    item: item("Количество"),
  })
  g.ensureEdge(
    "comp:Строки:Количество",
    "Справочник.Заказы.Строки",
    "Справочник.Заказы.Строки.Количество",
    { yaml: "Реквизит", name: "Реквизит", kind: "composition" },
  )

  // Контрагенты
  g.ensureNode("Справочник.Контрагенты", { name: "Контрагенты", item: item("Контрагенты") })
  g.ensureNode("Справочник.Контрагенты.Наименование", {
    name: "Наименование",
    item: item("Наименование"),
  })
  g.ensureEdge(
    "comp:Контрагенты:Наименование",
    "Справочник.Контрагенты",
    "Справочник.Контрагенты.Наименование",
    { yaml: "Реквизит", name: "Реквизит", kind: "composition" },
  )

  // Табличная часть Адреса
  g.ensureNode("Справочник.Контрагенты.Адреса", { name: "Адреса", item: item("Адреса") })
  g.ensureEdge(
    "comp:Контрагенты:Адреса",
    "Справочник.Контрагенты",
    "Справочник.Контрагенты.Адреса",
    { yaml: "ТабличнаяЧасть", name: "ТабличнаяЧасть", kind: "composition" },
  )
  g.ensureNode("Справочник.Контрагенты.Адреса.Город", {
    name: "Город",
    item: item("Город"),
  })
  g.ensureEdge(
    "comp:Адреса:Город",
    "Справочник.Контрагенты.Адреса",
    "Справочник.Контрагенты.Адреса.Город",
    { yaml: "Реквизит", name: "Реквизит", kind: "composition" },
  )

  // Договоры
  g.ensureNode("Справочник.Договоры", { name: "Договоры", item: item("Договоры") })
  g.ensureNode("Справочник.Договоры.Номер", { name: "Номер", item: item("Номер") })
  g.ensureEdge(
    "comp:Договоры:Номер",
    "Справочник.Договоры",
    "Справочник.Договоры.Номер",
    { yaml: "Реквизит", name: "Реквизит", kind: "composition" },
  )

  // Заглушка (нет item)
  g.ensureNode("Справочник.УдалённыйСправочник", { name: "УдалённыйСправочник" })

  // Reference-рёбра
  g.ensureEdge(
    "ref:Контрагент:Контрагенты",
    "Справочник.Заказы.Контрагент",
    "Справочник.Контрагенты",
    { yaml: "Тип", name: "Тип", kind: "reference" },
  )
  g.ensureEdge(
    "ref:СоставнойТип:Контрагенты",
    "Справочник.Заказы.СоставнойТип",
    "Справочник.Контрагенты",
    { yaml: "Тип", name: "Тип", kind: "reference" },
  )
  g.ensureEdge(
    "ref:СоставнойТип:Договоры",
    "Справочник.Заказы.СоставнойТип",
    "Справочник.Договоры",
    { yaml: "Тип", name: "Тип", kind: "reference" },
  )
  g.ensureEdge(
    "ref:УдалённыйТип:УдалённыйСправочник",
    "Справочник.Заказы.УдалённыйТип",
    "Справочник.УдалённыйСправочник",
    { yaml: "Тип", name: "Тип", kind: "reference" },
  )

  return g
}

describe("parsePathSegments", () => {
  it("один сегмент без индекса", () => {
    expect(parsePathSegments("Контрагент")).toEqual([{ name: "Контрагент", hasIndex: false }])
  })

  it("один сегмент с индексом", () => {
    expect(parsePathSegments("Строки[0]")).toEqual([{ name: "Строки", hasIndex: true }])
  })

  it("составной путь без индексов", () => {
    expect(parsePathSegments("Контрагент.Наименование")).toEqual([
      { name: "Контрагент", hasIndex: false },
      { name: "Наименование", hasIndex: false },
    ])
  })

  it("составной путь с индексом в середине", () => {
    expect(parsePathSegments("Строки[1].Количество")).toEqual([
      { name: "Строки", hasIndex: true },
      { name: "Количество", hasIndex: false },
    ])
  })

  it("пустая строка возвращает пустой массив", () => {
    expect(parsePathSegments("")).toEqual([])
  })
})

describe("walkPath — простые пути", () => {
  it("пустые сегменты возвращают startNodes как есть", () => {
    const g = buildGraph()
    const result = walkPath(g, ["Справочник.Заказы"], [])
    expect(result.nodes).toEqual(["Справочник.Заказы"])
    expect(result.errors).toHaveLength(0)
  })

  it("один сегмент с ссылочным типом → возвращает целевой тип", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Контрагент")
    expect(result.nodes).toEqual(["Справочник.Контрагенты"])
    expect(result.errors).toHaveLength(0)
  })

  it("один сегмент без ссылочного типа (примитив) → возвращает узел реквизита", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Сумма")
    expect(result.nodes).toEqual(["Справочник.Заказы.Сумма"])
    expect(result.errors).toHaveLength(0)
  })

  it("несуществующий сегмент → ошибка not_found", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "НесуществующийРеквизит")
    expect(result.nodes).toEqual([])
    expect(result.errors).toEqual([
      {
        kind: "not_found",
        segment: "НесуществующийРеквизит",
        atNodes: ["Справочник.Заказы"],
      },
    ])
  })
})

describe("walkPath — составные пути", () => {
  it("два сегмента через объект с ссылочным типом", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Контрагент.Наименование")
    expect(result.nodes).toEqual(["Справочник.Контрагенты.Наименование"])
    expect(result.errors).toHaveLength(0)
  })

  it("три сегмента через два объекта", () => {
    // Заказы.Контрагент → Контрагенты.Адреса[0].Город
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Контрагент.Адреса[0].Город")
    expect(result.nodes).toEqual(["Справочник.Контрагенты.Адреса.Город"])
    expect(result.errors).toHaveLength(0)
  })

  it("ошибка на промежуточном сегменте прерывает путь", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Контрагент.НесуществующийРеквизит.Город")
    expect(result.nodes).toEqual([])
    expect(result.errors[0]).toMatchObject({
      kind: "not_found",
      segment: "НесуществующийРеквизит",
    })
  })
})

describe("walkPath — union-семантика составных типов", () => {
  it("один сегмент с union-типом → возвращает оба целевых типа", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "СоставнойТип")
    expect(result.nodes).toHaveLength(2)
    expect(result.nodes).toContain("Справочник.Контрагенты")
    expect(result.nodes).toContain("Справочник.Договоры")
    expect(result.errors).toHaveLength(0)
  })

  it("составной путь через union — собирает атрибуты из обоих типов", () => {
    // Контрагенты.Наименование + Договоры.Номер — ищем в обоих
    const g = buildGraph()
    // Наименование есть в Контрагенты, нет в Договоры
    const resultНаименование = walk(g, ["Справочник.Заказы"], "СоставнойТип.Наименование")
    expect(resultНаименование.nodes).toEqual(["Справочник.Контрагенты.Наименование"])
    expect(resultНаименование.errors).toHaveLength(1) // not_found в Договоры

    // Номер есть в Договоры, нет в Контрагенты
    const resultНомер = walk(g, ["Справочник.Заказы"], "СоставнойТип.Номер")
    expect(resultНомер.nodes).toEqual(["Справочник.Договоры.Номер"])
    expect(resultНомер.errors).toHaveLength(1) // not_found в Контрагенты
  })

  it("дедупликация: один и тот же целевой тип не дублируется", () => {
    // Два реквизита, оба ссылаются на одного и того же Контрагенты
    const g = buildGraph()
    const result = walkPath(g, ["Справочник.Контрагенты", "Справочник.Контрагенты"], [])
    expect(new Set(result.nodes).size).toBe(result.nodes.length) // без дублей
  })
})

describe("walkPath — индексация [N]", () => {
  it("[N] на ТабличнаяЧасть — валидно, возвращает узел таблицы", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Строки[0]")
    expect(result.nodes).toEqual(["Справочник.Заказы.Строки"])
    expect(result.errors).toHaveLength(0)
  })

  it("[N] на ТабличнаяЧасть + следующий сегмент → атрибут табличной части", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Строки[0].Количество")
    expect(result.nodes).toEqual(["Справочник.Заказы.Строки.Количество"])
    expect(result.errors).toHaveLength(0)
  })

  it("[N] на Реквизит (не табличная часть) → ошибка invalid_index", () => {
    const g = buildGraph()
    const result = walk(g, ["Справочник.Заказы"], "Сумма[0]")
    expect(result.nodes).toEqual([])
    expect(result.errors).toEqual([
      {
        kind: "invalid_index",
        segment: "Сумма",
        atNodes: ["Справочник.Заказы.Сумма"],
      },
    ])
  })
})

describe("walkPath — узлы-заглушки", () => {
  it("заглушка как стартовый узел → ошибка stub_node, nodes пусто", () => {
    const g = buildGraph()
    // УдалённыйСправочник — заглушка без item
    const result = walk(g, ["Справочник.УдалённыйСправочник"], "Наименование")
    expect(result.nodes).toEqual([])
    expect(result.errors).toEqual([
      {
        kind: "stub_node",
        segment: "Наименование",
        atNodes: ["Справочник.УдалённыйСправочник"],
      },
    ])
  })

  it("путь через реквизит, тип которого является заглушкой → stub_node на следующем сегменте", () => {
    const g = buildGraph()
    // Заказы.УдалённыйТип → Справочник.УдалённыйСправочник (заглушка)
    // Пытаемся зайти дальше: .НесуществующийРеквизит
    const result = walk(g, ["Справочник.Заказы"], "УдалённыйТип.НесуществующийРеквизит")
    expect(result.nodes).toEqual([])
    expect(result.errors).toEqual([
      {
        kind: "stub_node",
        segment: "НесуществующийРеквизит",
        atNodes: ["Справочник.УдалённыйСправочник"],
      },
    ])
  })
})
