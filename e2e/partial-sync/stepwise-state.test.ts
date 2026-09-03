import { describe, expect, it } from "vitest"
import { createInitialStepwiseState, parseStepwiseState } from "./stepwise-state"

describe("stepwise scenario state", () => {
  it("создаёт начальное состояние конкретного режима", () => {
    expect(createInitialStepwiseState({
      mode: "designer-agent",
      compatibilityHash: "a".repeat(64),
      planHash: "b".repeat(64),
    })).toEqual({
      version: 1,
      scenario: "existing-partial-sync",
      mode: "designer-agent",
      compatibilityHash: "a".repeat(64),
      planHash: "b".repeat(64),
      completedStepKey: null,
      completedStepIndex: -1,
      attempt: 1,
      checkpoint: null,
    })
  })

  it("отвергает несогласованные ключ и индекс шага", () => {
    const state = {
      ...createInitialStepwiseState({
        mode: "standalone-server",
        compatibilityHash: "a".repeat(64),
        planHash: "b".repeat(64),
      }),
      completedStepKey: "step-1",
      completedStepIndex: -1,
      checkpoint: "checkpoint/current.dt",
    }

    expect(() => parseStepwiseState(state)).toThrow("несогласован")
  })
})
