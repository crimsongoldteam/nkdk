import { describe, expect, it } from "vitest"
import type { ScenarioState, ScenarioWorkspace, StageId } from "./workspace"
import { runPartialSyncScenario } from "./scenario"

describe("partial sync scenario", () => {
  it.each([
    [null, ["baseline", "catalog", "attribute"]],
    ["01-baseline", ["catalog", "attribute"]],
    ["02-catalog", ["attribute"]],
    ["03-attribute", []],
  ] as const)("continues after %s", async (completedStage, expected) => {
    const calls: string[] = []
    const stages = {
      async baseline() { calls.push("baseline") },
      async catalog() { calls.push("catalog") },
      async attribute() { calls.push("attribute") },
    }
    const dependencies = {
      async readState() { return scenarioState(completedStage) },
      async restoreCheckpoint() { calls.push("restore") },
      async publishCheckpoint(_workspace: ScenarioWorkspace, stage: StageId) {
        calls.push(`publish:${stage}`)
        return scenarioState(stage)
      },
    }

    await runPartialSyncScenario(workspace, stages, dependencies)

    expect(calls.filter((call) => !call.startsWith("publish:") && call !== "restore"))
      .toEqual(expected)
    expect(calls.filter((call) => call.startsWith("publish:"))).toEqual(
      expected.map((name) => `publish:${stageByName[name]}`)
    )
    expect(calls.filter((call) => call === "restore")).toHaveLength(
      completedStage === null ? 0 : 1
    )
  })

  it("retries a failed stage from the last published checkpoint", async () => {
    const calls: string[] = []
    let state = scenarioState(null)
    let failCatalog = true
    const stages = {
      async baseline() { calls.push("baseline") },
      async catalog() {
        calls.push("catalog")
        if (failCatalog) throw new Error("planned catalog failure")
      },
      async attribute() { calls.push("attribute") },
    }
    const dependencies = {
      async readState() { return state },
      async restoreCheckpoint() { calls.push(`restore:${state.completedStage}`) },
      async publishCheckpoint(_workspace: ScenarioWorkspace, stage: StageId) {
        state = scenarioState(stage)
        calls.push(`publish:${stage}`)
        return state
      },
    }

    await expect(runPartialSyncScenario(workspace, stages, dependencies))
      .rejects.toThrow("planned catalog failure")
    expect(state.completedStage).toBe("01-baseline")

    calls.length = 0
    failCatalog = false
    await runPartialSyncScenario(workspace, stages, dependencies)

    expect(calls).toEqual([
      "restore:01-baseline",
      "catalog",
      "publish:02-catalog",
      "attribute",
      "publish:03-attribute",
    ])
  })
})

const stageByName: Record<string, StageId> = {
  baseline: "01-baseline",
  catalog: "02-catalog",
  attribute: "03-attribute",
}

function scenarioState(completedStage: StageId | null): ScenarioState {
  return {
    version: 1,
    scenario: "partial-sync-catalog-attribute",
    completedStage,
    checkpoint: completedStage === null ? null : `checkpoints/${completedStage}`,
  }
}

const workspace = {
  root: "/workspace",
  baseDir: "/workspace/base",
  dataDir: "/workspace/data",
  projectDir: "/workspace/project",
  checkpointsDir: "/workspace/checkpoints",
  verificationDir: "/workspace/verification",
  logsDir: "/workspace/logs",
  statePath: "/workspace/state.json",
} satisfies ScenarioWorkspace
