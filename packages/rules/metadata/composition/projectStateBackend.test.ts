import { describe, expect, it } from "vitest"
import { resolveProjectStateBackendKind } from "./projectStateBackend"

describe("resolveProjectStateBackendKind", () => {
  it("использует TypeScript по умолчанию", () => {
    expect(resolveProjectStateBackendKind({})).toBe("typescript")
  })

  it("явно включает Rust", () => {
    expect(resolveProjectStateBackendKind({ NKDK_PROJECT_STATE_BACKEND: "rust" })).toBe("rust")
  })

  it("отклоняет неизвестное значение", () => {
    expect(() => resolveProjectStateBackendKind({ NKDK_PROJECT_STATE_BACKEND: "other" }))
      .toThrow(/typescript.*rust/u)
  })
})
