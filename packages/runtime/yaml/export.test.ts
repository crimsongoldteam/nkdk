import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString } from "./explicitString"
import { exportToYAML, serializeYAMLDocument } from "./export"
import { importFromYAML } from "./import"
import { parseWithJsYaml } from "./jsYamlParser"
import { parseMetadataYaml } from "./parseMetadataYaml"
import { markYAMLScalarTag, xmlAnomalyTagPayload, yamlScalarTagAt } from "./scalarTags"
import { copyYAMLMappingTag, yamlMappingTagOf } from "./mappingTags"
import { markYAMLMappingKeyTag, yamlMappingKeyTagAt } from "./mappingKeyTags"
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
    ["xml/language", "!xml/language Buttons", "Значение: !xml/language Buttons"],
    ["xml/duplicate", "!xml/duplicate Группа", "Значение: !xml/duplicate Группа"],
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

  it.each([
    ["xml/language", "!xml/language Products marked for SPMS ", '!xml/language "Products marked for SPMS "'],
    ["xml/value", "!xml/value    ", '!xml/value "   "'],
    ["xml/name", "!xml/name 001", '!xml/name "001"'],
    ["xml/duplicate", "!xml/duplicate @text", '!xml/duplicate "@text"'],
  ] as const)("сохраняет требующее кавычек содержимое %s", (tag, value, expectedScalar) => {
    const mapping = { Значение: value }
    markYAMLScalarTag(mapping, "Значение", tag)

    const serializedMapping = serializeYAMLDocument(mapping)
    const reparsedMapping = parseMetadataYaml(serializedMapping.text)

    expect(serializedMapping.text).toBe(`Значение: ${expectedScalar}`)
    expect(serializedMapping.data).toEqual(mapping)
    expect(reparsedMapping.data).toEqual(mapping)
    expect(yamlScalarTagAt(reparsedMapping.data, "Значение")).toBe(tag)

    const sequence = { Значения: [value] }
    markYAMLScalarTag(sequence.Значения, 0, tag)

    const serializedSequence = serializeYAMLDocument(sequence)
    const reparsedSequence = parseMetadataYaml(serializedSequence.text)
    const reparsedValues = (reparsedSequence.data as { Значения: string[] }).Значения

    expect(serializedSequence.text).toBe(`Значения:\n  - ${expectedScalar}`)
    expect(serializedSequence.data).toEqual(sequence)
    expect(reparsedSequence.data).toEqual(sequence)
    expect(yamlScalarTagAt(reparsedValues, 0)).toBe(tag)
  })

  it("сохраняет payload классифицированного тега", () => {
    const parsed = parseMetadataYaml("Комментарий: !xml/value Текст")
    const data = parsed.data as { Комментарий: string }

    expect(exportToYAML(data)).toBe("Комментарий: !xml/value Текст")
    expect(data).toEqual({ Комментарий: "!xml/value Текст" })
    expect(xmlAnomalyTagPayload("xml/value", data.Комментарий)).toBe("Текст")
  })

  it("сохраняет !xml/reference на скалярном ключе", () => {
    const expected = [
      "Роли:",
      "  !xml/reference 6537a19c-3357-46a2-96a6-1fe4619ddbc8: Истина",
      "  Администратор: Ложь",
    ].join("\n")
    const roles = {
      "6537a19c-3357-46a2-96a6-1fe4619ddbc8": "Истина",
      Администратор: "Ложь",
    }
    markYAMLMappingKeyTag(
      roles,
      "6537a19c-3357-46a2-96a6-1fe4619ddbc8",
      "xml/reference",
    )

    const serialized = serializeYAMLDocument({ Роли: roles })
    const reparsed = parseMetadataYaml(serialized.text)
    const serializedRoles = (serialized.data as { Роли: Record<string, string> }).Роли
    const reparsedRoles = (reparsed.data as { Роли: Record<string, string> }).Роли

    expect(serialized.text).toBe(expected)
    expect(yamlMappingKeyTagAt(
      serializedRoles,
      "6537a19c-3357-46a2-96a6-1fe4619ddbc8",
    )).toBe("xml/reference")
    expect(yamlMappingKeyTagAt(
      reparsedRoles,
      "6537a19c-3357-46a2-96a6-1fe4619ddbc8",
    )).toBe("xml/reference")
  })

  it("сериализует пустой ключ с !xml/reference", () => {
    const roles = { "": "Ложь" }
    markYAMLMappingKeyTag(roles, "", "xml/reference")

    const serialized = serializeYAMLDocument({ Роли: roles })
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe('Роли:\n  !xml/reference "": Ложь')
    expect(yamlMappingKeyTagAt(
      (reparsed.data as { Роли: Record<string, string> }).Роли,
      "",
    )).toBe("xml/reference")
  })

  it("сериализует и сохраняет mapping-тег нарушения порядка", () => {
    const parsed = parseMetadataYaml("Заголовок: !xml/order\n  en: Text\n  ru: Текст\n")
    const title = (parsed.data as { Заголовок: Record<string, string> }).Заголовок
    const copied = { ...title }
    copyYAMLMappingTag(title, copied)

    const serialized = serializeYAMLDocument({ Заголовок: copied })
    const reparsed = parseMetadataYaml(serialized.text)
    const reparsedTitle = (reparsed.data as { Заголовок: Record<string, string> }).Заголовок

    expect(serialized.text).toBe("Заголовок: !xml/order\n  en: Text\n  ru: Текст")
    expect(serialized.data).toEqual({ Заголовок: copied })
    expect(yamlMappingTagOf((serialized.data as { Заголовок: object }).Заголовок)).toBe("xml/order")
    expect(yamlMappingTagOf(reparsedTitle)).toBe("xml/order")
  })

  it("сохраняет порядок числовых ключей в mapping с !xml/order", () => {
    const parsed = parseMetadataYaml("Заголовок: !xml/order\n  '10': Ten\n  '2': Two\n")

    expect(serializeYAMLDocument(parsed.data).text).toBe(
      'Заголовок: !xml/order\n  "10": Ten\n  "2": Two',
    )
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

  it("сохраняет новые XML-аннотации при повторном разборе", () => {
    const source = [
      "Флаг: !xml/invalid true",
      "Объект: !xml/raw",
      "  _future: x",
      '  "#text": "42"',
      "!xml/invalid Код: { Тип: Строка }",
      "!xml/invalid/2 Код: { Тип: Число }",
    ].join("\n")
    const parsed = parseMetadataYaml(source)
    const serialized = serializeYAMLDocument(parsed.data, parsed.annotations)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe([
      "Флаг: !xml/invalid true",
      "Объект: !xml/raw",
      "  _future: x",
      '  "#text": "42"',
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

  it("сохраняет компактный raw и raw null", () => {
    const parsed = parseMetadataYaml("Компактный: !xml/raw\nОтсутствует: !xml/raw null")
    const serialized = serializeYAMLDocument(parsed.data, parsed.annotations)

    expect(serialized.text).toBe("Компактный: !xml/raw\nОтсутствует: !xml/raw null")
    expect(parseMetadataYaml(serialized.text).data).toEqual(parsed.data)
  })

  it.each(["raw", "invalid", "important"] as const)(
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

  it("сохраняет compact raw и режим свойства", () => {
    const data = { Компактный: undefined }
    markYAMLScalarTag(data, "Компактный", "проверять")
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(data, "Компактный", { kind: "raw", occurrence: 1, target: "value" })

    const serialized = serializeYAMLDocument(data, annotations)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe("!проверять Компактный: !xml/raw")
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

  it("сохраняет компактный raw на корне документа", () => {
    const parsed = parseMetadataYaml("!xml/raw")
    const serialized = serializeYAMLDocument(parsed.data, parsed.annotations)

    expect(parsed.data).toBeUndefined()
    expect(serialized.text).toBe("!xml/raw")
    expect(parseMetadataYaml(serialized.text).annotations.root()).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "root",
    })
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
