import { describe, expect, it } from "vitest"
import { ForbiddenPiscina } from "./forbidRealPiscina"

describe("unit-test Piscina guard", () => {
  it("rejects construction of a physical worker pool", () => {
    expect(() => new ForbiddenPiscina()).toThrow(
      "Настоящий Piscina запрещён в pnpm test"
    )
  })
})
