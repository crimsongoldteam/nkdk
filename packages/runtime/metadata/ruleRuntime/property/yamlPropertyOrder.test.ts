import { describe, expect, it, vi } from "vitest"
import {
  createXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
} from "../../../yaml/xmlAnomalyAnnotations"
import { orderYamlRuleProperties, sortYamlRuleProperties } from "./yamlPropertyOrder"

describe("orderYamlRuleProperties", () => {
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
