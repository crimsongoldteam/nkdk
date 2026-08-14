import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString } from "./explicitString"
import { exportToYAML, serializeYAMLDocument } from "./export"
import { importFromYAML } from "./import"
import { parseWithJsYaml } from "./jsYamlParser"
import { parseMetadataYaml } from "./parseMetadataYaml"
import { markYAMLScalarTag, xmlAnomalyTagPayload, yamlScalarTagAt } from "./scalarTags"

describe("exportToYAML", () => {
  it.each([
    ["пустое значение", {}, "Нумератор: !изменять"],
    ["строка", "Авто", "Нумератор: !изменять Авто"],
    ["число", 12, "Нумератор: !изменять 12"],
  ] as const)("сериализует режим свойства: %s", (_name, value, expected) => {
    const source = { Нумератор: value }
    markYAMLScalarTag(source, "Нумератор", "изменять")

    const yaml = exportToYAML(source)
    const reparsed = parseMetadataYaml(yaml)

    expect(yaml).toBe(expected)
    expect(reparsed.data).toEqual(source)
    expect(yamlScalarTagAt(reparsed.data, "Нумератор")).toBe("изменять")
  })

  it("сериализует режимы элементов массива", () => {
    const source = { Тип: ["Дата", "Булево"] }
    markYAMLScalarTag(source.Тип, 0, "проверять")
    markYAMLScalarTag(source.Тип, 1, "изменять")

    const yaml = exportToYAML(source)
    const reparsed = parseMetadataYaml(yaml)
    const types = (reparsed.data as { Тип: unknown[] }).Тип

    expect(yaml).toBe("Тип:\n  - !проверять Дата\n  - !изменять Булево")
    expect(types).toEqual(source.Тип)
    expect(yamlScalarTagAt(types, 0)).toBe("проверять")
    expect(yamlScalarTagAt(types, 1)).toBe("изменять")
  })

  it.each([
    ["корень", {}, ""],
    ["свойство", { Поле: {} }, "Поле:"],
    ["вложенное свойство", { Внешний: { Поле: {} } }, "Внешний:\n  Поле:"],
    ["элемент последовательности", { Элементы: [{}] }, "Элементы:\n  -"],
  ] as const)("выводит пустой объект как пустое YAML-значение: %s", (_name, source, expected) => {
    const serialized = serializeYAMLDocument(source)

    expect(serialized.text).toBe(expected)
    expect(serialized.text).not.toContain("{}")
    expect(serialized.data).toEqual(source)
    expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
  })

  it.each([
    ["явная строка", { Значение: explicitYAMLString("001") }],
    ["пустая строка", { Значение: explicitYAMLString("") }],
    ["undefined в объекте", { Значение: undefined }],
    ["undefined в массиве", { Значения: [undefined] }],
    ["вложенное значение", { Внешний: { Значение: explicitYAMLString("456") } }],
  ] as const)("строит смысловые данные как штатный parser: %s", (_name, source) => {
    const serialized = serializeYAMLDocument(source)

    expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
  })

  it.each([
    ["xml/present", "!xml/present", "Значение: !xml/present"],
    ["xml/absent", "!xml/absent", "Значение: !xml/absent"],
    ["xml/name", "!xml/name ФункцииExtendedTooltip", "Значение: !xml/name ФункцииExtendedTooltip"],
    ["xml/type", "!xml/type d7p1:Диаграмма", "Значение: !xml/type d7p1:Диаграмма"],
    ["xml/value", "!xml/value Nil", "Значение: !xml/value Nil"],
    [
      "xml/reference",
      "!xml/reference 00000000-0000-0000-0000-000000000000",
      "Значение: !xml/reference 00000000-0000-0000-0000-000000000000",
    ],
  ] as const)("сериализует классифицированную XML-аномалию %s", (tag, value, expected) => {
    const source = { Значение: value }
    markYAMLScalarTag(source, "Значение", tag)

    const serialized = serializeYAMLDocument(source)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe(expected)
    expect(serialized.data).toEqual(source)
    expect(yamlScalarTagAt(serialized.data, "Значение")).toBe(tag)
    expect(reparsed.data).toEqual(source)
    expect(yamlScalarTagAt(reparsed.data, "Значение")).toBe(tag)
  })

  it("сохраняет payload классифицированного тега", () => {
    const parsed = parseMetadataYaml("Комментарий: !xml/value Текст")
    const data = parsed.data as { Комментарий: string }

    expect(exportToYAML(data)).toBe("Комментарий: !xml/value Текст")
    expect(data).toEqual({ Комментарий: "!xml/value Текст" })
    expect(xmlAnomalyTagPayload("xml/value", data.Комментарий)).toBe("Текст")
  })

  it("preserves explicit string style in serialized semantic data", () => {
    const serialized = serializeYAMLDocument({ Внешний: { Значение: explicitYAMLString("001") } })
    const outer = (serialized.data as { Внешний: { Значение: string } }).Внешний

    expect(asExplicitYAMLStringIfMarked(outer, "Значение", outer.Значение)).toEqual(explicitYAMLString("001"))
  })

  it("preserves a classified local xml tag across parse and export", () => {
    const parsed = parseWithJsYaml("Поле: !xml/value Авто")

    expect(exportToYAML(parsed.data)).toBe("Поле: !xml/value Авто")
  })

  it("preserves newline-only block scalar values", () => {
    const yaml = exportToYAML({ Пояснение: "\n" })

    expect(importFromYAML<{ Пояснение: string }>(yaml)).toEqual({ Пояснение: "\n" })
    expect(yaml).toContain("Пояснение: |+")
  })

  it("preserves trailing line endings inside block scalar values", () => {
    const value = "Текст\n\n"
    const yaml = exportToYAML({ Пояснение: value })

    expect(importFromYAML<{ Пояснение: string }>(yaml)).toEqual({ Пояснение: value })
  })

  it("does not add a service newline for multiline scalar values without trailing blank line", () => {
    expect(exportToYAML({ k: "a\nb" }).endsWith("\n")).toBe(false)
  })

  it("does not treat plain scalar endings as block scalar headers", () => {
    for (const value of ["some |+", "some >+", "some |+2", "some |2+"]) {
      expect(exportToYAML({ k: value }).endsWith("\n")).toBe(false)
    }
  })

  it("does not add a service newline for ordinary YAML documents", () => {
    expect(exportToYAML({ Имя: "Тест" }).endsWith("\n")).toBe(false)
  })

  it("prints explicit YAML strings as double-quoted scalars", () => {
    const yaml = exportToYAML({ "Отбор.Код": explicitYAMLString("456") })

    expect(yaml).toBe('Отбор.Код: "456"')
  })

  it("exports explicit YAML strings with double quotes", () => {
    expect(exportToYAML({ Значение: explicitYAMLString("001") })).toBe('Значение: "001"')
  })

  it("escapes explicit YAML string content through double-quoted scalar rules", () => {
    const yaml = exportToYAML({ Значение: explicitYAMLString('a"b') })

    expect(yaml).toBe('Значение: "a\\"b"')
  })

  it("does not force ordinary strings into double quotes", () => {
    const yaml = exportToYAML({ Имя: "Тест" })

    expect(yaml).toBe("Имя: Тест")
  })

  it("prints quoted ordinary strings with double quotes", () => {
    const yaml = exportToYAML({
      en: "Remote access: Message exchange",
      escaped: `Quoted 'value'`,
    })

    expect(yaml).toBe(`en: "Remote access: Message exchange"\nescaped: Quoted 'value'`)
  })

  it("exports without document final line ending", () => {
    expect(exportToYAML({ Имя: "Тест" })).toBe("Имя: Тест")
  })

  it("exports undefined as empty value", () => {
    expect(exportToYAML({ Поле: undefined })).toBe("Поле:")
  })

  it("distinguishes null from an undefined value", () => {
    expect(exportToYAML({ Явное: null, Отсутствует: undefined })).toBe("Явное: null\nОтсутствует:")
  })

  it("exports empty and numeric-looking strings as double-quoted scalars", () => {
    expect(exportToYAML({ Пусто: "", Код: "000000001" })).toBe('Пусто: ""\nКод: "000000001"')
  })

  it("does not wrap long scalar lines", () => {
    const longValue = "x".repeat(160)
    expect(exportToYAML({ Поле: longValue })).toBe(`Поле: ${longValue}`)
  })

  it("не принимает окончание обычной строки за пустое отображение", () => {
    expect(exportToYAML({ Поле: "Текст {}" })).toBe("Поле: Текст {}")
  })
})
