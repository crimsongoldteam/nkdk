import { describe, expect, it } from "vitest"
import { EMPTY_XML_TAG_VALUE, markYAMLScalarTag, yamlScalarTagAt } from "@nkdk/runtime"
import { explicitRowFilterRules } from "./explicitRowFilter"
import type { ClientApplicationFormYAML } from "../../clientApplicationForm/types"
import { classifyTableSource } from "../../clientApplicationForm/tableSourceProfile"

describe("explicit RowFilter", () => {
  it("registers the only approved empty !xml transport value", () => {
    expect(explicitRowFilterRules.explicitXMLProperties.tableRowFilter).toEqual({
      itemType: "Table",
      propertyKey: "rowFilter",
      yamlValue: EMPTY_XML_TAG_VALUE,
      xmlValue: { "_xsi:nil": "true" },
    })
  })

  it("keeps the marker for every source profile", () => {
    const yaml = {
      Реквизиты: {
        Компоновщик: { Тип: "КомпоновщикНастроекКомпоновкиДанных" },
        Строки: { Тип: "ТаблицаЗначений" },
      },
      Элементы: {
        Настройки: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "Компоновщик.Настройки",
          ОтборСтрок: EMPTY_XML_TAG_VALUE,
        },
        Строки: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "Строки",
          ОтборСтрок: EMPTY_XML_TAG_VALUE,
        },
      },
    } as unknown as ClientApplicationFormYAML
    const settings = yaml.Элементы?.Настройки as unknown as Record<string, unknown>
    const rows = yaml.Элементы?.Строки as unknown as Record<string, unknown>
    markYAMLScalarTag(settings, "ОтборСтрок", "xml")
    markYAMLScalarTag(rows, "ОтборСтрок", "xml")
    expect(settings.ОтборСтрок).toBe(EMPTY_XML_TAG_VALUE)
    expect(yamlScalarTagAt(settings, "ОтборСтрок")).toBe("xml")
    expect(rows.ОтборСтрок).toBe(EMPTY_XML_TAG_VALUE)
    expect(yamlScalarTagAt(rows, "ОтборСтрок")).toBe("xml")
  })

  it.each([
    ["DynamicList", "formAttribute", 1, "dynamicList"],
    ["ValueTable", "formAttribute", 1, "rowFilter"],
    ["TabularSection", "objectField", 2, "rowFilter"],
    ["RegisterRecordSet", "registerRecordSet", 1, "rowFilter"],
    ["Registered", "tableColumn", 3, "none"],
    ["DynamicList", "tableColumn", 2, "none"],
  ] as const)("classifies %s from %s as %s", (kind, sourceKind, segmentCount, expected) => {
    expect(classifyTableSource({
      dataPath: "Путь",
      index: { getRoot: () => undefined },
      resolve: () => ({
        status: "ok",
        target: {
          segments: Array.from({ length: segmentCount }, (_, index) => String(index)),
          source: { kind: sourceKind },
          typeInfo: { nextTypes: [], table: { kind } },
        },
      }),
    })).toBe(expected)
  })
})
