import { describe, expect, it } from "vitest"
import { partialSyncMatrix } from "./matrix"
import { buildScenarioPlan } from "./plan"
import { buildStepwisePlan, stepwisePlanHash } from "./stepwise-plan"

describe("stepwise plan", () => {
  it("разворачивает каждую существующую операцию в отдельный шаг", () => {
    const blocks = buildScenarioPlan(partialSyncMatrix)
    const steps = buildStepwisePlan(partialSyncMatrix)

    expect(steps.map(({ operation }) => operation.key))
      .toEqual(blocks.flatMap(({ operations }) => operations.map(({ key }) => key)))
    expect(new Set(steps.map(({ key }) => key)).size).toBe(steps.length)
  })

  it("строит стабильный хэш полного содержания", () => {
    const steps = buildStepwisePlan(partialSyncMatrix)

    expect(stepwisePlanHash(steps)).toMatch(/^[a-f0-9]{64}$/u)
    expect(stepwisePlanHash(steps)).toBe(stepwisePlanHash(steps))
    expect(stepwisePlanHash(steps)).not.toBe(stepwisePlanHash(steps.slice(1)))
  })
})
