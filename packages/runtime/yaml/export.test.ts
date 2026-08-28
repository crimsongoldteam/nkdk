import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString } from "./explicitString"
import { exportToYAML, serializeYAMLDocument } from "./export"
import { importFromYAML } from "./import"
import { parseMetadataYaml } from "./parseMetadataYaml"
import { markYAMLScalarTag, markYAMLValueTag, yamlScalarTagAt } from "./scalarTags"
import { createXmlAnomalyAnnotations, xmlAnnotatedMappingEntries } from "./xmlAnomalyAnnotations"

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

  it("сериализует режимы составных значений после двоеточия", () => {
    const source = {
      Объект: { Поле: "Значение" },
      Список: ["Первый", "Второй"],
    }
    markYAMLScalarTag(source, "Объект", "проверять")
    markYAMLScalarTag(source, "Список", "изменять")

    const yaml = exportToYAML(source)
    const reparsed = parseMetadataYaml(yaml)

    expect(yaml).toBe([
      "Объект: !проверять",
      "  Поле: Значение",
      "Список: !изменять",
      "  - Первый",
      "  - Второй",
    ].join("\n"))
    expect(reparsed.data).toEqual(source)
    expect(yamlScalarTagAt(reparsed.data, "Объект")).toBe("проверять")
    expect(yamlScalarTagAt(reparsed.data, "Список")).toBe("изменять")
  })

  it("сериализует временную метку составного значения после включения в родителя", () => {
    const item = { Код: "000000001" }
    markYAMLValueTag(item, "проверять")

    const yaml = exportToYAML({ Элемент: item })
    const reparsed = parseMetadataYaml(yaml)

    expect(yaml).toBe("Элемент: !проверять\n  Код: \"000000001\"")
    expect(yamlScalarTagAt(reparsed.data, "Элемент")).toBe("проверять")
  })

  it("сериализует и повторно разбирает !xml/string", () => {
    const source = { Представление: "Текст" }
    markYAMLScalarTag(source, "Представление", "xml/string")

    const serialized = serializeYAMLDocument(source)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe("Представление: !xml/string Текст")
    expect(reparsed.data).toEqual(source)
    expect(yamlScalarTagAt(reparsed.data, "Представление")).toBe("xml/string")
  })

  it("сериализует и повторно разбирает пустой !xml/standard-attributes", () => {
    const source = { СтандартныеРеквизиты: undefined }
    markYAMLScalarTag(source, "СтандартныеРеквизиты", "xml/standard-attributes")

    const serialized = serializeYAMLDocument(source)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe("СтандартныеРеквизиты: !xml/standard-attributes")
    expect(reparsed.data).toHaveProperty("СтандартныеРеквизиты")
    expect(yamlScalarTagAt(reparsed.data, "СтандартныеРеквизиты")).toBe("xml/standard-attributes")
  })

  it("отклоняет payload у !xml/standard-attributes", () => {
    expect(() => importFromYAML("СтандартныеРеквизиты: !xml/standard-attributes лишнее"))
      .toThrow("!xml/standard-attributes не принимает значение")
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

  it("preserves explicit string style in serialized semantic data", () => {
    const serialized = serializeYAMLDocument({ Внешний: { Значение: explicitYAMLString("001") } })
    const outer = (serialized.data as { Внешний: { Значение: string } }).Внешний

    expect(asExplicitYAMLStringIfMarked(outer, "Значение", outer.Значение)).toEqual(explicitYAMLString("001"))
  })

  it("сохраняет техническое XML-имя как !xml/name", () => {
    const parsed = parseMetadataYaml("Имя: !xml/name ДеревоПодсистемSearchString")

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Имя: "ДеревоПодсистемSearchString" })
    expect(yamlScalarTagAt(parsed.data, "Имя")).toBe("xml/name")
    expect(serializeYAMLDocument(parsed.data).text)
      .toBe("Имя: !xml/name ДеревоПодсистемSearchString")
  })

  it("сериализует raw как явный контейнер $значение/$xml", () => {
    const data = { Количество: 1, "Properties\\Future": undefined }
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(data, "Количество", {
      kind: "raw",
      occurrence: 1,
      target: "value",
      hasSemanticValue: true,
      xml: { "#text": "01" },
      semantic: { kind: "invalid", occurrence: 1 },
    })
    annotations.set(data, "Properties\\Future", {
      kind: "raw",
      occurrence: 1,
      target: "value",
      hasSemanticValue: false,
      xml: { _mode: "new", "#text": "42" },
    })

    const serialized = serializeYAMLDocument(data, annotations)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe([
      "Количество: !xml/raw",
      "  $значение: !xml/invalid 1",
      "  $xml:",
      '    "#text": "01"',
      "Properties\\Future: !xml/raw",
      "  $xml:",
      "    _mode: new",
      '    "#text": "42"',
    ].join("\n"))
    expect(reparsed.data).toEqual(data)
    expect(reparsed.annotations.at(reparsed.data as object, "Количество")).toEqual(
      annotations.at(data, "Количество"),
    )
  })

  it("сохраняет новые XML-аннотации при повторном разборе", () => {
    const source = [
      "Флаг: !xml/invalid true",
      "Объект: !xml/raw",
      "  $значение: 42",
      "  $xml:",
      "    _future: x",
      "!xml/invalid Код: { Тип: Строка }",
      "!xml/invalid/2 Код: { Тип: Число }",
    ].join("\n")
    const parsed = parseMetadataYaml(source)
    const serialized = serializeYAMLDocument(parsed.data, parsed.annotations)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe([
      "Флаг: !xml/invalid true",
      "Объект: !xml/raw",
      "  $значение: 42",
      "  $xml:",
      "    _future: x",
      "!xml/invalid Код:",
      "  Тип: Строка",
      "!xml/invalid/2 Код:",
      "  Тип: Число",
    ].join("\n"))
    expect(reparsed.data).toEqual(parsed.data)
    expect([...reparsed.annotations.entries()].map(({ annotation }) => annotation)).toEqual(
      [...serialized.annotations.entries()].map(({ annotation }) => annotation),
    )
  })

  it("переносит аннотации корня и последовательности в сериализованные данные", () => {
    const parsed = parseMetadataYaml("!xml/important\nЗначения: !xml/invalid\n  - Первый\n  - Второй")
    const serialized = serializeYAMLDocument(parsed.data, parsed.annotations)
    const data = serialized.data as { Значения: string[] }

    expect(serialized.annotations.root()).toEqual({ kind: "important", occurrence: 1, target: "root" })
    expect(serialized.annotations.at(data, "Значения")).toEqual({ kind: "invalid", occurrence: 1, target: "value" })
    expect(parseMetadataYaml(serialized.text).annotations.root()).toEqual({
      kind: "important",
      occurrence: 1,
      target: "root",
    })
  })

  it.each(["invalid", "important"] as const)(
    "сохраняет !xml/%s и режим скалярного свойства на разных YAML-узлах",
    (kind) => {
    const data = { Ссылка: "Catalog.Товары" }
    markYAMLScalarTag(data, "Ссылка", "проверять")
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(data, "Ссылка", {
      kind,
      occurrence: 1,
      target: "value",
    })

    const serialized = serializeYAMLDocument(data, annotations)
    const reparsed = parseMetadataYaml(serialized.text)
    const runtimeKey = Object.keys(reparsed.data as object)[0]!

    expect(serialized.text).toBe(`!проверять Ссылка: !xml/${kind} Catalog.Товары`)
    expect(reparsed.data).toEqual(data)
    expect(reparsed.annotations.at(reparsed.data as object, runtimeKey)).toMatchObject({
      kind,
      target: "value",
    })
    expect(yamlScalarTagAt(reparsed.data, runtimeKey)).toBe("проверять")
  })

  it("сохраняет raw без смыслового значения и режим свойства", () => {
    const data = { Компактный: undefined }
    markYAMLScalarTag(data, "Компактный", "проверять")
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(data, "Компактный", {
      kind: "raw",
      occurrence: 1,
      target: "value",
      hasSemanticValue: false,
      xml: { "_xsi:nil": "true" },
    })

    const serialized = serializeYAMLDocument(data, annotations)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe("!проверять Компактный: !xml/raw\n  $xml:\n    _xsi:nil: \"true\"")
    expect(reparsed.data).toEqual(data)
    expect(yamlScalarTagAt(reparsed.data, "Компактный")).toBe("проверять")
    expect(reparsed.annotations.at(reparsed.data as object, "Компактный")).toMatchObject({ kind: "raw" })
  })

  it("сохраняет important и режим пустого object-свойства", () => {
    const data = { Объект: {} }
    markYAMLScalarTag(data, "Объект", "изменять")
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(data, "Объект", { kind: "important", occurrence: 1, target: "value" })

    const serialized = serializeYAMLDocument(data, annotations)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe("!изменять Объект: !xml/important {}")
    expect(reparsed.data).toEqual(data)
    expect(yamlScalarTagAt(reparsed.data, "Объект")).toBe("изменять")
    expect(reparsed.annotations.at(reparsed.data as object, "Объект")).toMatchObject({ kind: "important" })
  })

  it("сохраняет аномалию object/sequence и вложенные режимы", () => {
    const data = {
      Объект: { Поле: "value" },
      Список: ["one", "two"],
    }
    markYAMLScalarTag(data.Объект, "Поле", "изменять")
    markYAMLScalarTag(data.Список, 1, "проверять")
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(data, "Объект", { kind: "important", occurrence: 1, target: "value" })
    annotations.set(data, "Список", { kind: "invalid", occurrence: 1, target: "value" })

    const serialized = serializeYAMLDocument(data, annotations)
    const reparsed = parseMetadataYaml(serialized.text)
    const reparsedData = reparsed.data as typeof data

    expect(serialized.text).toContain("Объект: !xml/important")
    expect(serialized.text).toContain("Поле: !изменять value")
    expect(serialized.text).toContain("Список: !xml/invalid")
    expect(serialized.text).toContain("- !проверять two")
    expect(yamlScalarTagAt(reparsedData.Объект, "Поле")).toBe("изменять")
    expect(yamlScalarTagAt(reparsedData.Список, 1)).toBe("проверять")
  })

  it("оставляет нумерацию дублей однозначной при режимах значений", () => {
    const parsed = parseMetadataYaml([
      "!xml/invalid Код: !проверять one",
      "!xml/invalid/2 Код: !изменять two",
    ].join("\n"))

    const serialized = serializeYAMLDocument(parsed.data, parsed.annotations)
    const reparsed = parseMetadataYaml(serialized.text)
    const entries = xmlAnnotatedMappingEntries(
      reparsed.data as Record<string, unknown>,
      reparsed.annotations,
    )
    const keys = Object.keys(reparsed.data as object)

    expect(serialized.text).toBe([
      "!xml/invalid Код: !проверять one",
      "!xml/invalid/2 Код: !изменять two",
    ].join("\n"))
    expect(entries).toEqual([["Код", "one"], ["Код", "two"]])
    expect(yamlScalarTagAt(reparsed.data, keys[0]!)).toBe("проверять")
    expect(yamlScalarTagAt(reparsed.data, keys[1]!)).toBe("изменять")
  })

  it("отклоняет raw на корне документа", () => {
    const parsed = parseMetadataYaml("!xml/raw")

    expect(parsed.syntaxErrors).toHaveLength(1)
    expect(parsed.annotations.root()).toBeUndefined()
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
