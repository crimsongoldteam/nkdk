import { beforeAll, describe, expect, it } from "vitest"
import { mockContext } from "../../../../tests/mockContext"
import type { SettingsParameterValuePropertyRule } from "./types"
import { exportSettingsParameterValueToJSONSchema } from "./toJSONSchema"

describe("SettingsParameterValue exportToJSONSchema", () => {
  const schemas = new Map<SettingsParameterValuePropertyRule["valueType"], string>()

  beforeAll(() => {
    for (const rule of [
      { type: "SettingsParameterValue", valueType: "Primitive", yaml: "Значение" },
      { type: "SettingsParameterValue", valueType: "Field", yaml: "Поле" },
      { type: "SettingsParameterValue", valueType: "Font", yaml: "Шрифт" },
      { type: "SettingsParameterValue", valueType: "ChoiceParameterLinks", yaml: "СвязиПараметровВыбора" },
    ] as const satisfies readonly SettingsParameterValuePropertyRule[]) {
      const schema = exportSettingsParameterValueToJSONSchema({ context: mockContext, rule, value: undefined })
      if (schema === undefined) throw new Error(`Schema is not registered for ${rule.valueType}`)
      schemas.set(rule.valueType, JSON.stringify(schema))
    }
  })

  it("describes compact primitive and explicit system enumeration values", () => {
    const schema = requiredSchema(schemas, "Primitive")

    expect(schema).toContain('"СистемноеПеречисление"')
    expect(schema).toContain('"HorizontalAlign"')
    expect(schema).toContain('"Значение"')
    expect(schema).toContain('"additionalProperties":false')
  })

  it("describes explicit string markers for field values", () => {
    const schema = requiredSchema(schemas, "Field")

    expect(schema).toContain('"Тип"')
    expect(schema).toContain('"Строка"')
    expect(schema).toContain('"Значение"')
    expect(schema).toContain('"Использовать"')
  })

  it("keeps font markers separate from wrapper fields", () => {
    const schema = requiredSchema(schemas, "Font")

    expect(schema).toContain('"Вид"')
    expect(schema).not.toContain('"Тип":{"type":"unknown"}')
    expect(schema).toContain('"additionalProperties":false')
  })

  it("describes choice parameter links as a single array value", () => {
    const schema = requiredSchema(schemas, "ChoiceParameterLinks")

    expect(schema).toContain('"Имя"')
    expect(schema).toContain('"ПутьКДанным"')
    expect(schema).toContain('"РежимИзменения"')
    expect(schema).toContain('"type":"array"')
  })
})

function requiredSchema(
  schemas: ReadonlyMap<SettingsParameterValuePropertyRule["valueType"], string>,
  type: SettingsParameterValuePropertyRule["valueType"]
): string {
  const schema = schemas.get(type)
  if (schema === undefined) throw new Error(`Missing prepared schema for ${type}`)
  return schema
}
