import { join, resolve } from "node:path"
import { expect, it } from "vitest"
import type { BaselineReference } from "./baseline"
import type { ScenarioResult } from "./stepwise-scenario"
import type { StepwiseRunMetadata } from "./stepwise-report"
import { parseStepwiseArgs, runStepwiseCli, type StepwiseRunDependencies } from "./stepwise-run"
import type { StepwiseRunWorkspace } from "./stepwise-workspace"

it("по умолчанию планирует оба режима с auto", () => {
  expect(parseStepwiseArgs(["--root", runRoot])).toMatchObject({
    root: runRoot,
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
    root: runRoot,
    baselineDir: join(runRoot, "baseline"),
    reportsDir: join(runRoot, "reports"),
    runStatePath: join(runRoot, "run-state.json"),
    scenario: () => ({} as never),
  } satisfies StepwiseRunWorkspace
  const dependencies: StepwiseRunDependencies = {
    resources: () => ({ cpuCount: 8, availableMemoryBytes: 16_000_000_000 }),
    async sourceRevision() { return "abc123" },
    async openWorkspace() { return workspace },
    async resetWorkspace() {},
    async prepareBaseline() {
      return {
        archivePath: join(runRoot, "baseline", "current", "baseline.dt"),
        projectDir: join(runRoot, "baseline", "current", "project"),
        manifest: {
          version: 3, compatibilityHash: "compatibility", fixtureHashes: { cf: "cf", cfe: "cfe" },
          platformVersion: "8.3.27.2214", nkdkBuildId: "mcp-build",
          archiveSha256: "archive", projectSha256: "project", componentStateSha256: "components",
        },
      } satisfies BaselineReference
    },
    async recoverInterruptedAttempts() {},
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
    async recordEvent() {},
  }

  const outcome = await runStepwiseCli([
    "--root", runRoot, "--workers", "2",
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

it("не готовит эталон и не запускает отключённый нулевым пределом режим", async () => {
  const fixture = runFixture()

  const outcome = await runStepwiseCli([
    "--root", runRoot, "--designer-workers", "0", "--standalone-workers", "1",
  ], fixture.dependencies)

  expect(fixture.baselineModes).toEqual(["standalone-server"])
  expect(fixture.startedModes).toEqual(["standalone-server"])
  expect(outcome.scenarios.map(({ mode }) => mode)).toEqual(["standalone-server"])
})

it("восстанавливает оборванные попытки до запуска новых", async () => {
  const order: string[] = []
  const fixture = runFixture(async ({ mode }) => {
    order.push(`run:${mode}`)
    return result(mode, "succeeded")
  })
  const dependencies = Object.assign(fixture.dependencies, {
    async recoverInterruptedAttempts() { order.push("recover") },
  })

  await runStepwiseCli(["--root", runRoot, "--mode", "designer-agent"], dependencies)

  expect(order).toEqual(["recover", "run:designer-agent"])
})

it("записывает прерванный сигналом режим в отчёт", async () => {
  const controller = new AbortController()
  const fixture = runFixture(async ({ mode, signal }) => {
    controller.abort()
    await Promise.resolve()
    return result(mode, signal.aborted ? "interrupted" : "succeeded")
  })

  const outcome = await runStepwiseCli(["--root", runRoot, "--mode", "designer-agent"],
    fixture.dependencies, controller.signal)

  expect(outcome.scenarios[0].status).toBe("interrupted")
  expect(fixture.recorded.map(({ status }) => status)).toEqual(["interrupted"])
})

function runFixture(runMode?: StepwiseRunDependencies["runMode"]) {
  const baselineModes: string[] = []
  const startedModes: string[] = []
  const recorded: ScenarioResult[] = []
  const workspace = {
    root: runRoot, baselineDir: join(runRoot, "baseline"), reportsDir: join(runRoot, "reports"),
    runStatePath: join(runRoot, "run-state.json"), scenario: () => ({} as never),
  } satisfies StepwiseRunWorkspace
  const dependencies: StepwiseRunDependencies = {
    resources: () => ({ cpuCount: 8, availableMemoryBytes: 16_000_000_000 }),
    async sourceRevision() { return "abc123" },
    async openWorkspace() { return workspace },
    async resetWorkspace() {},
    async prepareBaseline({ mode }) {
      baselineModes.push(mode)
      return {
        archivePath: join(runRoot, "baseline", "current", "baseline.dt"),
        projectDir: join(runRoot, "baseline", "current", "project"),
        manifest: {
          version: 3, compatibilityHash: "compatibility", fixtureHashes: { cf: "cf", cfe: "cfe" },
          platformVersion: "8.3.27.2214", nkdkBuildId: "mcp-build",
          archiveSha256: "archive", projectSha256: "project", componentStateSha256: "components",
        },
      }
    },
    async recoverInterruptedAttempts() {},
    runMode: runMode ?? (async ({ mode }) => {
      startedModes.push(mode)
      return result(mode, "succeeded")
    }),
    async record(_reportDir, value) { recorded.push(value) },
    async recordEvent() {},
  }
  return { baselineModes, startedModes, recorded, dependencies }
}

function result(mode: ScenarioResult["mode"], status: ScenarioResult["status"]): ScenarioResult {
  return {
    id: "existing-partial-sync", mode, status, completedSteps: status === "succeeded" ? 1 : 0,
    totalSteps: 1, durationMs: 1, attempt: 1, steps: [],
  }
}

const runRoot = resolve("/run")
