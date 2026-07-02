import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../../tests/mockContext"
import { exportCommandInterfaceToJSONSchema } from "./toJSONSchema"

type ObjectSchema = {
  properties: {
    ПанельНавигации: {
      items: {
        required?: string[]
        properties: {
          Автовидимость: { const?: string; anyOf?: unknown; oneOf?: unknown }
        }
      }
    }
  }
}

describe("exportCommandInterfaceToJSONSchema", () => {
  it("allows only explicit false for Автовидимость", () => {
    const schema = exportCommandInterfaceToJSONSchema({
      context: mockContext,
      rule: mockRule,
      value: undefined,
    }) as unknown as ObjectSchema
    const itemSchema = schema.properties.ПанельНавигации.items

    expect(itemSchema.properties.Автовидимость.const).toBe("Ложь")
    expect(itemSchema.properties.Автовидимость.anyOf).toBeUndefined()
    expect(itemSchema.properties.Автовидимость.oneOf).toBeUndefined()
    expect(itemSchema.required ?? []).not.toContain("Автовидимость")
  })
})
