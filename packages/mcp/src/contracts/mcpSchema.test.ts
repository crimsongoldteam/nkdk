import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { parseTypeBox, toMcpSchema } from "./mcpSchema"

describe("TypeBox MCP schema adapter", () => {
  const schema = Type.Object({ name: Type.String({ minLength: 1 }) }, { additionalProperties: false })

  it("сохраняет JSON Schema и проверку данных", async () => {
    const adapted = toMcpSchema(schema)

    expect(adapted["~standard"].jsonSchema.input({ target: "draft-2020-12" })).toMatchObject({
      type: "object",
      additionalProperties: false,
    })
    expect(await adapted["~standard"].validate({ name: "nkdk" })).toMatchObject({ value: { name: "nkdk" } })
    expect(await adapted["~standard"].validate({ name: "", extra: true })).toHaveProperty("issues")
    expect(parseTypeBox(schema, { name: "nkdk" })).toEqual({ name: "nkdk" })
    expect(() => parseTypeBox(schema, { name: "" })).toThrow()
  })
})
