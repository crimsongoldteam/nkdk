import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { registerCoreMetadata } from "../../register"
import { mockContext } from "../../../tests/mockContext"
import { HomePageWorkAreaRules } from "./rules"

import "./register"

registerCoreMetadata()

describe("HomePageWorkArea JSON Schema", () => {
  it("accepts working area columns and item visibility", () => {
    const schema = exportMetadataItemToJSONSchema({ context: mockContext, rule: HomePageWorkAreaRules })
    const compiled = compileValidationSchema(schema)

    expect(
      compiled.Check({
        ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
        ЛеваяКолонка: [
          {
            Форма: "Task.ЗадачаИсполнителя.Form.МоиЗадачиДляРабочегоСтола",
            Высота: 10,
            Видимость: {
              Общее: "Ложь",
              Роли: {
                НалоговыйМониторинг: "Истина",
              },
            },
          },
        ],
        ПраваяКолонка: [
          {
            Форма: "DataProcessor.ИнформационныйЦентр.Form.ИнформационныйЦентр",
            Высота: 10,
            Видимость: {
              Общее: "Ложь",
            },
          },
        ],
      })
    ).toBe(true)
  })

  it("rejects unknown column item properties", () => {
    const schema = exportMetadataItemToJSONSchema({ context: mockContext, rule: HomePageWorkAreaRules })
    const compiled = compileValidationSchema(schema)

    expect(
      compiled.Check({
        ЛеваяКолонка: [
          {
            Форма: "CommonForm.НачалоРаботы",
            ЛишнееПоле: true,
          },
        ],
      })
    ).toBe(false)
  })
})
