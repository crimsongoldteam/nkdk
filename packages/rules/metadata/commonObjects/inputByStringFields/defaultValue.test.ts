import { describe, expect, it } from "vitest"
import { inputByStringDefaultYAML, orderedEqual } from "./defaultValue"
import type { InputByStringFieldsWidePropertyRule } from "./types"

const catalogRule = {
  type: "InputByStringFields",
  yaml: "ВводПоСтроке",
  standardFields: [
    {
      yaml: "СтандартныйРеквизит.Наименование",
      length: { propertyKey: "descriptionLength", yaml: "ДлинаНаименования", implicitValue: 25 },
    },
    {
      yaml: "СтандартныйРеквизит.Код",
      length: { propertyKey: "codeLength", yaml: "ДлинаКода", implicitValue: 9 },
    },
  ],
} as const satisfies InputByStringFieldsWidePropertyRule

describe("inputByStringDefaultYAML", () => {
  it.each([
    [{}, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
    [{ ДлинаКода: 0 }, ["СтандартныйРеквизит.Наименование"]],
    [{ ДлинаНаименования: 0 }, ["СтандартныйРеквизит.Код"]],
    [{ ДлинаКода: 0, ДлинаНаименования: 0 }, []],
  ])("computes ordered standard fields from effective lengths", (yaml, expected) => {
    expect(inputByStringDefaultYAML(catalogRule, yaml)).toEqual(expected)
  })

  it("treats order as part of equality", () => {
    expect(orderedEqual(["Наименование", "Код"], ["Код", "Наименование"])).toBe(false)
    expect(orderedEqual(["Наименование", "Код"], ["Наименование", "Код"])).toBe(true)
  })
})
