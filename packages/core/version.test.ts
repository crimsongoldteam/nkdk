import { describe, expect, it } from "vitest"
import { NKDK_CORE_VERSION } from "./version"

describe("NKDK_CORE_VERSION", () => {
  it("uses the deterministic development fallback", () => {
    expect(NKDK_CORE_VERSION).toBe("0.0.0-dev")
  })
})
