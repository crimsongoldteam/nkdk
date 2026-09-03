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

export type StepExecutionResult = {
  readonly stepKey: string
  readonly stageTimings: Readonly<Record<
    "apply" | "validation" | "sync" | "verificationImport" |
    "verificationValidation" | "comparison" | "unchanged",
    number
  >>
  readonly attemptLogDir: string
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
      const timings: Partial<Record<keyof StepExecutionResult["stageTimings"], number>> = {}
      let startedAt = dependencies.now()
      const measure = (stage: keyof StepExecutionResult["stageTimings"]): void => {
        const finishedAt = dependencies.now()
        timings[stage] = finishedAt - startedAt
        startedAt = finishedAt
      }

      await dependencies.applyStep(params.workspace.projectDir, step)
      measure("apply")
      await dependencies.validate(params.session, params.workspace.projectDir, attemptLogDir)
      measure("validation")
      await dependencies.sync(
        params.session, params.workspace.projectDir, step.componentPath, attemptLogDir, "synchronized",
      )
      measure("sync")

      const verificationProjectDir = join(params.workspace.verificationDir, safeKey)
      await dependencies.prepareVerification({
        verificationProjectDir,
        baseDir: params.workspace.baseDir,
        mode: params.mode,
        componentPath: step.componentPath,
        baselineProjectDir: params.baselineProjectDir,
      })
      try {
        await dependencies.importVerification(
          params.session, verificationProjectDir, step.componentPath, attemptLogDir,
        )
        measure("verificationImport")
        await dependencies.validate(params.session, verificationProjectDir, attemptLogDir)
        measure("verificationValidation")
        const equal = await dependencies.compareComponent({
          expectedDir: join(params.workspace.projectDir, step.componentPath),
          actualDir: join(verificationProjectDir, step.componentPath),
          reportDir: join(attemptLogDir, "compare-component"),
        })
        measure("comparison")
        if (!equal) throw new Error(`Сравнение компонента ${step.componentPath} завершилось с различиями`)
      } finally {
        await dependencies.closeVerification(params.session, verificationProjectDir, attemptLogDir)
      }
      startedAt = dependencies.now()
      await dependencies.sync(
        params.session, params.workspace.projectDir, step.componentPath, attemptLogDir, "unchanged",
      )
      measure("unchanged")
      return {
        stepKey: step.key,
        stageTimings: timings as StepExecutionResult["stageTimings"],
        attemptLogDir,
      }
    },
  }
}

const nodeDependencies: StepwiseStepDependencies = {
  operationId: randomUUID,
  now: Date.now,
  async prepareAttemptLog(path) { await mkdir(path, { recursive: true }) },
  async applyStep(projectDir, step) {
    await applyScenarioBlock(projectDir, {
      key: `${step.layerKey}:bulk:0`,
      layerKey: step.layerKey,
      componentPath: step.componentPath,
      operations: [step.operation],
    })
  },
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
