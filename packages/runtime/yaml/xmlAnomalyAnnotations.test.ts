import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "./parseMetadataYaml"
import {
  copyXmlAnomalyAnnotationsDeep,
  xmlAnnotatedMappingEntries,
} from "./xmlAnomalyAnnotations"

describe("XML-аннотации YAML", () => {
  it("хранит теги значений отдельно от смысловых данных", () => {
    const parsed = parseMetadataYaml([
      "Флаг: !xml/invalid true",
      "Объект: !xml/raw",
      "  _future: x",
      '  "#text": "42"',
      "Значения: !xml/important",
      "  - Первый",
      "  - Второй",
    ].join("\n"))
    const data = parsed.data as { Флаг: boolean; Объект: Record<string, string>; Значения: string[] }

    expect(parsed.syntaxErrors).toEqual([])
    expect(data).toEqual({ Флаг: true, Объект: { _future: "x", "#text": "42" }, Значения: ["Первый", "Второй"] })
    expect(parsed.annotations.at(data, "Флаг")).toEqual({ kind: "invalid", occurrence: 1, target: "value" })
    expect(parsed.annotations.at(data, "Объект")).toEqual({ kind: "raw", occurrence: 1, target: "value" })
    expect(parsed.annotations.at(data, "Значения")).toEqual({ kind: "important", occurrence: 1, target: "value" })
  })

  it("адресует повторные логические ключи внутренними ключами", () => {
    const parsed = parseMetadataYaml([
      "Код: { Тип: Строка }",
      "!xml/invalid Код: { Тип: Число }",
      "!xml/invalid/2 Код: { Тип: Булево }",
    ].join("\n"))
    const data = parsed.data as Record<string, { Тип: string }>
    const runtimeKeys = Object.keys(data)

    expect(parsed.syntaxErrors).toEqual([])
    expect(runtimeKeys).toHaveLength(3)
    expect([...xmlAnnotatedMappingEntries(data, parsed.annotations)]).toEqual([
      ["Код", { Тип: "Строка" }], ["Код", { Тип: "Число" }], ["Код", { Тип: "Булево" }],
    ])
    expect(parsed.annotations.keyAt(data, runtimeKeys[1]!)).toEqual({ kind: "invalid", occurrence: 1, target: "key", logicalKey: "Код" })
    expect(parsed.annotations.keyAt(data, runtimeKeys[2]!)).toEqual({ kind: "invalid", occurrence: 2, target: "key", logicalKey: "Код" })
  })

  it("сохраняет аннотацию корня", () => {
    const parsed = parseMetadataYaml("!xml/invalid\nФлаг: true")

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Флаг: true })
    expect(parsed.annotations.root()).toEqual({ kind: "invalid", occurrence: 1, target: "root" })
  })

  it("переносит аннотации во вложенные mapping и sequence нового YAML-дерева", () => {
    const parsed = parseMetadataYaml([
      "Коллекция:",
      "  Код:",
      "    Дети:",
      "      - Значение: !xml/raw value",
      "  !xml/invalid Код:",
      "    Дети:",
      "      - Значение: !xml/raw second",
    ].join("\n"))
    const source = parsed.data as Record<string, unknown>
    const target = structuredClone(source)

    copyXmlAnomalyAnnotationsDeep(parsed.annotations, source, target)

    const collection = target.Коллекция as Record<string, unknown>
    expect(xmlAnnotatedMappingEntries(collection, parsed.annotations).map(([key]) => key)).toEqual([
      "Код",
      "Код",
    ])
    const second = Object.values(collection)[1] as { Дети: Array<Record<string, unknown>> }
    expect(parsed.annotations.at(second.Дети[0]!, "Значение")).toMatchObject({
      kind: "raw",
      target: "value",
    })
  })

  it("различает компактный raw и raw null", () => {
    const parsed = parseMetadataYaml("Компактный: !xml/raw\nОтсутствует: !xml/raw null")

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.data).toEqual({ Компактный: undefined, Отсутствует: null })
  })

  it.each([
    ["номер /1", "!xml/invalid/1 Код: { Тип: Строка }"],
    ["первый номер /2", "!xml/invalid/2 Код: { Тип: Строка }"],
    ["пропуск номера", "!xml/invalid Код: { Тип: Строка }\n!xml/invalid/3 Код: { Тип: Число }"],
    ["raw на ключе", "!xml/raw Код: { Тип: Строка }"],
  ])("отклоняет %s", (_name, text) => {
    const parsed = parseMetadataYaml(text)

    expect(parsed.data).toEqual({})
    expect(parsed.syntaxErrors).toHaveLength(1)
  })
})
