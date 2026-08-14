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
      ok: true,
      status: "synchronized",
      componentPath: "cf",
      packageId: "package-1",
      entries: [],
      loadTargets: [],
      mode: "standalone-server",
      reusedConnection: false,
      finalizeStatus: "published",
      configurationIndexPath: "/project/index.lmdb",
      warnings: [],
    }).success).toBe(true)
    expect(syncToInfobaseOutputShape.safeParse({
      ok: false,
      code: "delivery_outcome_unknown",
      message: "Неизвестно",
      details: {
        packageId: "package-1",
        componentPath: "cf",
        temporaryDirectory: "/project/.nkdk/tmp/sync-to-infobase/attempt-1",
        stage: "configuration-load",
        mode: "designer-agent",
      },
    }).success).toBe(true)
  })

  it("отклоняет неполные подробности неизвестного результата", () => {
    expect(syncToInfobaseOutputShape.safeParse({
      ok: false,
      code: "delivery_outcome_unknown",
      message: "Неизвестно",
      details: { packageId: "package-1" },
    }).success).toBe(false)
  })
})
