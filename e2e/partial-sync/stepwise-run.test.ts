import { expect, it } from "vitest"
import type { BaselineReference } from "./baseline"
import type { ScenarioResult } from "./stepwise-scenario"
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
  const workspace = {
    root: "C:/run",
    baselineDir: "C:/run/baseline",
    reportsDir: "C:/run/reports",
    runStatePath: "C:/run/run-state.json",
    scenario: () => ({} as never),
  } satisfies StepwiseRunWorkspace
  const dependencies: StepwiseRunDependencies = {
    resources: () => ({ cpuCount: 8, availableMemoryBytes: 16_000_000_000 }),
    async openWorkspace() { return workspace },
    async resetWorkspace() {},
    async prepareBaseline() { return {} as BaselineReference },
    async runMode({ mode }) {
      running += 1
      maxRunning = Math.max(maxRunning, running)
      await Promise.resolve()
      running -= 1
      completed.push(mode)
      return result(mode, mode === "designer-agent" ? "failed" : "succeeded")
    },
    async record() {},
  }

  const outcome = await runStepwiseCli([
    "--root", "C:/run", "--workers", "2",
  ], dependencies)

  expect(maxRunning).toBeLessThanOrEqual(2)
  expect(completed).toEqual(["designer-agent", "standalone-server"])
  expect(outcome.scenarios.map(({ status }) => status)).toEqual(["failed", "succeeded"])
})

function result(mode: ScenarioResult["mode"], status: ScenarioResult["status"]): ScenarioResult {
  return {
    id: "existing-partial-sync", mode, status, completedSteps: status === "succeeded" ? 1 : 0,
    totalSteps: 1, durationMs: 1, attempt: 1, steps: [],
  }
}
