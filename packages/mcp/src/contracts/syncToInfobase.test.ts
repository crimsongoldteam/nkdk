import { describe, expect, it } from "vitest"
import { Value } from "typebox/value"
import {
  syncToInfobaseInputSchema,
  syncToInfobaseOutputShape,
  syncToInfobaseSuccessOutputSchema,
} from "./syncToInfobase"
import { parseTypeBox } from "./mcpSchema"

describe("sync_to_infobase contract", () => {
  it.each(["cf", "cfe/Расширение"])("accepts component %s", (componentPath) => {
    expect(parseTypeBox(syncToInfobaseInputSchema, { projectDir: "/project", componentPath })).toEqual({
      projectDir: "/project",
      componentPath,
    })
  })

  it.each(["cfe", "cfe/", "cfe/..", "../cf", "/cf", "erf/Report"])(
    "rejects unsupported component %s",
    (componentPath) => {
      expect(() => parseTypeBox(syncToInfobaseInputSchema, { projectDir: "/project", componentPath })).toThrow()
    },
  )

  it("rejects unknown input fields", () => {
    expect(() => parseTypeBox(syncToInfobaseInputSchema, { projectDir: "/project", force: true })).toThrow()
  })

  it("accepts both successful results and an unknown delivery", () => {
    expect(Value.Check(syncToInfobaseOutputShape, {
      ok: true,
      status: "unchanged",
      componentPath: "cf",
      diagnostics: [],
    })).toBe(true)
    expect(Value.Check(syncToInfobaseOutputShape, {
      ok: true,
      status: "synchronized",
      componentPath: "cf",
      packageId: "package-1",
      entries: [],
      loadTargets: [],
      mode: "standalone-server",
      loadMode: "selected",
      reusedConnection: false,
      finalizeStatus: "published",
      configurationIndexPath: "/project/index.lmdb",
      warnings: [],
    })).toBe(true)
    expect(Value.Check(syncToInfobaseOutputShape, {
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
    })).toBe(true)
  })

  it("keeps successful variants strict", () => {
    expect(Value.Check(syncToInfobaseSuccessOutputSchema, {
      ok: true,
      status: "unchanged",
      componentPath: "cf",
      diagnostics: [],
      packageId: "unexpected",
    })).toBe(false)
    expect(Value.Check(syncToInfobaseSuccessOutputSchema, {
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
    })).toBe(false)
  })

  it("отклоняет неполные подробности неизвестного результата", () => {
    expect(Value.Check(syncToInfobaseOutputShape, {
      ok: false,
      code: "delivery_outcome_unknown",
      message: "Неизвестно",
      details: { packageId: "package-1" },
    })).toBe(false)
  })
})
