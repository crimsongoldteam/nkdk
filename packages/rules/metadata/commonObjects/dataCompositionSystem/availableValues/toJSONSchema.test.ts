import { describe, expect, it } from "vitest"
import { mockContext } from "../../../../tests/mockContext"
import { exportDcsAvailableValuesToJSONSchema } from "./toJSONSchema"

describe("DcsAvailableValues JSON Schema", () => {
  it("описывает строгую коллекцию значений и представлений", () => {
    const schema = exportDcsAvailableValuesToJSONSchema({
      context: mockContext,
      rule: { type: "DcsAvailableValues" },
      value: undefined,
    })
    if (schema === undefined) throw new Error("DcsAvailableValues JSON Schema is not registered")

    expect(schema).toMatchObject({
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          Значение: expect.any(Object),
          Представление: expect.any(Object),
        },
      },
    })
  })
})
