import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { normalizeDataPathTerminalType } from "../../validation/dataPath/terminalTypes"
import { inferConditionalOperandType } from "./conditionalOperandTypes"

describe("inferConditionalOperandType", () => {
  it.each([
    [0, undefined, "decimal"],
    ["Истина", undefined, "boolean"],
    ["01.02.2026 03:04:05", undefined, "dateTime"],
    ["'текст'", undefined, "string"],
    ["Порядок", undefined, "Order"],
    ["СписокЗначений", undefined, "ValueListType"],
    [{ Вариант: "НачалоЭтогоДня" }, undefined, "StandardBeginningDate"],
    [
      "Справочник.Номенклатура.ПустаяСсылка",
      { type: "ref", value: "Catalog.Номенклатура.EmptyRef" },
      "CatalogRef.*",
    ],
  ])("выводит тип константы %j", (value, sourceValue, expected) => {
    const result = inferConditionalOperandType({ context: mockContext, value, sourceValue: sourceValue as never })
    expect(result.kind).toBe("typed")
    if (result.kind !== "typed") return
    expect(normalizeDataPathTerminalType(result.typeInfo)).toMatchObject({
      status: "resolved",
      groups: [expected],
    })
  })

  it("отделяет поле от константы", () => {
    expect(inferConditionalOperandType({ context: mockContext, value: ".Реквизит" })).toEqual({
      kind: "field",
      value: "Реквизит",
    })
  })

  it("не назначает достоверный тип значению времени проектирования", () => {
    expect(inferConditionalOperandType({
      context: mockContext,
      value: "Справочник.Номенклатура.ПустаяСсылка",
    })).toEqual({ kind: "unknown" })
  })
})
