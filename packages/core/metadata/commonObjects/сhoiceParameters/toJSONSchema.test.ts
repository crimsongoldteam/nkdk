import Schema from "typebox/schema"
import { describe, expect, it } from "vitest"
import { ChoiceParametersJSONSchema } from "./types"

const compiled = Schema.Compile(ChoiceParametersJSONSchema)

describe("ChoiceParametersJSONSchema", () => {
  it("accepts YAML parser null for an empty choice parameter key", () => {
    expect(compiled.Check({ ВыборСчетовГоловнойОрганизации: null })).toBe(true)
  })

  it("accepts empty object as an empty choice parameter value", () => {
    expect(compiled.Check({ ВыборДействующихМаршрутныхКарт: {} })).toBe(true)
  })

  it("accepts numeric choice parameter values", () => {
    expect(compiled.Check({ Параметр: 123 })).toBe(true)
  })

  it("accepts compact ERP form choice parameter YAML", () => {
    expect(
      compiled.Check({
        "Отбор.ТипДоговора": {
          Значение: ["Перечисление.ТипыДоговоров.СПоставщиком", "Перечисление.ТипыДоговоров.СКомитентом"],
        },
      })
    ).toBe(true)
  })

  it("keeps rejecting unrelated objects", () => {
    expect(compiled.Check({ ВыборСчетовГоловнойОрганизации: { ПроизвольноеПоле: "x" } })).toBe(false)
  })
})
