import { beforeAll, describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
import { mockContext } from "../../../../tests/mockContext"
import type { DcsMetadataValuePropertyRule } from "./types"
import "./toJSONSchema"

describe("MetadataDcsMetadataValue exportToJSONSchema", () => {
  let primitiveSchema = ""
  let designTimeSchema = ""

  beforeAll(() => {
    primitiveSchema = schemaJSON({
      type: "MetadataDcsMetadataValue",
      valueType: "Primitive",
      yaml: "Видимость",
    })
    designTimeSchema = schemaJSON({
      type: "MetadataDcsMetadataValue",
      valueType: "DesignTimeValue",
      yaml: "Формат",
    })
  })

  it("describes primitive arrays and explicit system enumeration values", () => {
    expect(primitiveSchema).toContain('"type":"array"')
    expect(primitiveSchema).toContain('"СистемноеПеречисление"')
    expect(primitiveSchema).toContain('"HorizontalAlign"')
    expect(primitiveSchema).toContain('"additionalProperties":false')
  })

  it("describes explicit design-time value markers", () => {
    expect(designTimeSchema).toContain('"Поле"')
    expect(designTimeSchema).toContain('"ЗначениеВремениПроектирования"')
    expect(designTimeSchema).toContain('"МногоязычнаяСтрока"')
    expect(designTimeSchema).toContain('"additionalProperties":false')
  })
})

function schemaJSON(rule: DcsMetadataValuePropertyRule): string {
  const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
  if (schema === undefined) throw new Error(`Schema is not registered for ${rule.valueType}`)
  return JSON.stringify(schema)
}
