import { expect, it } from "vitest"
import type { ScenarioBlock } from "./matrix/types"
import type { PartialSyncSteps } from "./steps"
import type { ScenarioState, ScenarioWorkspace } from "./workspace"
import { runScenarioWithRecoveryProbe } from "./recovery-probe"

const planHash = "a".repeat(64)
const plan: readonly ScenarioBlock[] = ["roots:create:probe", "roots:create:bulk"].map((key) => ({
  key: key as ScenarioBlock["key"],
  layerKey: "roots:create",
  componentPath: "cf",
  operations: [],
}))

it("closes the interrupted session, restores and repeats the uncommitted block", async () => {
  let state = scenarioState(null, null)
  let closeCount = 0
  const executed: string[] = []
  const restored: ScenarioState[] = []
  const steps: PartialSyncSteps = {
    async prepareBaseline() {},
    async executeBlock(block) {
      executed.push(block.key)
      return { applyMs: 1, validationMs: 2, synchronizeMs: 3, unchangedMs: 4 }
    },
    async verifyFinalState() {},
  }

  await runScenarioWithRecoveryProbe({
    workspace,
    plan,
    planHash,
    recoveryProbeBlockKey: "roots:create:probe",
    async openAttempt() { return { steps, async close() { closeCount += 1 } } },
    async reopenWorkspace() { return workspace },
    scenarioDependencies: {
      async readState() { return state },
      async restoreCheckpoint(_workspace, restoredState) { restored.push(restoredState) },
      async publishCheckpoint(_workspace, publication) {
        state = scenarioState(publication.completedBlock)
        return state
      },
    },
  })

  expect(closeCount).toBe(2)
  expect(executed).toEqual([
    "roots:create:probe",
    "roots:create:probe",
    "roots:create:bulk",
  ])
  expect(restored).toEqual([expect.objectContaining({ completedBlock: null })])
})

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
