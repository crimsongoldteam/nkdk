import { expect, it } from "vitest"
import { runStepwiseScenario, type StepwiseScenarioDependencies } from "./stepwise-scenario"
import { createInitialStepwiseState } from "./stepwise-state"
import type { ScenarioStep } from "./stepwise-plan"

it("начинает со следующего шага после восстановления", async () => {
  const fixture = createFixture({ completedStepIndex: 0 })
  const result = await runStepwiseScenario(fixture.params, fixture.dependencies)

  expect(fixture.executed).toEqual(["step-1", "step-2"])
  expect(result.status).toBe("succeeded")
})

it("не публикует checkpoint упавшего шага", async () => {
  const fixture = createFixture({ failStepIndex: 1 })
  const result = await runStepwiseScenario(fixture.params, fixture.dependencies)

  expect(result.status).toBe("failed")
  expect(fixture.published).toEqual(["step-0"])
  expect(result.failure?.category).toBe("platform")
})

function createFixture(options: { readonly completedStepIndex?: number; readonly failStepIndex?: number } = {}) {
  const steps = [0, 1, 2].map(step)
  const initial = createInitialStepwiseState({
    mode: "designer-agent", compatibilityHash: "a".repeat(64), planHash: "b".repeat(64),
  })
  let state = options.completedStepIndex === undefined || options.completedStepIndex < 0
    ? initial
    : {
      ...initial,
      completedStepIndex: options.completedStepIndex,
      completedStepKey: steps[options.completedStepIndex].key,
      checkpoint: "checkpoint/current.dt" as const,
    }
  const executed: string[] = []
  const published: string[] = []
  const dependencies: StepwiseScenarioDependencies = {
    now: (() => { let value = 0; return () => ++value })(),
    async restore() {},
    async execute(current) {
      executed.push(current.key)
      if (current === steps[options.failStepIndex ?? -1]) throw new Error("Ошибка платформы 1С")
      return { stepKey: current.key, stageTimings: timings(), attemptLogDir: `logs/${current.key}` }
    },
    async publish(params) {
      published.push(params.step.key)
      state = {
        ...params.state,
        completedStepIndex: params.stepIndex,
        completedStepKey: params.step.key,
        checkpoint: "checkpoint/current.dt",
      }
      return state
    },
  }
  return {
    executed,
    published,
    dependencies,
    params: {
      id: "existing-partial-sync",
      mode: "designer-agent" as const,
      workspace: {} as never,
      baseline: {} as never,
      state,
      steps,
    },
  }
}

function step(index: number): ScenarioStep {
  return {
    key: `step-${index}`, layerKey: "objects", componentPath: "cf",
    operation: { key: `operation-${index}`, kind: "change", changes: [] },
  }
}

function timings() {
  return {
    apply: 1, validation: 1, sync: 1, verificationImport: 1,
    verificationValidation: 1, comparison: 1, unchanged: 1,
  }
}
