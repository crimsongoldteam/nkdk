import Schema from "typebox/schema"
import { describe, expect, it } from "vitest"
import { BorderJSONSchema } from "./types"

describe("BorderJSONSchema", () => {
  const schema = Schema.Compile(BorderJSONSchema)

  it("accepts empty style name", () => {
    expect(schema.Check({ Имя: null, Ширина: 1, ТипРамки: "БезРамки" })).toBe(true)
  })

  it("accepts style item references", () => {
    expect(schema.Check({ Имя: "ЭлементСтиля.ControlBorder" })).toBe(true)
  })

  it("rejects raw XML style refs", () => {
    expect(schema.Check({ Имя: "style:Solid" })).toBe(false)
  })
})
