import { describe, expect, it } from "vitest"
import { topLevelGraphImportSpecs } from "./registerTopLevelGraphImports"

describe("topLevelGraphImportSpecs", () => {
  it("экспортирует каталоги всех верхнеуровневых регистраций графа", () => {
    expect(topLevelGraphImportSpecs.map((spec) => spec.dir)).toEqual([
      "Справочник",
      "Документ",
      "Перечисление",
      "Обработка",
      "ЖурналДокументов",
      "HTTPСервис",
      "РегистрСведений",
      "РегистрНакопления",
      "ПланОбмена",
    ])
  })

  it("содержит rule для каждого зарегистрированного kind", () => {
    expect(
      topLevelGraphImportSpecs.map((spec) => ({
        kind: spec.kind,
        itemType: spec.rule.itemType,
        prefix: spec.rule.itemTypePrefix,
      })),
    ).toContainEqual({
      kind: "dataProcessor",
      itemType: "MetadataDataProcessor",
      prefix: "Обработка",
    })
  })
})
