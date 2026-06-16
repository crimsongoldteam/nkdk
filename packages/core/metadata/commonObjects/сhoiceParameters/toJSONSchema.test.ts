import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { ChoiceParametersJSONSchema } from "./types"

const compiled = TypeCompiler.Compile(ChoiceParametersJSONSchema)

describe("ChoiceParametersJSONSchema", () => {
  it("accepts YAML parser null for an empty choice parameter key", () => {
    expect(compiled.Check({ ВыборСчетовГоловнойОрганизации: null })).toBe(true)
  })

  it("accepts compact ERP form choice parameter YAML", () => {
    expect(
      compiled.Check({
        "Отбор.ТипДоговора": {
          Значение: [
            "Перечисление.ТипыДоговоров.СПоставщиком",
            "Перечисление.ТипыДоговоров.СКомитентом",
          ],
        },
      })
    ).toBe(true)
  })

  it("keeps rejecting unrelated objects", () => {
    expect(compiled.Check({ ВыборСчетовГоловнойОрганизации: { ПроизвольноеПоле: "x" } })).toBe(false)
  })
})
