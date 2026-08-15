import type { ScenarioBlock } from "./matrix/types"
import {
  runPartialSyncScenario,
  type ScenarioDependencies,
} from "./scenario"
import type { PartialSyncSteps } from "./steps"
import type { ScenarioTimingReport } from "./timing"
import type { ScenarioWorkspace } from "./workspace"

export class ExpectedRecoveryProbeInterruption extends Error {
  constructor(readonly blockKey: string) {
    super(`Ожидаемое прерывание после блока ${blockKey}`)
    this.name = "ExpectedRecoveryProbeInterruption"
  }
}

type ScenarioAttempt = {
  readonly steps: PartialSyncSteps
  close(): Promise<void>
}

export type RecoveryProbeParams = {
  readonly workspace: ScenarioWorkspace
  readonly plan: readonly ScenarioBlock[]
  readonly planHash: string
  readonly recoveryProbeBlockKey: ScenarioBlock["key"]
  openAttempt(workspace: ScenarioWorkspace): Promise<ScenarioAttempt>
  reopenWorkspace(): Promise<ScenarioWorkspace>
  readonly scenarioDependencies?: ScenarioDependencies
  readonly timingReport?: ScenarioTimingReport
  readonly now?: () => number
}

export async function runScenarioWithRecoveryProbe(params: RecoveryProbeParams): Promise<void> {
  let interrupted = false
  const firstAttempt = await params.openAttempt(params.workspace)
  try {
    await runPartialSyncScenario({
      workspace: params.workspace,
      plan: params.plan,
      planHash: params.planHash,
      steps: interruptAfterProbe(firstAttempt.steps, params.recoveryProbeBlockKey),
      timingReport: params.timingReport,
      now: params.now,
    }, params.scenarioDependencies)
  } catch (caught) {
    if (!(caught instanceof ExpectedRecoveryProbeInterruption)) throw caught
    interrupted = true
  } finally {
    await firstAttempt.close()
  }

  if (!interrupted) return

  const resumedWorkspace = await params.reopenWorkspace()
  const secondAttempt = await params.openAttempt(resumedWorkspace)
  try {
    await runPartialSyncScenario({
      workspace: resumedWorkspace,
      plan: params.plan,
      planHash: params.planHash,
      steps: secondAttempt.steps,
      timingReport: params.timingReport,
      now: params.now,
    }, params.scenarioDependencies)
  } finally {
    await secondAttempt.close()
  }
}

function interruptAfterProbe(
  steps: PartialSyncSteps,
  probeBlockKey: ScenarioBlock["key"],
): PartialSyncSteps {
  return {
    ...steps,
    async executeBlock(block, progress) {
      const timing = await steps.executeBlock(block, progress)
      if (block.key === probeBlockKey) throw new ExpectedRecoveryProbeInterruption(block.key)
      return timing
    },
  }
}
