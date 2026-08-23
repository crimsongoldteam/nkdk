import { describe, expect, it } from "vitest"
import type { FillValueObservation } from "./model"
import { aggregateObservations, createObservationAggregator } from "./aggregate"
import { referenceObservation } from "./testSupport"

const dateType = {
  source: "xml",
  family: "dateTime",
  signature: "dateTime(DateTime)",
  alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }],
} as const

function dateObservation(params: {
  configuration: string
  file: string
  attributeName: string
  text: string
  valueCategory: "initial" | "explicit"
}): FillValueObservation {
  return {
    configuration: params.configuration,
    file: params.file,
    ownerKind: "Document",
    ownerName: "Заказ",
    attributeKind: "ordinary",
    attributeName: params.attributeName,
    itemKind: "Attribute",
    type: dateType,
    raw: { form: "typedText", xsiType: "xs:dateTime", text: params.text },
    typedValue: { type: "dateTime", value: params.text },
    valueCategory: params.valueCategory,
    rulesClassification: params.valueCategory === "initial" ? "implicit" : "explicit",
  }
}

describe("агрегация наблюдений FillValue", () => {
  it("даёт тот же результат при добавлении ограниченными пачками", () => {
    const observations = [
      dateObservation({ configuration: "doc", file: "Documents/C.xml", attributeName: "Дата3", text: "2026-08-23T10:20:30", valueCategory: "explicit" }),
      dateObservation({ configuration: "doc", file: "Documents/A.xml", attributeName: "Дата1", text: "0001-01-01T00:00:00", valueCategory: "initial" }),
      dateObservation({ configuration: "acc", file: "Documents/B.xml", attributeName: "Дата2", text: "0001-01-01T00:00:00", valueCategory: "initial" }),
    ]
    const expected = aggregateObservations({ observations, unresolved: [], examplesLimit: 2 })
    const incremental = createObservationAggregator({ examplesLimit: 2 })

    incremental.add({ observations: observations.slice(0, 1), unresolved: [] })
    incremental.add({ observations: observations.slice(1), unresolved: [] })

    expect(incremental.report()).toEqual(expected)
  })

  it("объединяет одинаковое значение разных обычных реквизитов", () => {
    const report = aggregateObservations({
      observations: [
        dateObservation({ configuration: "doc", file: "Documents/A.xml", attributeName: "Дата1", text: "0001-01-01T00:00:00", valueCategory: "initial" }),
        dateObservation({ configuration: "acc", file: "Documents/B.xml", attributeName: "Дата2", text: "0001-01-01T00:00:00", valueCategory: "initial" }),
        dateObservation({ configuration: "doc", file: "Documents/C.xml", attributeName: "Дата3", text: "2026-08-23T10:20:30", valueCategory: "explicit" }),
      ],
      unresolved: [],
      examplesLimit: 2,
    })

    expect(report.values).toEqual([
      expect.objectContaining({
        valueCategory: "explicit",
        occurrences: 1,
        exactValue: "2026-08-23T10:20:30",
        attributeNames: ["Дата3"],
      }),
      expect.objectContaining({
        valueCategory: "initial",
        occurrences: 2,
        configurations: ["acc", "doc"],
        attributeNames: ["Дата1", "Дата2"],
        examples: ["acc/Documents/B.xml", "doc/Documents/A.xml"],
      }),
    ])
    expect(report.summary).toContainEqual(expect.objectContaining({
      typeFamily: "dateTime",
      valueCategory: "explicit",
      occurrences: 1,
      uniqueValues: 1,
      status: "варианты",
    }))
  })

  it("сохраняет точные ссылки, сворачивая категорию", () => {
    const observations = Array.from({ length: 10 }, (_, index) => referenceObservation({
      configuration: index % 2 === 0 ? "doc" : "acc",
      file: `Catalogs/C${index}.xml`,
      attributeName: `Реквизит${index}`,
      value: `Catalog.Контрагенты.PredefinedValue.Вариант${index}`,
      valueCategory: "predefinedRef",
    }))

    const report = aggregateObservations({ observations, unresolved: [], examplesLimit: 3 })

    expect(report.values).toHaveLength(10)
    expect(report.summary).toEqual([
      expect.objectContaining({
        typeFamily: "reference",
        valueCategory: "predefinedRef",
        occurrences: 10,
        uniqueValues: 10,
        exactValues: [
          "Catalog.Контрагенты.PredefinedValue.Вариант0",
          "Catalog.Контрагенты.PredefinedValue.Вариант1",
          "Catalog.Контрагенты.PredefinedValue.Вариант2",
        ],
      }),
    ])
  })
})
