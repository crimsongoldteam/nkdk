import { randomUUID } from "node:crypto"
import { cp, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { compareFileTrees } from "../support/file-tree"
import type { PlatformMode } from "./concurrency"
import type { ScenarioComponentPath } from "./matrix/types"
import type { ScenarioMcpSession } from "./mcp-session"
import { applyScenarioBlock } from "./operation"
import {
  closePlatformConnection,
  expectSuccessfulValidation,
  importComponent,
  prepareVerificationProject,
  syncAndExpectStatus,
} from "./steps"
import type { ScenarioStep } from "./stepwise-plan"
import type { ScenarioRunWorkspace } from "./stepwise-workspace"

export type StepExecutionStage =
  | "apply"
  | "validation"
  | "sync"
  | "verificationImport"
  | "verificationValidation"
  | "comparison"
  | "unchanged"

export type StepExecutionResult = {
  readonly stepKey: string
  readonly stageTimings: Readonly<Partial<Record<StepExecutionStage, number>>>
  readonly failedStage?: StepExecutionStage
  readonly attemptLogDir: string
}

export class StepExecutionFailure extends Error {
  readonly stepResult: StepExecutionResult

  constructor(message: string, stepResult: StepExecutionResult, cause?: unknown) {
    super(message, { cause })
    this.name = "StepExecutionFailure"
    this.stepResult = stepResult
  }
}

export type StepwiseStepDependencies = {
  operationId(): string
  now(): number
  prepareAttemptLog(path: string): Promise<void>
  applyStep(projectDir: string, step: ScenarioStep): Promise<void>
  validate(session: ScenarioMcpSession, projectDir: string, logDir: string): Promise<void>
  sync(
    session: ScenarioMcpSession,
    projectDir: string,
    componentPath: ScenarioComponentPath,
    logDir: string,
    status: "synchronized" | "unchanged",
  ): Promise<void>
  prepareVerification(params: {
    readonly verificationProjectDir: string
    readonly baseDir: string
    readonly mode: PlatformMode
    readonly componentPath: ScenarioComponentPath
    readonly baselineProjectDir: string
  }): Promise<void>
  closeSource(session: ScenarioMcpSession, projectDir: string, logDir: string): Promise<void>
  importVerification(
    session: ScenarioMcpSession,
    projectDir: string,
    componentPath: ScenarioComponentPath,
    logDir: string,
  ): Promise<void>
  compareComponent(params: {
    readonly expectedDir: string
    readonly actualDir: string
    readonly reportDir: string
  }): Promise<boolean>
  closeVerification(session: ScenarioMcpSession, projectDir: string, logDir: string): Promise<void>
}

type CreateStepwiseStepsParams = {
  readonly workspace: ScenarioRunWorkspace
  readonly session: ScenarioMcpSession
  readonly mode: PlatformMode
  readonly baselineProjectDir: string
  readonly extensionName: string
  readonly recordStage?: (event: {
    readonly stepKey: string
    readonly stage: StepExecutionStage
    readonly durationMs: number
    readonly attemptLogDir: string
  }) => Promise<void>
}

export function createStepwiseSteps(
  params: CreateStepwiseStepsParams,
  dependencies: StepwiseStepDependencies = nodeDependencies,
) {
  return {
    async execute(
      step: ScenarioStep,
      _progress: { readonly index: number; readonly total: number },
    ): Promise<StepExecutionResult> {
      const safeKey = step.key.replaceAll(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/gu, "-")
      const attemptLogDir = join(params.workspace.logsDir, `${dependencies.operationId()}-${safeKey}`)
      await dependencies.prepareAttemptLog(attemptLogDir)
      const timings: Partial<Record<StepExecutionStage, number>> = {}
      let startedAt = dependencies.now()
      let activeStage: StepExecutionStage = "apply"
      const completeStage = async (stage: StepExecutionStage): Promise<void> => {
        const finishedAt = dependencies.now()
        const durationMs = finishedAt - startedAt
        timings[stage] = durationMs
        startedAt = finishedAt
        await params.recordStage?.({ stepKey: step.key, stage, durationMs, attemptLogDir })
      }

      try {
        await dependencies.applyStep(params.workspace.projectDir, step)
        await completeStage("apply")
        activeStage = "validation"
        await dependencies.validate(params.session, params.workspace.projectDir, attemptLogDir)
        await completeStage("validation")
        activeStage = "sync"
        await dependencies.sync(
          params.session, params.workspace.projectDir, step.componentPath, attemptLogDir, "synchronized",
        )
        await completeStage("sync")

        const verificationProjectDir = join(params.workspace.verificationDir, safeKey)
        activeStage = "verificationImport"
        await dependencies.prepareVerification({
          verificationProjectDir,
          baseDir: params.workspace.baseDir,
          mode: params.mode,
          componentPath: step.componentPath,
          baselineProjectDir: params.baselineProjectDir,
        })
        await dependencies.closeSource(params.session, params.workspace.projectDir, attemptLogDir)
        try {
          await dependencies.importVerification(
            params.session, verificationProjectDir, step.componentPath, attemptLogDir,
          )
          await completeStage("verificationImport")
          activeStage = "verificationValidation"
          await dependencies.validate(params.session, verificationProjectDir, attemptLogDir)
          await completeStage("verificationValidation")
          activeStage = "comparison"
          const equal = await dependencies.compareComponent({
            expectedDir: join(params.workspace.projectDir, step.componentPath),
            actualDir: join(verificationProjectDir, step.componentPath),
            reportDir: join(attemptLogDir, "compare-component"),
          })
          if (!equal) throw new Error(`Сравнение компонента ${step.componentPath} завершилось с различиями`)
          await completeStage("comparison")
        } finally {
          await dependencies.closeVerification(params.session, verificationProjectDir, attemptLogDir)
        }
        startedAt = dependencies.now()
        activeStage = "unchanged"
        await dependencies.sync(
          params.session, params.workspace.projectDir, step.componentPath, attemptLogDir, "unchanged",
        )
        await completeStage("unchanged")
        return { stepKey: step.key, stageTimings: timings, attemptLogDir }
      } catch (caught) {
        const error = caught instanceof Error ? caught : new Error(String(caught))
        throw new StepExecutionFailure(error.message, {
          stepKey: step.key,
          stageTimings: timings,
          failedStage: activeStage,
          attemptLogDir,
        }, error)
      }
    },
  }
}

const nodeDependencies: StepwiseStepDependencies = {
  operationId: randomUUID,
  now: Date.now,
  async prepareAttemptLog(path) { await mkdir(path, { recursive: true }) },
  applyStep: applyStepwiseOperation,
  validate: expectSuccessfulValidation,
  sync: syncAndExpectStatus,
  async prepareVerification(params) {
    await prepareVerificationProject(params.verificationProjectDir, params.baseDir, params.mode)
    if (params.componentPath.startsWith("cfe/")) {
      await cp(
        join(params.baselineProjectDir, "cf"),
        join(params.verificationProjectDir, "cf"),
        { recursive: true },
      )
    }
  },
  closeSource: closePlatformConnection,
  importVerification: importComponent,
  async compareComponent(params) {
    const comparison = await compareFileTrees({
      ...params,
      xmlComparison: "semantic",
      yamlComparison: "ignore-final-line-ending",
      textComparison: "normalize",
    })
    return comparison.equal
  },
  closeVerification: closePlatformConnection,
}

export async function applyStepwiseOperation(projectDir: string, step: ScenarioStep): Promise<void> {
  await applyScenarioBlock(projectDir, {
    key: `${step.layerKey}:bulk:0`,
    layerKey: step.layerKey,
    componentPath: step.componentPath,
    operations: [step.operation],
  })
}
