import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { normalizeDataPathTerminalType } from "../../validation/dataPath/terminalTypes"
import { inferConditionalOperandType } from "./conditionalOperandTypes"

describe("inferConditionalOperandType", () => {
  it.each([
    [0, "decimal"],
    ["Истина", "boolean"],
    ["01.02.2026 03:04:05", "dateTime"],
    ["'текст'", "string"],
    ["Порядок", "Order"],
    ["СписокЗначений", "ValueListType"],
    [{ Вариант: "НачалоЭтогоДня" }, "StandardBeginningDate"],
  ])("выводит тип константы %j", (value, expected) => {
    const result = inferConditionalOperandType({ context: mockContext, value })
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

  it("не назначает достоверный тип неподдержанному значению", () => {
    expect(inferConditionalOperandType({
      context: mockContext,
      value: [1],
    })).toEqual({ kind: "unknown" })
  })

  it("не выводит ссылочный тип из одного DesignTimeValue без исходного XML", () => {
    expect(inferConditionalOperandType({
      context: mockContext,
      value: "Справочник.Номенклатура.ПустаяСсылка",
    })).toEqual({ kind: "unknown" })
  })
})
