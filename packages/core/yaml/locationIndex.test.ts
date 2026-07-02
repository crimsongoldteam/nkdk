import { describe, expect, it } from "vitest"
import { buildYamlLocationIndex } from "./locationIndex"

describe("buildYamlLocationIndex", () => {
  const yaml = [
    "Имя: Тест",
    "Реквизиты:",
    "  - Имя: Первый",
    "    Тип: Строка",
    "  - Имя: Второй",
    "    Тип: Число",
    "Настройки:",
    "  Группа:",
    "    Поле: Значение",
    "Описание: |",
    "  первая строка",
    "  вторая строка",
  ].join("\n")

  it("finds map key positions", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.keyPosition(["Реквизиты"])).toEqual({ line: 2, col: 1 })
    expect(index.keyPosition(["Настройки", "Группа", "Поле"])).toEqual({ line: 9, col: 5 })
  })

  it("finds sequence item and nested key positions", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.nodePosition(["Реквизиты", 1])).toEqual({ line: 5, col: 5 })
    expect(index.keyPosition(["Реквизиты", 1, "Тип"])).toEqual({ line: 6, col: 5 })
  })

  it("finds scalar value positions", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.valuePosition(["Имя"])).toEqual({ line: 1, col: 6 })
    expect(index.valuePosition(["Описание"])).toEqual({ line: 10, col: 11 })
  })

  it("returns undefined for missing paths", () => {
    const index = buildYamlLocationIndex(yaml)

    expect(index.keyPosition(["Реквизиты", 10, "Тип"])).toBeUndefined()
    expect(index.valuePosition(["Нет"])).toBeUndefined()
  })

  it("finds quoted keys and empty values", () => {
    const index = buildYamlLocationIndex('"Ключ:СДвоеточием":\n  Вложенный: Значение\nПустое:\n')

    expect(index.keyPosition(["Ключ:СДвоеточием"])).toEqual({ line: 1, col: 1 })
    expect(index.keyPosition(["Ключ:СДвоеточием", "Вложенный"])).toEqual({ line: 2, col: 3 })
    expect(index.valuePosition(["Пустое"])).toBeUndefined()
  })

  it("keeps duplicate key occurrences", () => {
    const index = buildYamlLocationIndex(["Поле: Один", "Поле: Два", "Группа:", "  Поле: Три"].join("\n"))

    expect(index.keyOccurrences(["Поле"])).toEqual([
      { line: 1, col: 1 },
      { line: 2, col: 1 },
    ])
    expect(index.keyOccurrences(["Группа", "Поле"])).toEqual([{ line: 4, col: 3 }])
  })

  it("does not treat scalar sequence values with colon as mapping keys", () => {
    const index = buildYamlLocationIndex(["Ссылки:", "  - http://example.com", "  - urn:value"].join("\n"))

    expect(index.nodePosition(["Ссылки", 0])).toEqual({ line: 2, col: 5 })
    expect(index.nodePosition(["Ссылки", 1])).toEqual({ line: 3, col: 5 })
    expect(index.keyPosition(["Ссылки", 0, "http"])).toBeUndefined()
    expect(index.keyPosition(["Ссылки", 1, "urn"])).toBeUndefined()
  })

  it("finds duplicate key occurrences without AST fallback", () => {
    const index = buildYamlLocationIndex(["Реквизиты:", "  Имя: Один", "  Имя: Два"].join("\n"))

    expect(index.keyOccurrences(["Реквизиты", "Имя"])).toEqual([
      { line: 2, col: 3 },
      { line: 3, col: 3 },
    ])
  })

  it("keeps sibling keys of sequence mappings outside the previous block value", () => {
    const index = buildYamlLocationIndex(
      [
        "Элементы:",
        "  - Поля:",
        "      - Состояние",
        "    Оформление:",
        "      ЦветТекста:",
        "      Заголовок: \"\"",
      ].join("\n"),
    )

    expect(index.keyPosition(["Элементы", 0, "Оформление"])).toEqual({ line: 4, col: 5 })
    expect(index.keyPosition(["Элементы", 0, "Оформление", "ЦветТекста"])).toEqual({ line: 5, col: 7 })
    expect(index.valuePosition(["Элементы", 0, "Оформление", "ЦветТекста"])).toBeUndefined()
    expect(index.valuePosition(["Элементы", 0, "Оформление", "Заголовок"])).toEqual({ line: 6, col: 18 })
  })
})
