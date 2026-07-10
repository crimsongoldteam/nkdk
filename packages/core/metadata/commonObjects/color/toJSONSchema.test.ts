import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { ColorJSONSchema } from "./types"

const compiled = compileValidationSchema(ColorJSONSchema)

const errorsFor = (value: unknown): string[] => {
  return compiled.Errors(value)[1].map((error) => `${error.instancePath}: ${error.message}`)
}

describe("ColorJSONSchema", () => {
  it("accepts style color names", () => {
    expect(errorsFor("ЦветФонаПодсказки")).toEqual([])
  })

  it("accepts custom style item refs", () => {
    expect(errorsFor("ЭлементСтиля.ТекстЗапрещеннойЯчейкиЦвет")).toEqual([])
  })

  it("accepts web colors and absolute colors", () => {
    expect(errorsFor("Красный")).toEqual([])
    expect(errorsFor("#1C55AE")).toEqual([])
  })

  it("accepts windows color names", () => {
    expect(errorsFor("ТеньКнопкиСветлая")).toEqual([])
  })

  it("accepts raw refs", () => {
    expect(errorsFor("0")).toEqual([])
    expect(errorsFor("0:00000000-0000-0000-0000-000000000000")).toEqual([])
  })

  it("rejects XML auto color", () => {
    expect(errorsFor("auto")).not.toEqual([])
  })
})
