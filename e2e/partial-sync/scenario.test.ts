import { describe, expect, it } from "vitest"
import type { ScenarioOperation } from "./matrix/types"
import type { PartialSyncSteps } from "./steps"
import type { ScenarioState, ScenarioWorkspace } from "./workspace"
import { runPartialSyncScenario } from "./scenario"

const planHash = "a".repeat(64)
const plan = ["one", "two", "three", "four"].map((key): ScenarioOperation => ({
  key: `object:${key}`,
  kind: "create-object",
  changes: [],
}))

describe("partial sync scenario", () => {
  it("prepares baseline and publishes every operation from empty state", async () => {
    const fixture = scenarioFixture(scenarioState(null, null))

    await runPartialSyncScenario({ workspace, plan, planHash, steps: fixture.steps }, fixture.dependencies)

    expect(fixture.calls).toEqual([
      "baseline",
      "publish:baseline",
      "execute:object:one:1/4",
      "publish:object:one",
      "execute:object:two:2/4",
      "publish:object:two",
      "execute:object:three:3/4",
      "publish:object:three",
      "execute:object:four:4/4",
      "publish:object:four",
    ])
  })

  it("restores the checkpoint and continues after the completed key", async () => {
    const fixture = scenarioFixture(scenarioState("object:three"))

    await runPartialSyncScenario({ workspace, plan, planHash, steps: fixture.steps }, fixture.dependencies)

    expect(fixture.calls).toEqual([
      "restore:object:three",
      "execute:object:four:4/4",
      "publish:object:four",
    ])
  })

  it("only restores when the last operation is already complete", async () => {
    const fixture = scenarioFixture(scenarioState("object:four"))

    await runPartialSyncScenario({ workspace, plan, planHash, steps: fixture.steps }, fixture.dependencies)

    expect(fixture.calls).toEqual(["restore:object:four"])
  })

  it.each([
    ["unknown completed key", scenarioState("object:unknown"), /object:unknown/u],
    ["different plan hash", { ...scenarioState("object:one"), planHash: "b".repeat(64) }, /хэш|план/iu],
  ] as const)("rejects %s before restoring", async (_name, state, message) => {
    const fixture = scenarioFixture(state)

    await expect(runPartialSyncScenario(
      { workspace, plan, planHash, steps: fixture.steps },
      fixture.dependencies,
    )).rejects.toThrow(message)
    expect(fixture.calls).toEqual([])
  })

  it("does not publish a failed operation and retries it on the next run", async () => {
    const fixture = scenarioFixture(scenarioState("object:one"), "object:two")

    await expect(runPartialSyncScenario(
      { workspace, plan, planHash, steps: fixture.steps },
      fixture.dependencies,
    )).rejects.toThrow("planned operation failure")
    expect(fixture.state.completedOperation).toBe("object:one")

    fixture.failKey = undefined
    fixture.calls.length = 0
    await runPartialSyncScenario(
      { workspace, plan, planHash, steps: fixture.steps },
      fixture.dependencies,
    )

    expect(fixture.calls.slice(0, 3)).toEqual([
      "restore:object:one",
      "execute:object:two:2/4",
      "publish:object:two",
    ])
  })
})

function scenarioFixture(initialState: ScenarioState, initialFailKey?: string) {
  const calls: string[] = []
  const fixture = {
    calls,
    state: initialState,
    failKey: initialFailKey as string | undefined,
    steps: {
      async prepareBaseline() { calls.push("baseline") },
      async executeOperation(operation, progress) {
        calls.push(`execute:${operation.key}:${progress.index}/${progress.total}`)
        if (operation.key === fixture.failKey) throw new Error("planned operation failure")
      },
    } satisfies PartialSyncSteps,
    dependencies: {
      async readState() { return fixture.state },
      async restoreCheckpoint(_workspace: ScenarioWorkspace, state: ScenarioState) {
        calls.push(`restore:${state.completedOperation ?? "baseline"}`)
      },
      async publishCheckpoint(
        _workspace: ScenarioWorkspace,
        publication: { completedOperation: string | null; planHash: string },
      ) {
        calls.push(`publish:${publication.completedOperation ?? "baseline"}`)
        fixture.state = scenarioState(publication.completedOperation)
        return fixture.state
      },
    },
  }
  return fixture
}

function scenarioState(
  completedOperation: string | null,
  checkpoint: "checkpoints/current" | null = "checkpoints/current",
): ScenarioState {
  return {
    version: 2,
    scenario: "partial-sync-matrix",
    completedOperation,
    checkpoint,
    planHash,
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
