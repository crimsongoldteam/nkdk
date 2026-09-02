import { describe, expect, it } from "vitest"
import { serializeYAMLDocument } from "./export"
import { parseMetadataYaml } from "./parseMetadataYaml"
import {
  copyXmlAnomalyAnnotationsDeep,
  createXmlAnomalyAnnotations,
  restoreXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
  xmlAnnotatedMappingEntries,
} from "./xmlAnomalyAnnotations"

describe("XML-аннотации YAML", () => {
  it("сохраняет !xml/uuid на скалярном значении, элементе списка и ключе", () => {
    const uuid = "A786340B-1CA9-48EE-8517-6BD389390BCC"
    const composite = `${uuid}.00000000-0000-0000-0000-000000000000`
    const source = [
      `Значение: !xml/uuid ${uuid}`,
      "Список:",
      `  - !xml/uuid ${composite}`,
      "Ключи:",
      `  !xml/uuid ${uuid}: Истина`,
    ].join("\n")

    const parsed = parseMetadataYaml(source)
    expect(parsed.syntaxErrors).toEqual([])
    const data = parsed.data as {
      Значение: string
      Список: string[]
      Ключи: Record<string, string>
    }
    const runtimeKey = Object.keys(data.Ключи)[0]!

    expect(data.Значение).toBe(uuid)
    expect(data.Список).toEqual([composite])
    expect(parsed.annotations.at(data, "Значение")).toEqual({
      kind: "uuid",
      occurrence: 1,
      target: "value",
    })
    expect(parsed.annotations.at(data.Список, 0)).toEqual({
      kind: "uuid",
      occurrence: 1,
      target: "value",
    })
    expect(parsed.annotations.keyAt(data.Ключи, runtimeKey)).toEqual({
      kind: "uuid",
      occurrence: 1,
      target: "key",
      logicalKey: uuid,
    })
    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toBe(source)
  })

  it.each([
    ["mapping", "Значение: !xml/uuid { Часть: value }"],
    ["sequence", "Значение: !xml/uuid [value]"],
    ["корневая карта", "!xml/uuid\nЗначение: value"],
    ["номер occurrence", "!xml/uuid/2 Значение: value"],
  ])("отклоняет !xml/uuid на %s", (_name, source) => {
    const parsed = parseMetadataYaml(source)

    expect(parsed.syntaxErrors).toHaveLength(1)
  })

  it("удаляет аннотации отброшенного смыслового поддерева", () => {
    const annotations = createXmlAnomalyAnnotations()
    const retained = { value: true }
    const discarded = { nested: { raw: undefined } }
    annotations.set(retained, "value", { kind: "important", occurrence: 1, target: "value" })
    annotations.set(discarded.nested, "raw", {
      kind: "raw",
      occurrence: 1,
      target: "value",
      xml: { "#text": "raw" },
    })

    annotations.deleteSubtree(discarded)

    expect([...annotations.entries()]).toEqual([{
      parent: retained,
      key: "value",
      annotation: { kind: "important", occurrence: 1, target: "value" },
    }])
    expect(annotations.at(discarded.nested, "raw")).toBeUndefined()
  })

  it("отделяет смысловое значение raw от XML-поправки", () => {
    const parsed = parseMetadataYaml([
      "Количество: !xml/raw",
      "  $значение: !xml/invalid 1",
      "  $xml:",
      '    "#text": "01"',
      "Properties\\Future: !xml/raw",
      "  $xml:",
      "    _mode: new",
      '    "#text": "42"',
    ].join("\n"))
    const data = parsed.data as Record<string, unknown>

    expect(parsed.syntaxErrors).toEqual([])
    expect(data).toEqual({ Количество: 1, "Properties\\Future": undefined })
    expect(parsed.annotations.at(data, "Количество")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
      hasSemanticValue: true,
      xml: { "#text": "01" },
      semantic: { kind: "invalid", occurrence: 1 },
    })
    expect(parsed.annotations.at(data, "Properties\\Future")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
      hasSemanticValue: false,
      xml: { _mode: "new", "#text": "42" },
    })
  })

  it("сохраняет аннотации детей внутри $значение", () => {
    const parsed = parseMetadataYaml([
      "Объект: !xml/raw",
      "  $значение:",
      "    Поле: !xml/invalid bad",
      "  $xml:",
      "    _future: x",
    ].join("\n"))
    const data = parsed.data as { Объект: Record<string, unknown> }

    expect(parsed.syntaxErrors).toEqual([])
    expect(data).toEqual({ Объект: { Поле: "bad" } })
    expect(parsed.annotations.at(data.Объект, "Поле")).toEqual({
      kind: "invalid",
      occurrence: 1,
      target: "value",
    })
    expect(serializeYAMLDocument(data, parsed.annotations).text).toBe([
      "Объект: !xml/raw",
      "  $значение:",
      "    Поле: !xml/invalid bad",
      "  $xml:",
      "    _future: x",
    ].join("\n"))
  })

  it("хранит теги значений отдельно от смысловых данных", () => {
    const parsed = parseMetadataYaml([
      "Флаг: !xml/invalid true",
      "Объект: !xml/raw",
      "  $значение:",
      "    Текст: 42",
      "  $xml:",
      "    _future: x",
      "Значения: !xml/important",
      "  - Первый",
      "  - Второй",
    ].join("\n"))
    const data = parsed.data as { Флаг: boolean; Объект: Record<string, number>; Значения: string[] }

    expect(parsed.syntaxErrors).toEqual([])
    expect(data).toEqual({ Флаг: true, Объект: { Текст: 42 }, Значения: ["Первый", "Второй"] })
    expect(parsed.annotations.at(data, "Флаг")).toEqual({ kind: "invalid", occurrence: 1, target: "value" })
    expect(parsed.annotations.at(data, "Объект")).toEqual({
      kind: "raw",
      occurrence: 1,
      target: "value",
      hasSemanticValue: true,
      xml: { _future: "x" },
    })
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
      "      - Значение: !xml/raw",
      "          $значение: value",
      "          $xml: { \"#text\": raw-value }",
      "  !xml/invalid Код:",
      "    Дети:",
      "      - Значение: !xml/raw",
      "          $значение: second",
      "          $xml: { \"#text\": raw-second }",
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

  it.each([
    ["пустой raw", "Компактный: !xml/raw"],
    ["raw null", "Отсутствует: !xml/raw null"],
    ["raw без $xml", "Значение: !xml/raw\n  $значение: true"],
    ["корневой raw", "!xml/raw\n$xml: { \"#text\": value }"],
  ])("отклоняет %s", (_name, yaml) => {
    const parsed = parseMetadataYaml(yaml)

    expect(parsed.syntaxErrors).toHaveLength(1)
  })

  it("сохраняет $xml: null как удаление обычного XML-места", () => {
    const parsed = parseMetadataYaml([
      "Значение: !xml/raw",
      "  $значение: default",
      "  $xml: null",
    ].join("\n"))
    const data = parsed.data as Record<string, unknown>

    expect(parsed.syntaxErrors).toEqual([])
    expect(parsed.annotations.at(data, "Значение")).toMatchObject({
      kind: "raw",
      xml: null,
      hasSemanticValue: true,
    })
  })

  it("восстанавливает аннотации после structured clone без повторного разбора YAML", () => {
    const parsed = parseMetadataYaml([
      "Коллекция:",
      "  Код: !xml/raw",
      "    $значение: value",
      "    $xml: { \"#text\": raw-value }",
      "  !xml/invalid Код: !xml/important second",
    ].join("\n"))
    const transferred = structuredClone({
      data: parsed.data,
      annotations: snapshotXmlAnomalyAnnotations(parsed.data, parsed.annotations),
    })
    const restored = restoreXmlAnomalyAnnotations(transferred.data, transferred.annotations)
    const collection = (transferred.data as Record<string, unknown>).Коллекция as Record<string, unknown>
    const runtimeKeys = Object.keys(collection)

    expect(restored.at(collection, runtimeKeys[0]!)).toMatchObject({ kind: "raw" })
    expect(restored.keyAt(collection, runtimeKeys[1]!)).toMatchObject({ kind: "invalid", logicalKey: "Код" })
    expect(restored.at(collection, runtimeKeys[1]!)).toMatchObject({ kind: "important" })
  })

  it("заменяет аннотацию границы без повторной записи в снимок", () => {
    const parsed = parseMetadataYaml([
      "Флаг: !xml/raw",
      "  $значение: неверно",
      "  $xml: { _custom: x }",
    ].join("\n"))
    const data = parsed.data as Record<string, unknown>
    const raw = parsed.annotations.at(data, "Флаг")!

    parsed.annotations.set(data, "Флаг", {
      ...raw,
      semantic: { kind: "invalid", occurrence: 1 },
    })

    expect(snapshotXmlAnomalyAnnotations(data, parsed.annotations).entries).toHaveLength(1)
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
