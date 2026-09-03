import { expect, it } from "vitest"
import type { BaselineReference } from "./baseline"
import type { ScenarioResult } from "./stepwise-scenario"
import type { StepwiseRunMetadata } from "./stepwise-report"
import { parseStepwiseArgs, runStepwiseCli, type StepwiseRunDependencies } from "./stepwise-run"
import type { StepwiseRunWorkspace } from "./stepwise-workspace"

it("по умолчанию планирует оба режима с auto", () => {
  expect(parseStepwiseArgs(["--root", "C:/run"])).toMatchObject({
    root: "C:\\run",
    reset: false,
    concurrency: { total: "auto", designerAgent: "auto", standaloneServer: "auto" },
    modes: ["designer-agent", "standalone-server"],
  })
})

it("соблюдает общий предел и не отменяет парный сценарий", async () => {
  let running = 0
  let maxRunning = 0
  const completed: string[] = []
  let recordedMetadata: StepwiseRunMetadata | undefined
  const events: string[] = []
  const workspace = {
    root: "C:/run",
    baselineDir: "C:/run/baseline",
    reportsDir: "C:/run/reports",
    runStatePath: "C:/run/run-state.json",
    scenario: () => ({} as never),
  } satisfies StepwiseRunWorkspace
  const dependencies: StepwiseRunDependencies = {
    resources: () => ({ cpuCount: 8, availableMemoryBytes: 16_000_000_000 }),
    async sourceRevision() { return "abc123" },
    async openWorkspace() { return workspace },
    async resetWorkspace() {},
    async prepareBaseline() {
      return {
        archivePath: "C:/run/baseline/current/baseline.dt",
        projectDir: "C:/run/baseline/current/project",
        manifest: {
          version: 1, compatibilityHash: "compatibility", fixtureHashes: { cf: "cf", cfe: "cfe" },
          platformVersion: "8.3.27.2214", nkdkBuildId: "mcp-build",
          archiveSha256: "archive", projectSha256: "project",
        },
      } satisfies BaselineReference
    },
    async runMode({ mode }) {
      events.push(`start:${mode}`)
      running += 1
      maxRunning = Math.max(maxRunning, running)
      if (mode === "standalone-server") {
        await new Promise((resolve) => setTimeout(resolve, 30))
      }
      running -= 1
      completed.push(mode)
      events.push(`finish:${mode}`)
      return result(mode, mode === "designer-agent" ? "failed" : "succeeded")
    },
    async record(_reportDir, value, metadata) {
      recordedMetadata = metadata
      events.push(`record:${value.mode}`)
    },
  }

  const outcome = await runStepwiseCli([
    "--root", "C:/run", "--workers", "2",
  ], dependencies)

  expect(maxRunning).toBeLessThanOrEqual(2)
  expect(completed).toEqual(["designer-agent", "standalone-server"])
  expect(outcome.scenarios.map(({ status }) => status)).toEqual(["failed", "succeeded"])
  expect(events.indexOf("record:designer-agent")).toBeLessThan(
    events.indexOf("finish:standalone-server"),
  )
  expect(recordedMetadata).toMatchObject({
    sourceRevision: "abc123",
    mcpBuildId: "mcp-build",
    platformVersion: "8.3.27.2214",
    compatibilityHash: "compatibility",
    concurrency: { total: 2, designerAgent: 2, standaloneServer: 2 },
    scenarioIds: [
      "designer-agent/existing-partial-sync",
      "standalone-server/existing-partial-sync",
    ],
  })
})

function result(mode: ScenarioResult["mode"], status: ScenarioResult["status"]): ScenarioResult {
  return {
    id: "existing-partial-sync", mode, status, completedSteps: status === "succeeded" ? 1 : 0,
    totalSteps: 1, durationMs: 1, attempt: 1, steps: [],
  }
}
