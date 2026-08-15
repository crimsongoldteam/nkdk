import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString } from "./explicitString"
import { parseWithJsYaml } from "./jsYamlParser"
import {
  copyYAMLScalarTags,
  xmlAnomalyTagPayload,
  xmlAnomalyTagValue,
  yamlScalarTagAt,
} from "./scalarTags"
import { copyYAMLMappingTag, yamlMappingTagOf } from "./mappingTags"

describe("parseWithJsYaml", () => {
  it.each([
    ["Поле: !проверять Значение", "проверять", "Значение"],
    ["Поле: !изменять 12", "изменять", 12],
    ["Поле: !изменять", "изменять", {}],
  ] as const)("разбирает режим свойства: %s", (source, tag, value) => {
    const parsed = parseWithJsYaml(source)

    expect(parsed.syntaxErrors).toEqual([])
    expect((parsed.data as Record<string, unknown>).Поле).toEqual(value)
    expect(yamlScalarTagAt(parsed.data, "Поле")).toBe(tag)
  })

  it("сохраняет режимы частей составного типа", () => {
    const parsed = parseWithJsYaml("Тип:\n  - !проверять Дата\n  - !изменять Булево")
    const types = (parsed.data as { Тип: unknown[] }).Тип

    expect(parsed.syntaxErrors).toEqual([])
    expect(types).toEqual(["Дата", "Булево"])
    expect(yamlScalarTagAt(types, 0)).toBe("проверять")
    expect(yamlScalarTagAt(types, 1)).toBe("изменять")
  })

  it.each([
    ["present без payload", "Поле: !xml/present", "!xml/present", "xml/present"],
    ["absent без payload", "Поле: !xml/absent", "!xml/absent", "xml/absent"],
    ["name с payload", "Поле: !xml/name СтароеИмя", "!xml/name СтароеИмя", "xml/name"],
    ["type с payload", "Поле: !xml/type d7p1:Диаграмма", "!xml/type d7p1:Диаграмма", "xml/type"],
    ["value с payload", "Поле: !xml/value Nil", "!xml/value Nil", "xml/value"],
    ["language с payload", "Поле: !xml/language Buttons", "!xml/language Buttons", "xml/language"],
    ["duplicate с payload", "Поле: !xml/duplicate Группа", "!xml/duplicate Группа", "xml/duplicate"],
    [
      "reference с payload",
      "Поле: !xml/reference 00000000-0000-0000-0000-000000000000",
      "!xml/reference 00000000-0000-0000-0000-000000000000",
      "xml/reference",
    ],
    ["пустое значение", "Поле:", {}, undefined],
    ["явная пустая строка", 'Поле: ""', "", undefined],
  ] as const)("различает %s", (_name, text, value, tag) => {
    const parsed = parseWithJsYaml(text)

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Поле: value })
    expect(yamlScalarTagAt(parsed.data, "Поле")).toBe(tag)
  })

  it.each([
    ["xml/present", "", "!xml/present"],
    ["xml/name", "ФункцииExtendedTooltip", "!xml/name ФункцииExtendedTooltip"],
    ["xml/reference", "Справочник.Товары.ПустаяСсылка", "!xml/reference Справочник.Товары.ПустаяСсылка"],
  ] as const)("упаковывает и распаковывает payload %s", (tag, payload, stored) => {
    expect(xmlAnomalyTagValue(tag, payload)).toBe(stored)
    expect(xmlAnomalyTagPayload(tag, stored)).toBe(payload)
  })

  it("копирует точную категорию XML-аномалии", () => {
    const source = { Поле: "!xml/value Nil" }
    const parsed = parseWithJsYaml("Поле: !xml/value Nil")
    const target = { ...source }

    copyYAMLScalarTags(parsed.data as object, target)

    expect(yamlScalarTagAt(target, "Поле")).toBe("xml/value")
  })

  it("отклоняет старый неклассифицированный тег !xml", () => {
    const parsed = parseWithJsYaml("Поле: !xml Текст")

    expect(parsed.data).toEqual({})
    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0]?.message).toContain("unknown scalar tag")
  })

  it("сохраняет тег нарушения порядка на mapping", () => {
    const parsed = parseWithJsYaml("Заголовок: !xml/order\n  en: Text\n  ru: Текст\n")
    const title = (parsed.data as { Заголовок: Record<string, string> }).Заголовок
    const copied = { ...title }

    copyYAMLMappingTag(title, copied)

    expect(parsed.syntaxErrors).toEqual([])
    expect(title).toEqual({ en: "Text", ru: "Текст" })
    expect(yamlMappingTagOf(title)).toBe("xml/order")
    expect(yamlMappingTagOf(copied)).toBe("xml/order")
  })

  it.each([
    "Заголовок: !xml/order payload",
    "Заголовок: !xml/order\n  - Text",
  ])("отклоняет !xml/order вне mapping: %s", (source) => {
    const parsed = parseWithJsYaml(source)

    expect(parsed.syntaxErrors).toHaveLength(1)
  })

  it("parses data and exposes location index", () => {
    const parsed = parseWithJsYaml("Имя: Тест\nРеквизиты:\n  - Имя: Первый\n")

    expect(parsed.data).toEqual({ Имя: "Тест", Реквизиты: [{ Имя: "Первый" }] })
    expect(parsed.locations.keyPosition(["Реквизиты", 0, "Имя"])).toEqual({ line: 3, col: 5 })
    expect(parsed.syntaxErrors).toEqual([])
  })

  it("returns syntax diagnostics for invalid yaml", () => {
    const parsed = parseWithJsYaml("Имя: [")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0]).toMatchObject({ line: 1, col: 6 })
  })

  it("normalizes EOF diagnostics to the unterminated flow collection", () => {
    const parsed = parseWithJsYaml("Имя: [")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0]).toMatchObject({
      line: 1,
      col: 6,
      message: expect.stringContaining("unexpected end"),
    })
  })

  it("keeps direct mark diagnostics when the parser points into an existing line", () => {
    const parsed = parseWithJsYaml("Имя: Тест\n  ЛишнийОтступ: 1\n")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.syntaxErrors[0].line).toBeGreaterThanOrEqual(1)
    expect(parsed.syntaxErrors[0].col).toBeGreaterThanOrEqual(1)
  })

  it("разбирает пустой документ как пустой объект без синтаксических ошибок", () => {
    const parsed = parseWithJsYaml("")

    expect(parsed.data).toEqual({})
    expect(parsed.syntaxErrors).toEqual([])
  })

  it("разбирает пустой элемент последовательности как пустой объект", () => {
    const parsed = parseWithJsYaml("Элементы:\n  -")

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Элементы: [{}] })
  })
})

describe("parseMetadataYaml", () => {
  it("does not expose yaml AST compatibility fields", async () => {
    const { parseMetadataYaml } = await import("./parseMetadataYaml")
    const parsed = parseMetadataYaml("Имя: Тест\n")

    expect("doc" in parsed).toBe(false)
    expect("lineCounter" in parsed).toBe(false)
    expect(parsed.data).toEqual({ Имя: "Тест" })
  })

  it("parses data without location index for prepared YAML workers", async () => {
    const { parseMetadataYamlData } = await import("./parseMetadataYaml")
    const parsed = parseMetadataYamlData(["Имя: Тест", "Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n"))

    expect(parsed.data).toEqual({ Имя: "Тест", Реквизиты: { Артикул: { Тип: "Строка" } } })
    expect(parsed.syntaxErrors).toEqual([])
    expect("locations" in parsed).toBe(false)
    expect("text" in parsed).toBe(false)
  })

  it("preserves double-quoted scalar semantics for prepared YAML workers", async () => {
    const { parseMetadataYamlData } = await import("./parseMetadataYaml")
    const parsed = parseMetadataYamlData('Отбор.Код: "456"')
    const data = parsed.data as Record<string, unknown>

    expect(asExplicitYAMLStringIfMarked(data, "Отбор.Код", data["Отбор.Код"])).toEqual(
      explicitYAMLString("456")
    )
  })
})
