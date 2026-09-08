import { describe, expect, it, vi } from "vitest"
import {
  createXmlAnomalyAnnotations,
  appendXmlAnnotatedMappingEntry,
  snapshotXmlAnomalyAnnotations,
} from "../../../yaml/xmlAnomalyAnnotations"
import { parseWithJsYaml } from "../../../yaml/jsYamlParser"
import { serializeYAMLDocument } from "../../../yaml/export"
import { orderYamlRuleProperties, sortYamlRuleProperties } from "./yamlPropertyOrder"

describe("orderYamlRuleProperties", () => {
  it("располагает повтор известного ключа после его первого вхождения", () => {
    const source: Record<string, unknown> = { Язык: "ru", Адрес: "первый" }
    const annotations = createXmlAnomalyAnnotations()
    appendXmlAnnotatedMappingEntry(source, annotations, {
      logicalKey: "Адрес", value: "второй", keyAnnotation: { kind: "invalid", occurrence: 1 },
    })
    orderYamlRuleProperties(source, ["Адрес", "Язык"], annotations)
    expect(Object.values(source)).toEqual(["первый", "второй", "ru"])
    expect(serializeYAMLDocument(source, annotations).text).toBe("Адрес: первый\n!xml/invalid Адрес: второй\nЯзык: ru")
  })
  it("ставит подготовленное добавляемое поле в конец до проверки объекта", () => {
    const source = { ПутьКДанным: "", Ширина: 10, Вид: "Поле" }
    const ordered = orderYamlRuleProperties(source, ["Вид", "ПутьКДанным", "Ширина"], undefined, new Set(["ПутьКДанным"]))
    expect(Object.keys(ordered)).toEqual(["Вид", "Ширина", "ПутьКДанным"])
    expect(ordered).toBe(source)
  })

  it("размещает статические ключи без сортировки экземпляра и сохраняет аннотации", () => {
    const source = { Комментарий: "", Тип: "Строка", Заголовок: "Заголовок", Вид: "Поле" }
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(source, "Комментарий", {
      kind: "raw", occurrence: 1, target: "value", xml: { "#text": "" }, hasSemanticValue: false,
    })
    const sort = vi.spyOn(Array.prototype, "sort")
    let calls: number
    let ordered: Record<string, unknown>
    try {
      ordered = orderYamlRuleProperties(source, ["Заголовок", "Вид", "Тип", "Комментарий"])
      calls = sort.mock.calls.length
    } finally {
      sort.mockRestore()
    }

    expect(Object.keys(ordered)).toEqual(["Заголовок", "Вид", "Тип", "Комментарий"])
    expect(ordered).toBe(source)
    expect(calls).toBe(0)
    expect(snapshotXmlAnomalyAnnotations(ordered, annotations).entries)
      .toEqual([expect.objectContaining({ parentPath: [], key: "Комментарий" })])
  })

  it("пропускает отсутствующие ключи и размещает дополнительные по прежнему порядку", () => {
    const source = { Язык: "ru", Комментарий: "", Адрес: "адрес", Вид: "Поле" }
    const symbol = Symbol("metadata")
    Object.defineProperty(source, symbol, { value: "retained" })

    const ordered = orderYamlRuleProperties(source, ["Заголовок", "Вид", "Тип", "Комментарий"])

    expect(Object.keys(ordered)).toEqual(["Вид", "Адрес", "Комментарий", "Язык"])
    expect(Object.getOwnPropertyDescriptor(ordered, symbol)?.value).toBe("retained")
    expect(ordered).toBe(source)
  })

  it("сохраняет последовательность номерных ключей XML-аннотаций", () => {
    const source: Record<string, unknown> = {}
    const annotations = createXmlAnomalyAnnotations()
    appendXmlAnnotatedMappingEntry(source, annotations, { logicalKey: "ChildObjects\\Attribute", value: null })
    for (let occurrence = 1; occurrence <= 10; occurrence += 1) {
      appendXmlAnnotatedMappingEntry(source, annotations, {
        logicalKey: "ChildObjects\\Attribute",
        value: null,
        keyAnnotation: { kind: "invalid", occurrence },
      })
    }

    orderYamlRuleProperties(source, [], annotations)
    const parsed = parseWithJsYaml(serializeYAMLDocument(source, annotations).text)

    expect(parsed.syntaxErrors).toEqual([])
  })
})

describe("sortYamlRuleProperties", () => {
  it("переносит XML-аннотации на отсортированный объект без осиротевших записей", () => {
    const source = { Комментарий: "", Тип: "Строка" }
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(source, "Комментарий", {
      kind: "raw",
      occurrence: 1,
      target: "value",
      xml: { "#text": "" },
      hasSemanticValue: false,
    })

    const sorted = sortYamlRuleProperties(source)

    expect(sorted).toBe(source)
    expect(snapshotXmlAnomalyAnnotations(sorted, annotations).entries).toEqual([
      expect.objectContaining({ parentPath: [], key: "Комментарий" }),
    ])
  })
})
