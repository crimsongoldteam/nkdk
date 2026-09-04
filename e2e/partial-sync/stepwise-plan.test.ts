import { describe, expect, it } from "vitest"
import { partialSyncMatrix } from "./matrix"
import { buildScenarioPlan } from "./plan"
import { buildStepwisePlan, stepwisePlanHash } from "./stepwise-plan"

describe("stepwise plan", () => {
  it("сохраняет каждую существующую операцию и объединяет только невалидные промежуточные состояния", () => {
    const blocks = buildScenarioPlan(partialSyncMatrix)
    const steps = buildStepwisePlan(partialSyncMatrix)

    const sourceKeys = steps.flatMap(({ sourceOperationKeys }) => sourceOperationKeys)
    const originalKeys = blocks.flatMap(({ operations }) => operations.map(({ key }) => key))
    expect(sourceKeys).toHaveLength(originalKeys.length)
    expect(sourceKeys.toSorted()).toEqual(originalKeys.toSorted())
    expect(new Set(steps.map(({ key }) => key)).size).toBe(steps.length)
    expect(steps.map(({ key }) => key)).toContain(
      "roots:create:object:document+object:accumulation-register",
    )
    expect(steps.map(({ key }) => key)).toContain(
      "roots:remove:remove:object:accumulation-register+remove:object:document-journal+remove:object:document",
    )
  })

  it("строит стабильный хэш полного содержания", () => {
    const steps = buildStepwisePlan(partialSyncMatrix)

    expect(stepwisePlanHash(steps)).toMatch(/^[a-f0-9]{64}$/u)
    expect(stepwisePlanHash(steps)).toBe(stepwisePlanHash(steps))
    expect(stepwisePlanHash(steps)).not.toBe(stepwisePlanHash(steps.slice(1)))
  })
})
