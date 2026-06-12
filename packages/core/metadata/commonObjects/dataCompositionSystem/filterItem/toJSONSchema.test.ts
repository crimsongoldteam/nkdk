import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import "./types"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("FilterItem JSON Schema", () => {
  it("accepts comparison items", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ ЛевоеЗначение: ".ХозяйственнаяОперация", Использование: "Ложь" }])).toBe(true)
  })

  it("accepts group items with nested elements", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИли",
          Элементы: [{ ЛевоеЗначение: ".ХозяйственнаяОперация" }],
        },
      ])
    ).toBe(true)
  })

  it("accepts nested groups with comparison items", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИли",
          Элементы: [
            {
              ТипГруппы: "ГруппаИли",
              Элементы: [{ ЛевоеЗначение: ".X" }],
            },
          ],
        },
      ])
    ).toBe(true)
  })

  it("rejects record-shaped values", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ item: { ЛевоеЗначение: ".ХозяйственнаяОперация" } })).toBe(false)
  })

  it("rejects invalid nested elements", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ ТипГруппы: "ГруппаИли", Элементы: [123] }])).toBe(false)
    expect(compiled.Check([{ ТипГруппы: "ГруппаИли", Элементы: [{ Неизвестно: "x" }] }])).toBe(false)
  })
})
