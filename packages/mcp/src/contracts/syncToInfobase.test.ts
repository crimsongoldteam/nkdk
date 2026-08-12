import { describe, expect, it } from "vitest"
import { syncToInfobaseInputSchema, syncToInfobaseOutputShape } from "./syncToInfobase"

describe("sync_to_infobase contract", () => {
  it.each(["cf", "cfe/Расширение"])("accepts component %s", (componentPath) => {
    expect(syncToInfobaseInputSchema.parse({ projectDir: "/project", componentPath })).toEqual({
      projectDir: "/project",
      componentPath,
    })
  })

  it.each(["cfe", "cfe/", "cfe/..", "../cf", "/cf", "erf/Report"])(
    "rejects unsupported component %s",
    (componentPath) => {
      expect(() => syncToInfobaseInputSchema.parse({ projectDir: "/project", componentPath })).toThrow()
    },
  )

  it("rejects unknown input fields", () => {
    expect(() => syncToInfobaseInputSchema.parse({ projectDir: "/project", force: true })).toThrow()
  })

  it("accepts both successful results and an unknown delivery", () => {
    expect(syncToInfobaseOutputShape.safeParse({
      ok: true,
      status: "unchanged",
      componentPath: "cf",
      diagnostics: [],
    }).success).toBe(true)
    expect(syncToInfobaseOutputShape.safeParse({
      ok: false,
      code: "delivery_outcome_unknown",
      message: "Неизвестно",
      details: { packageId: "package-1" },
    }).success).toBe(true)
  })
})
