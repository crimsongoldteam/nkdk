import { describe, expect, it } from "vitest"
import type { NumberPropertyRule } from "./types"
import { exportNumberToJSONSchema, numberValidationSchemaRef } from "./toJSONSchema"

describe("number JSON Schema", () => {
  it("exports unconditional minimum and maximum", () => {
    const rule = { type: "number", minimum: 1, maximum: 250 } satisfies NumberPropertyRule

    expect(exportNumberToJSONSchema({ rule } as never)).toEqual({
      type: "number",
      minimum: 1,
      maximum: 250,
    })
  })

  it("uses bounds in the reusable validation schema key", () => {
    const rule = {
      type: "number",
      minimum: 0,
      maximum: 50,
      implicitValueYAML: 9,
    } satisfies NumberPropertyRule

    expect(numberValidationSchemaRef({ rule } as never)).toBe("number/0..50/without-9")
  })
})
