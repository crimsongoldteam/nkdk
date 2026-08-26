import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString } from "./explicitString"
import { serializeYAMLDocument } from "./export"
import { parseWithJsYaml } from "./jsYamlParser"
import { yamlScalarTagAt } from "./scalarTags"

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

  it("разбирает !xml/string как строку и сохраняет скалярный тег", () => {
    const parsed = parseWithJsYaml("Представление: !xml/string Текст")

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Представление: "Текст" })
    expect(yamlScalarTagAt(parsed.data, "Представление")).toBe("xml/string")
  })

  it.each([
    "Представление: !xml/string { ru: Текст }",
    "Представление: !xml/string [Текст]",
  ])("отклоняет нескалярный payload !xml/string: %s", (source) => {
    expect(parseWithJsYaml(source).syntaxErrors).toHaveLength(1)
  })

  it.each([
    "Поле: !xml Текст",
    "Поле: !xml/present",
    "Поле: !xml/absent",
    "Поле: !xml/name СтароеИмя",
    "Поле: !xml/type d7p1:Диаграмма",
    "Поле: !xml/value Nil",
    "Поле: !xml/reference uuid",
    "Поле: !xml/language Buttons",
    "Поле: !xml/duplicate Группа",
    "Заголовок: !xml/order\n  en: Text",
  ])("отклоняет прежний тег XML-аномалии: %s", (source) => {
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

  it.each(["invalid", "important"] as const)(
    "сохраняет строку из пробелов под !xml/%s",
    (kind) => {
      const parsed = parseWithJsYaml(`Значение: !xml/${kind} "         "`)

      expect(parsed.syntaxErrors).toEqual([])
      expect(parsed.data).toEqual({ Значение: "         " })
    },
  )

  it("разбирает пустой элемент последовательности как пустой объект", () => {
    const parsed = parseWithJsYaml("Элементы:\n  -")

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Элементы: [{}] })
  })

  it("возвращает таблицу XML-аннотаций вместе с данными", () => {
    const parsed = parseWithJsYaml("Значение: !xml/important true")

    expect(parsed.annotations.at(parsed.data as object, "Значение")).toEqual({
      kind: "important",
      occurrence: 1,
      target: "value",
    })
  })

  it.each([
    ["без кавычек", "!xml/invalid Код:\n  Значение: null", "Код"],
    ["в двойных кавычках", '!xml/invalid "Код":\n  Значение: null', "Код"],
    ["в одинарных кавычках", "!xml/invalid 'Код':\n  Значение: null", "Код"],
    ["с YAML-escape", '!xml/invalid "\\x41":\n  Значение: null', "A"],
  ])("сохраняет явный null под аннотированным ключом %s", (_name, source, logicalKey) => {
    const parsed = parseWithJsYaml(source)
    const data = parsed.data as Record<string, { Значение: unknown }>
    const runtimeKey = Object.keys(data)[0]!

    expect(parsed.syntaxErrors).toEqual([])
    expect(data[runtimeKey]).toEqual({ Значение: null })
    expect(parsed.annotations.keyAt(data, runtimeKey)).toMatchObject({
      kind: "invalid",
      logicalKey,
    })
    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).not.toContain("__NKDK_XML_ANOMALY_KEY_")
  })

  it("сохраняет аннотированный ключ после alias-значения", () => {
    const parsed = parseWithJsYaml([
      "base: &b",
      "  Имя: Основа",
      "copy: *b",
      '!xml/invalid "\\x41":',
      "  Значение: null",
    ].join("\n"))
    const data = parsed.data as Record<string, unknown>
    const runtimeKey = Object.keys(data).find((key) => parsed.annotations.keyAt(data, key) !== undefined)!

    expect(parsed.syntaxErrors).toEqual([])
    expect(data.copy).toEqual({ Имя: "Основа" })
    expect(data[runtimeKey]).toEqual({ Значение: null })
    expect(parsed.annotations.keyAt(data, runtimeKey)).toEqual({
      kind: "invalid",
      occurrence: 1,
      target: "key",
      logicalKey: "A",
    })
    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).not.toContain("__NKDK_XML_ANOMALY_KEY_")
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
