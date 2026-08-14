import { describe, expect, it } from "vitest"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { exportI8nTextToJSONSchema } from "./toJSONSchema"
import { I8nTextJSONSchema } from "./types"

describe("I8nText JSON Schema", () => {
  it("accepts string and nonempty language mappings without project language codes", () => {
    const compiled = compileValidationSchema(I8nTextJSONSchema)

    expect(compiled.Check("Текст")).toBe(true)
    expect(compiled.Check({ unknown: "Text" })).toBe(true)
  })

  it("rejects empty language values for an ordinary property", () => {
    expect(compileValidationSchema(I8nTextJSONSchema).Check({ ru: "" })).toBe(false)
  })

  it("allows an empty marker only for a foldable property", () => {
    const schema = exportI8nTextToJSONSchema({
      rule: { type: "I8nText", excludeIfEqualNameYAML: true },
    } as never)

    expect(compileValidationSchema(schema!).Check({ ru: "" })).toBe(true)
  })
})
