import { describe, expect, it } from "vitest"
import { buildConfigurationChildObjectsFromProjectEntries, STANDARD_CHILD_OBJECT_TYPE_ORDER } from "./childObjects"

describe("Configuration ChildObjects", () => {
  it("строит канонический порядок имён до применения порядка из снимка", () => {
    const result = buildConfigurationChildObjectsFromProjectEntries({
      entries: ["НовыйЯ", "НовыйА", "ПримерСправочник", "ПодчиненныйСправочник", "НовыйА"]
        .map(name => ({ dir: "Справочник", name })),
    })
    expect(result.Catalog).toEqual(["НовыйА", "НовыйЯ", "ПодчиненныйСправочник", "ПримерСправочник"])
  })

  it("использует стандартный порядок типов и только выбранные объекты проекта", () => {
    const result = buildConfigurationChildObjectsFromProjectEntries({ entries: [
      { dir: "Документ", name: "Документ1" },
      { dir: "Обработка", name: "Обработка1" },
      { dir: "Справочник", name: "Справочник1" },
      { dir: "Язык", name: "Русский" },
      { dir: "", name: "НеОбъект" },
      { dir: "Роль", name: "" },
    ] })
    expect(Object.keys(result)).toEqual(["Language", "Catalog", "Document", "DataProcessor"])
    expect(result).toEqual({ Language: "Русский", Catalog: "Справочник1", Document: "Документ1", DataProcessor: "Обработка1" })
  })

  it("содержит unsupported-типы в стандартном порядке для будущей поддержки", () => {
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER).toEqual(expect.arrayContaining([
      "CommonModule", "XDTOPackage", "ExternalDataSource", "WebSocketClient",
    ]))
  })

  it("ставит WebSocketClient между WSReference и EventSubscription", () => {
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WSReference")).toBeLessThan(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WebSocketClient"))
    expect(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("WebSocketClient")).toBeLessThan(STANDARD_CHILD_OBJECT_TYPE_ORDER.indexOf("EventSubscription"))
  })
})
