import { randomUUID } from "node:crypto"
import { join } from "node:path"
import { openScenarioMcpSession, type ScenarioMcpSession } from "./mcp-session"
import {
  runPartialSyncScenario,
  type RunPartialSyncScenarioParams,
} from "./scenario"
import { createPartialSyncSteps, type PartialSyncSteps } from "./steps"

export type RunExternalPartialSyncScenarioParams = Omit<
  RunPartialSyncScenarioParams,
  "steps"
> & {
  readonly mode: "designer-agent" | "standalone-server"
}

export type ExternalPartialSyncDependencies = {
  openSession(params: { readonly attemptLogDir: string }): Promise<ScenarioMcpSession>
  createSteps(params: {
    readonly workspace: RunExternalPartialSyncScenarioParams["workspace"]
    readonly session: ScenarioMcpSession
    readonly mode: RunExternalPartialSyncScenarioParams["mode"]
  }): PartialSyncSteps
  runScenario(params: RunPartialSyncScenarioParams): Promise<void>
}

export async function runExternalPartialSyncScenario(
  params: RunExternalPartialSyncScenarioParams,
  dependencies: ExternalPartialSyncDependencies = defaultDependencies,
): Promise<void> {
  const session = await dependencies.openSession({
    attemptLogDir: join(params.workspace.logsDir, `${randomUUID()}-scenario`),
  })
  try {
    const steps = dependencies.createSteps({
      workspace: params.workspace,
      session,
      mode: params.mode,
    })
    await dependencies.runScenario({
      workspace: params.workspace,
      plan: params.plan,
      planHash: params.planHash,
      steps,
      timingReport: params.timingReport,
      now: params.now,
    })
  } finally {
    await session.close()
  }
}

const defaultDependencies: ExternalPartialSyncDependencies = {
  openSession: openScenarioMcpSession,
  createSteps: createPartialSyncSteps,
  runScenario: runPartialSyncScenario,
}
