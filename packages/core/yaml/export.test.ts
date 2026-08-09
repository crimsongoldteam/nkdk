import { describe, expect, it } from "vitest"
import { explicitYAMLString } from "./explicitString"
import { exportToYAML, serializeYAMLDocument } from "./export"
import { importFromYAML } from "./import"
import { parseWithJsYaml } from "./jsYamlParser"
import { parseMetadataYaml } from "./parseMetadataYaml"
import { markYAMLScalarTag, yamlScalarTagAt } from "./scalarTags"

describe("exportToYAML", () => {
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

  it("сериализует строковое значение !xml каноническим локальным тегом", () => {
    const source = { Значение: "!xml" }
    markYAMLScalarTag(source, "Значение", "xml")

    const serialized = serializeYAMLDocument(source)
    const reparsed = parseMetadataYaml(serialized.text)

    expect(serialized.text).toBe("Значение: !xml")
    expect(serialized.data).toEqual({ Значение: "!xml" })
    expect(yamlScalarTagAt(serialized.data, "Значение")).toBe("xml")
    expect(serialized.data).toEqual(reparsed.data)
    expect(yamlScalarTagAt(reparsed.data, "Значение")).toBe("xml")
  })

  it("сохраняет текст непустого локального тега", () => {
    const parsed = parseMetadataYaml("Комментарий: !xml Текст")

    expect(exportToYAML(parsed.data)).toBe("Комментарий: !xml Текст")
    expect(parsed.data).toEqual({ Комментарий: "!xml Текст" })
  })

  it("exports a marked scalar with the local xml tag", () => {
    const data = { Поле: "Авто" }
    markYAMLScalarTag(data, "Поле", "xml")

    expect(exportToYAML(data)).toBe("Поле: !xml Авто")
  })

  it("preserves the local xml tag across parse and export", () => {
    const parsed = parseWithJsYaml("Поле: !xml Авто")

    expect(exportToYAML(parsed.data)).toBe("Поле: !xml Авто")
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
})
