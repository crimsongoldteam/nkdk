import { describe, expect, it } from "vitest"
import runValidationWorkerTask from "./projectValidationWorker"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { createSharedValidationSnapshot } from "./sharedValidationSnapshot"

const context = {
  version: "2.20",
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
} as const

describe("projectValidationWorker", () => {
  it("omits timing results without validation timing or profile flags", async () => {
    const previousTiming = process.env["NKDK_VALIDATION_TIMING"]
    const previousProfile = process.env["NKDK_VALIDATION_PROFILE"]
    delete process.env["NKDK_VALIDATION_TIMING"]
    delete process.env["NKDK_VALIDATION_PROFILE"]

    try {
      await runValidationWorkerTask({
        kind: "init",
        context,
        rulesSnapshot: createValidationRulesSnapshot(context),
      })

      const firstPass = await runValidationWorkerTask({
        kind: "firstPass",
        projectDir: "/project",
        context,
        filePaths: [],
      })
      expect(firstPass).toMatchObject({ kind: "firstPassResult" })
      expect(firstPass).not.toHaveProperty("timing")

      const secondPass = await runValidationWorkerTask({
        kind: "secondPass",
        projectDir: "/project",
        context,
        mode: "full",
        sharedValidationSnapshot: emptySharedSnapshot(),
        pendingReferences: [],
        filePaths: [],
      })
      expect(secondPass).toMatchObject({ kind: "secondPassResult" })
      expect(secondPass).not.toHaveProperty("timing")
    } finally {
      restoreEnv("NKDK_VALIDATION_TIMING", previousTiming)
      restoreEnv("NKDK_VALIDATION_PROFILE", previousProfile)
    }
  }, 120_000)

  it("includes worker memory snapshots in timing results", async () => {
    const previousTiming = process.env["NKDK_VALIDATION_TIMING"]
    process.env["NKDK_VALIDATION_TIMING"] = "1"

    try {
      await runValidationWorkerTask({
        kind: "init",
        context,
        rulesSnapshot: createValidationRulesSnapshot(context),
      })

      const result = await runValidationWorkerTask({
        kind: "firstPass",
        projectDir: "/project",
        context,
        filePaths: [],
      })

      expect(result).toMatchObject({
        kind: "firstPassResult",
        timing: {
          memory: {
            startRssMb: expect.any(Number),
            endRssMb: expect.any(Number),
            peakRssMb: expect.any(Number),
            startHeapUsedMb: expect.any(Number),
            endHeapUsedMb: expect.any(Number),
            peakHeapUsedMb: expect.any(Number),
          },
        },
      })
    } finally {
      if (previousTiming === undefined) {
        delete process.env["NKDK_VALIDATION_TIMING"]
      } else {
        process.env["NKDK_VALIDATION_TIMING"] = previousTiming
      }
    }
  }, 120_000)
})

function emptySharedSnapshot() {
  return createSharedValidationSnapshot({
    records: [],
    filePaths: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
  })
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}
