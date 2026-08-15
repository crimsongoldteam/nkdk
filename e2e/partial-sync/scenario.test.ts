import { describe, expect, it } from "vitest"
import type { ScenarioBlock } from "./matrix/types"
import type { PartialSyncSteps } from "./steps"
import type { ScenarioState, ScenarioWorkspace } from "./workspace"
import { runPartialSyncScenario } from "./scenario"

const planHash = "a".repeat(64)
const plan = ["one:probe", "one:bulk", "two:probe", "two:bulk"].map((key): ScenarioBlock => ({
  key,
  layerKey: key.split(":")[0],
  componentPath: "cf",
  operations: [{ key: `object:${key}`, kind: "create-object", changes: [] }],
}))

describe("partial sync scenario", () => {
  it("prepares baseline and publishes every completed block", async () => {
    const fixture = scenarioFixture(scenarioState(null, null))

    await runPartialSyncScenario({ workspace, plan, planHash, steps: fixture.steps }, fixture.dependencies)

    expect(fixture.calls).toEqual([
      "baseline",
      "publish:baseline",
      "execute:one:probe:1/4",
      "publish:one:probe",
      "execute:one:bulk:2/4",
      "publish:one:bulk",
      "execute:two:probe:3/4",
      "publish:two:probe",
      "execute:two:bulk:4/4",
      "publish:two:bulk",
      "verify-final",
    ])
  })

  it("restores and continues with the block after completedBlock", async () => {
    const fixture = scenarioFixture(scenarioState("one:bulk"))

    await runPartialSyncScenario({ workspace, plan, planHash, steps: fixture.steps }, fixture.dependencies)

    expect(fixture.calls).toEqual([
      "restore:one:bulk",
      "execute:two:probe:3/4",
      "publish:two:probe",
      "execute:two:bulk:4/4",
      "publish:two:bulk",
      "verify-final",
    ])
  })

  it("does not publish a failed block and repeats it on the next run", async () => {
    const fixture = scenarioFixture(scenarioState("one:probe"), "one:bulk")

    await expect(runPartialSyncScenario(
      { workspace, plan, planHash, steps: fixture.steps },
      fixture.dependencies,
    )).rejects.toThrow("planned block failure")
    expect(fixture.state.completedBlock).toBe("one:probe")
    expect(fixture.calls).not.toContain("publish:one:bulk")

    fixture.failKey = undefined
    fixture.calls.length = 0
    await runPartialSyncScenario(
      { workspace, plan, planHash, steps: fixture.steps },
      fixture.dependencies,
    )
    expect(fixture.calls.slice(0, 3)).toEqual([
      "restore:one:probe",
      "execute:one:bulk:2/4",
      "publish:one:bulk",
    ])
  })

  it.each([
    ["unknown completed key", scenarioState("unknown:probe"), /unknown:probe/u],
    ["different plan hash", { ...scenarioState("one:probe"), planHash: "b".repeat(64) }, /хэш|план/iu],
  ] as const)("rejects %s before restoring", async (_name, state, message) => {
    const fixture = scenarioFixture(state)
    await expect(runPartialSyncScenario(
      { workspace, plan, planHash, steps: fixture.steps }, fixture.dependencies,
    )).rejects.toThrow(message)
    expect(fixture.calls).toEqual([])
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
      async executeBlock(block, progress) {
        calls.push(`execute:${block.key}:${progress.index}/${progress.total}`)
        if (block.key === fixture.failKey) throw new Error("planned block failure")
      },
      async verifyFinalState() { calls.push("verify-final") },
    } satisfies PartialSyncSteps,
    dependencies: {
      async readState() { return fixture.state },
      async restoreCheckpoint(_workspace: ScenarioWorkspace, state: ScenarioState) {
        calls.push(`restore:${state.completedBlock ?? "baseline"}`)
      },
      async publishCheckpoint(
        _workspace: ScenarioWorkspace,
        publication: { completedBlock: string | null; planHash: string },
      ) {
        calls.push(`publish:${publication.completedBlock ?? "baseline"}`)
        fixture.state = scenarioState(publication.completedBlock)
        return fixture.state
      },
    },
  }
  return fixture
}

function scenarioState(
  completedBlock: string | null,
  checkpoint: "checkpoints/current" | null = "checkpoints/current",
): ScenarioState {
  return {
    version: 3,
    scenario: "partial-sync-layered-matrix",
    completedBlock,
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
