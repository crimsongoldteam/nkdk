import { describe, expect, it } from "vitest"
import type { TypeDescriptionView } from "../../ruleRuntime/property/typeDescriptionView"
import { effectiveFillValueType } from "./definedType"
import type { DefinedTypeLookup } from "./types"

const reference = (objectName: string) => ({
  kind: "reference",
  constraint: {
    kind: "value",
    roots: ["Catalog"],
    valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
    allowEmptyRef: true,
  },
  objectName,
})

function lookup(entries: Readonly<Record<string, TypeDescriptionView | undefined>>): DefinedTypeLookup {
  return (name) => Object.prototype.hasOwnProperty.call(entries, name)
    ? { status: "ok", type: entries[name] }
    : { status: "unresolved", reason: `не найден определяемый тип ${name}` }
}

describe("DefinedType fill-value effective type", () => {
  it("resolves one and several reference alternatives", () => {
    expect(effectiveFillValueType(
      { type: ["DefinedType.Организация"] },
      lookup({ Организация: { type: ["CatalogRef.Организации"] } }),
    )).toEqual({ status: "known", alternatives: [reference("Организации")], composite: false })

    expect(effectiveFillValueType(
      { type: ["DefinedType.Сторона"] },
      lookup({ Сторона: { type: ["CatalogRef.Организации", "CatalogRef.Контрагенты", "CatalogRef.Партнеры"] } }),
    )).toEqual({
      status: "known",
      alternatives: [reference("Организации"), reference("Контрагенты"), reference("Партнеры")],
      composite: true,
    })
  })

  it("combines direct and recursively resolved branches without duplicates", () => {
    expect(effectiveFillValueType(
      { type: ["string", "DefinedType.А", "DefinedType.Б"] },
      lookup({
        А: { type: ["DefinedType.Б"] },
        Б: { type: ["CatalogRef.Товары"] },
      }),
    )).toEqual({
      status: "known",
      alternatives: [{ kind: "string" }, reference("Товары")],
      composite: true,
    })
  })

  it.each([
    ["cycle", { type: ["DefinedType.А"] }, lookup({ А: { type: ["DefinedType.Б"] }, Б: { type: ["DefinedType.А"] } }), "цикл определяемых типов: А -> Б -> А"],
    ["missing", { type: ["DefinedType.Нет"] }, lookup({}), "не найден определяемый тип Нет"],
    ["empty", { type: ["DefinedType.Пустой"] }, lookup({ Пустой: undefined }), "у определяемого типа Пустой не задан Тип"],
  ] as const)("reports %s", (_name, type, definedTypeLookup, reason) => {
    expect(effectiveFillValueType(type, definedTypeLookup)).toEqual({ status: "unresolved", reason })
  })
})
