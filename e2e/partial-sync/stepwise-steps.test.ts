import { expect, it } from "vitest"
import { join } from "node:path"
import type { ScenarioStep } from "./stepwise-plan"
import { createStepwiseSteps, StepExecutionFailure, type StepwiseStepDependencies } from "./stepwise-steps"

it("подтверждает каждый шаг повторным импортом до checkpoint", async () => {
  const fixture = createFixture()
  await fixture.executor.execute(fixture.step, { index: 1, total: 1 })

  expect(fixture.calls).toEqual([
    "apply", "validate-source", "sync:synchronized", "prepare-verification",
    "close-source",
    "import-verification", "validate-verification", "compare-component",
    "close-verification", "sync:unchanged",
  ])
})

it("не принимает повторный импорт как новое ожидание", async () => {
  const fixture = createFixture({ comparisonEqual: false })

  await expect(fixture.executor.execute(fixture.step, { index: 1, total: 1 }))
    .rejects.toThrow("Сравнение")
  expect(fixture.calls).not.toContain("sync:unchanged")
})

it("прикладывает к ошибке ключ шага, журнал и завершённые стадии", async () => {
  const fixture = createFixture({ failSourceValidation: true })

  const failure = await fixture.executor.execute(fixture.step, { index: 1, total: 1 })
    .catch((caught: unknown) => caught)

  expect(failure).toBeInstanceOf(StepExecutionFailure)
  expect((failure as StepExecutionFailure).stepResult).toEqual({
    stepKey: "objects:create",
    stageTimings: { apply: 1 },
    failedStage: "validation",
    attemptLogDir: join("logs", "attempt-1-objects-create"),
  })
})

function createFixture(options: {
  readonly comparisonEqual?: boolean
  readonly failSourceValidation?: boolean
} = {}) {
  const calls: string[] = []
  const dependencies: StepwiseStepDependencies = {
    operationId: () => "attempt-1",
    now: (() => { let value = 0; return () => ++value })(),
    async prepareAttemptLog() {},
    async applyStep() { calls.push("apply") },
    async validate(_session, projectDir) {
      calls.push(projectDir === "source" ? "validate-source" : "validate-verification")
      if (projectDir === "source" && options.failSourceValidation) throw new Error("validation failed")
    },
    async sync(_session, _projectDir, _componentPath, _logDir, status) {
      calls.push(`sync:${status}`)
    },
    async prepareVerification() { calls.push("prepare-verification") },
    async closeSource() { calls.push("close-source") },
    async importVerification() { calls.push("import-verification") },
    async compareComponent() {
      calls.push("compare-component")
      return options.comparisonEqual ?? true
    },
    async closeVerification() { calls.push("close-verification") },
  }
  const step: ScenarioStep = {
    key: "objects:create",
    layerKey: "objects",
    componentPath: "cf",
    sourceOperationKeys: ["create"],
    operation: { key: "create", kind: "change", changes: [] },
  }
  return {
    calls,
    step,
    executor: createStepwiseSteps({
      workspace: {
        root: "root", baseDir: "base", dataDir: "data", projectDir: "source",
        checkpointDir: "checkpoint", verificationDir: "verification", logsDir: "logs",
        statePath: "state.json",
      },
      session: { async call<T>() { return {} as T }, async close() {} },
      mode: "designer-agent",
      baselineProjectDir: "baseline",
      extensionName: "Расширение_All",
    }, dependencies),
  }
}
