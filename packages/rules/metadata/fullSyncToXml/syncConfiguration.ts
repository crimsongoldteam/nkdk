import fs from "node:fs"
import { randomBytes } from "node:crypto"
import { resolve } from "node:path"
import {
  componentPath,
  parseComponentPath,
  type ComponentAddress,
} from "@nkdk/runtime"
import {
  type ConfigurationIndexCandidateStore,
} from "../configurationIndex/store"
import {
  configurationIndexStoreDescriptor,
} from "../configurationIndex"
import { createConfigurationIndexCandidateStore, openConfigurationIndexStore } from "../configurationIndex/store"
import type { ConfigurationContext } from "@nkdk/runtime"
import {
  confirmComponentState,
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
} from "../project/componentState"
import { createValidationProfiler } from "../validation/profile"
import type { Diagnostic } from "../validation/types"
import type { ProjectStateComponentProjection, ProjectStateReadToken, ProjectStateService } from "../projectState"
import { resolveFullXmlSyncComponentProfile } from "./componentProfile"
import { attachBorrowedFormPaths } from "./borrowedFormPlan"
import { buildXmlSyncPlan, type XmlSyncSelection } from "./selection"
import { createFullXmlSyncCompositionSnapshot } from "./sharedMetadata"
import { transferFullXmlSyncExternalFiles } from "./transferExternalFiles"
import type { FullXmlSyncDiagnostic, FullXmlSyncPlan } from "./types"
import { createFullXmlSyncWorkerPool, normalizeFullXmlSyncConcurrency, type FullXmlSyncWorkerPool } from "./workerPool"
import { validateFullXmlSyncWrittenFiles } from "./validateWrittenFiles"
import { prepareFullXmlSyncProfileRuntime } from "./prepareProfileRuntime"
import {
  readProfileComponentStates,
  type FullXmlSyncComponentRuntimeDependencies,
} from "./componentRuntime"
import { assertNoPendingPartialXmlSync } from "../partialSyncToXml/pendingStore"
import { withConfigurationIndexSources } from "./configurationIndexSources"
import { loadConfigurationLanguagesFromYAML } from "../context/configurationLanguages"
import { withConfigurationValidationContextVersions } from "../context/validationContextVersions"

export interface SyncComponentToXmlParams {
  readonly context: ConfigurationContext
  readonly projectDir: string
  readonly componentPath: string
  readonly xmlDir: string
  readonly selection?: XmlSyncSelection
  readonly concurrency?: number
  readonly transferConcurrency?: number
  readonly projectState: ProjectStateService
  readonly ignoreValidationErrors?: boolean
}

export type SyncConfigurationToXmlParams = SyncComponentToXmlParams

export interface PlanSyncConfigurationToXmlParams {
  readonly projectDir: string
  readonly componentPath: string
  readonly xmlDir: string
  readonly selection?: XmlSyncSelection
  readonly concurrency?: number
  readonly projectState: ProjectStateService
  readonly ignoreValidationErrors?: boolean
}

export interface FullXmlSyncResult {
  readonly succeeded: number
  readonly failed: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly configurationIndexPath?: string
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
}

export type FullXmlSyncPlanResult =
  | {
      readonly ok: true
      readonly mode: "plan"
      readonly assignments: number
      readonly externalFiles: number
      readonly configurationIndexPath: string
      readonly diagnostics: readonly FullXmlSyncDiagnostic[]
    }
  | {
      readonly ok: false
      readonly failed: readonly FullXmlSyncDiagnostic[]
      readonly diagnostics: readonly FullXmlSyncDiagnostic[]
    }

export interface FullXmlSyncCoordinatorDependencies extends FullXmlSyncComponentRuntimeDependencies {
  readonly assertNoPending?: (projectDir: string, componentPath: string) => void | Promise<void>
  readonly exists: (path: string) => Promise<boolean>
  readonly isDirectoryEmpty: (path: string) => Promise<boolean>
  readonly mkdir: (path: string) => Promise<void>
  readonly readFile?: (path: string) => Promise<Uint8Array>
  readonly resolveProfile: typeof resolveFullXmlSyncComponentProfile
  readonly buildPlan: typeof buildXmlSyncPlan
  readonly createWorkerPool?: (params: { concurrency: number }) => FullXmlSyncWorkerPool
  readonly loadLanguages?: typeof loadConfigurationLanguagesFromYAML
  readonly transferExternalFiles: typeof transferFullXmlSyncExternalFiles
  readonly validateWrittenFiles: typeof validateFullXmlSyncWrittenFiles
  readonly openIndexStore?: typeof openConfigurationIndexStore
  readonly createIndexCandidate?: typeof createConfigurationIndexCandidateStore
  readonly publishCandidate?: (params: {
    readonly active: ReturnType<typeof openConfigurationIndexStore>
    readonly candidate: ConfigurationIndexCandidateStore
  }) => Promise<void>
}

const defaultDependencies: FullXmlSyncCoordinatorDependencies = {
  async exists(path) {
    return fs.promises
      .access(path)
      .then(() => true)
      .catch(() => false)
  },
  async isDirectoryEmpty(path) {
    return (await fs.promises.readdir(path)).length === 0
  },
  async mkdir(path) {
    await fs.promises.mkdir(path, { recursive: true })
  },
  readFile: fs.promises.readFile,
  readStructure: readComponentProjectStructure,
  readHashes: readComponentHashState,
  readIndexes: readComponentIndexes,
  confirmState: confirmComponentState,
  resolveProfile: resolveFullXmlSyncComponentProfile,
  buildPlan: buildXmlSyncPlan,
  transferExternalFiles: transferFullXmlSyncExternalFiles,
  validateWrittenFiles: validateFullXmlSyncWrittenFiles,
  loadLanguages: loadConfigurationLanguagesFromYAML,
  async publishCandidate({ active, candidate }) {
    await active.replaceActiveFrom(candidate)
  },
}

export function createFullXmlSyncCoordinatorDependencies(
  resolveProfile: FullXmlSyncCoordinatorDependencies["resolveProfile"],
): FullXmlSyncCoordinatorDependencies {
  return { ...defaultDependencies, resolveProfile }
}

export async function syncComponentToXml(
  params: SyncComponentToXmlParams,
  deps: FullXmlSyncCoordinatorDependencies = defaultDependencies
): Promise<FullXmlSyncResult> {
  const projectDir = resolve(params.projectDir)
  const xmlDir = resolve(params.xmlDir)
  let pool: FullXmlSyncWorkerPool | undefined
  let activeIndex: ReturnType<typeof openConfigurationIndexStore> | undefined
  let indexCandidate: ConfigurationIndexCandidateStore | undefined
  let warnings: FullXmlSyncDiagnostic[] = []
  let diagnostics: FullXmlSyncDiagnostic[] = []
  const profiler = createValidationProfiler({ scope: "main" })

  try {
    const languages = await (deps.loadLanguages ?? loadConfigurationLanguagesFromYAML)(resolve(projectDir, "cf"))
    const context = { ...params.context, languages }
    if (params.componentPath === "cf" || params.componentPath.startsWith("cfe/")) {
      const assertNoPending = deps.assertNoPending ?? assertNoPendingPartialXmlSync
      await assertNoPending(projectDir, params.componentPath)
    }
    const refreshed = await refreshSyncProject({ ...params, projectDir, context })
    diagnostics = refreshed.diagnostics
    const refreshErrors = diagnostics.filter(({ severity }) => severity === "error")
    warnings = diagnostics.filter(({ severity }) => severity === "warning")
    if (refreshErrors.length > 0 && params.ignoreValidationErrors !== true) {
      return await complete(failedResult(refreshErrors, warnings, diagnostics))
    }
    const { address, selection, targetProjection } = await readCheckedSelectionProjection(params, projectDir)

    const preflight = await preflightFullXmlSync({ projectDir, xmlDir, deps })
    if ("failed" in preflight) {
      return await complete(failedResult(preflight.failed, warnings, [...diagnostics, ...preflight.failed]))
    }

    const profile = deps.resolveProfile(address)
    if (!preflight.targetExists) await deps.mkdir(xmlDir)

    const { target, base } = await readProfileComponentStates({
      ...params,
      context,
      projectDir,
      address,
      profile,
      projectStateReadToken: refreshed.readToken,
      projectStateIndexReadToken: await params.projectState.createReadToken(projectDir),
      targetProjection,
      deps,
    })
    const confirmedRuntime = await profile.confirm({ target, ...(base === undefined ? {} : { base }) })
    const runtime = await prepareFullXmlSyncProfileRuntime({
      profile,
      runtime: confirmedRuntime,
      readFile: deps.readFile ?? defaultDependencies.readFile!,
    })
    const basePlan = deps.buildPlan({
      structure: target.structure,
      hashes: target.hashes,
      selection,
    })
    const plan = attachBorrowedFormPaths(basePlan, runtime)
    activeIndex = (deps.openIndexStore ?? openConfigurationIndexStore)(target.snapshot.descriptor, "readWrite")
    indexCandidate = await (deps.createIndexCandidate ?? createConfigurationIndexCandidateStore)({
      projectDir,
      address,
      operationId: `full-${Date.now()}-${Math.random()}`,
      purpose: "full",
    })
    indexCandidate.replaceHashes(target.hashes.projectFiles)
    indexCandidate.copyActiveBlocksFrom(activeIndex, new Set(plan.assignments.flatMap((assignment) => [
      assignment.sourceProjectPath,
      ...(assignment.baseFormPaths?.savedProjectPath === undefined ? [] : [assignment.baseFormPaths.savedProjectPath]),
    ])))

    const workerConcurrency = normalizeFullXmlSyncConcurrency(params.concurrency)
    const usesUniversalWorkers = deps.createWorkerPool === undefined
    pool = usesUniversalWorkers
      ? createFullXmlSyncWorkerPool({
          concurrency: workerConcurrency,
          operation: await params.projectState.workers.beginOperation({
            id: `full-xml-sync-${Date.now()}-${Math.random()}`,
            concurrency: workerConcurrency,
            context,
          }),
        })
      : deps.createWorkerPool!({ concurrency: workerConcurrency })
    const projectStateReadTokens = usesUniversalWorkers
      ? undefined
      : await createWorkerReadTokens({
          projectState: params.projectState,
          projectDir,
          first: target.projectStateReadToken,
          count: Math.min(workerConcurrency, plan.assignments.length),
        })
    await pool.initialize({
      componentPath: target.structure.componentPath,
      componentDir: target.structure.componentDir,
      outputTarget: { kind: "directory", outputDir: xmlDir },
      context,
      profile: runtime.workerProfile,
      composition: createFullXmlSyncCompositionSnapshot(plan.assignments),
      targetIndex: target.snapshot.descriptor,
      ...(base === undefined ? {} : { baseIndex: base.snapshot.descriptor }),
      operationSeed: randomBytes(32),
      ...(projectStateReadTokens === undefined ? {} : { projectStateReadTokens }),
    })
    const candidateForBatches = indexCandidate
    const executionAssignments = plan.assignments.map((assignment) => withConfigurationIndexSources({
      assignment,
      targetLogicalAddresses: target.indexes.logicalAddresses,
      ...(base === undefined ? {} : { baseLogicalAddresses: base.indexes.logicalAddresses }),
    }))
    const execution = await pool.execute(executionAssignments, {
      async onBatch(batch) {
        for (const fragment of batch.configurationFragments) candidateForBatches.mergeBlockFragment(fragment)
      },
    })
    const executionDiagnostics = [...execution.diagnostics]
    const executionWarnings = [...execution.warnings]
    const expectedOutputs = [...execution.expectedOutputs]
    const writtenFiles = [...execution.writtenFiles]
    execution.diagnostics.release()
    execution.warnings.release()
    execution.expectedOutputs.release()
    execution.writtenFiles.release()
    warnings = [...warnings, ...executionWarnings]
    diagnostics = [...diagnostics, ...executionDiagnostics, ...executionWarnings]
    if (hasErrors(executionDiagnostics)) {
      return await complete(failedResult(executionDiagnostics, warnings, diagnostics))
    }

    const external = await deps.transferExternalFiles({
      outputDir: xmlDir,
      files: plan.externalFiles,
      ...(params.transferConcurrency === undefined ? {} : { concurrency: params.transferConcurrency }),
    })
    const outputDiagnostics = deps.validateWrittenFiles({
      expectedOutputs,
      writtenFiles,
      copiedFiles: withExternalAssignmentIds(plan, external.copiedFiles),
    })
    warnings = [...warnings, ...outputDiagnostics.filter(({ severity }) => severity === "warning")]
    diagnostics = [...diagnostics, ...outputDiagnostics]
    if (hasErrors(outputDiagnostics)) return await complete(failedResult(outputDiagnostics, warnings, diagnostics))

    indexCandidate.validateCandidate()
    await (deps.publishCandidate ?? defaultDependencies.publishCandidate!)({ active: activeIndex, candidate: indexCandidate })

    return await complete({
      succeeded: plan.assignments.length + plan.externalFiles.length,
      failed: [],
      warnings,
      diagnostics,
      configurationIndexPath: configurationIndexStoreDescriptor(projectDir, address).dataPath,
    })
  } catch (caught) {
    const failure = operationDiagnostic(diagnosticCode(caught), errorMessage(caught))
    return await complete(failedResult([failure], warnings, [...diagnostics, failure]))
  } finally {
    profiler.flush()
    await activeIndex?.close().catch(() => undefined)
    await indexCandidate?.discard().catch(() => undefined)
  }

  async function complete(result: FullXmlSyncResult): Promise<FullXmlSyncResult> {
    const activePool = pool
    pool = undefined
    if (activePool === undefined) return result
    try {
      await activePool.close()
      return result
    } catch (caught) {
      const failure = operationDiagnostic(diagnosticCode(caught), errorMessage(caught))
      return {
        ...result,
        failed: [...result.failed, failure],
        diagnostics: [...result.diagnostics, failure],
      }
    }
  }
}

async function createWorkerReadTokens(params: {
  readonly projectState: ProjectStateService
  readonly projectDir: string
  readonly first: ProjectStateReadToken
  readonly count: number
}): Promise<readonly ProjectStateReadToken[]> {
  if (params.count === 0) return []
  return [
    params.first,
    ...await Promise.all(Array.from({ length: params.count - 1 }, () => params.projectState.createReadToken(params.projectDir))),
  ]
}

export const syncConfigurationToXml = syncComponentToXml

export async function planSyncConfigurationToXml(
  params: PlanSyncConfigurationToXmlParams,
  deps: FullXmlSyncCoordinatorDependencies = defaultDependencies
): Promise<FullXmlSyncPlanResult> {
  const projectDir = resolve(params.projectDir)
  const xmlDir = resolve(params.xmlDir)
  let diagnostics: FullXmlSyncDiagnostic[] = []
  try {
    const languages = await (deps.loadLanguages ?? loadConfigurationLanguagesFromYAML)(resolve(projectDir, "cf"))
    const context = {
      version: "2.20",
      languages,
    } as const
    const refreshed = await refreshSyncProject({ ...params, projectDir, context })
    diagnostics = refreshed.diagnostics
    const refreshErrors = diagnostics.filter(({ severity }) => severity === "error")
    if (refreshErrors.length > 0 && params.ignoreValidationErrors !== true) {
      return { ok: false, failed: refreshErrors, diagnostics }
    }
    const { address, selection, targetProjection } = await readCheckedSelectionProjection(params, projectDir)

    const preflight = await preflightFullXmlSync({ projectDir, xmlDir, deps })
    if ("failed" in preflight) return { ok: false, failed: preflight.failed, diagnostics: [...diagnostics, ...preflight.failed] }
    const profile = deps.resolveProfile(address)
    const { target, base } = await readProfileComponentStates({
      ...params,
      projectDir,
      context,
      address,
      profile,
      projectStateReadToken: refreshed.readToken,
      projectStateIndexReadToken: refreshed.readToken,
      targetProjection,
      deps,
    })
    const confirmedRuntime = await profile.confirm({ target, ...(base === undefined ? {} : { base }) })
    await prepareFullXmlSyncProfileRuntime({
      profile,
      runtime: confirmedRuntime,
      readFile: deps.readFile ?? defaultDependencies.readFile!,
    })
    const plan = deps.buildPlan({
      structure: target.structure,
      hashes: target.hashes,
      selection,
    })
    return {
      ok: true,
      mode: "plan",
      assignments: plan.assignments.length,
      externalFiles: plan.externalFiles.length,
      configurationIndexPath: configurationIndexStoreDescriptor(projectDir, address).dataPath,
      diagnostics,
    }
  } catch (caught) {
    const failure = operationDiagnostic(diagnosticCode(caught), errorMessage(caught))
    return {
      ok: false,
      failed: [failure],
      diagnostics: [...diagnostics, failure],
    }
  }
}

async function refreshSyncProject(params: {
  readonly projectState: ProjectStateService
  readonly projectDir: string
  readonly context: ConfigurationContext
  readonly concurrency?: number
}): Promise<{ readonly diagnostics: FullXmlSyncDiagnostic[]; readonly readToken: ProjectStateReadToken }> {
  const result = await params.projectState.refreshAndValidate(withConfigurationValidationContextVersions({
    projectDir: params.projectDir,
    context: params.context,
    ...(params.concurrency === undefined ? {} : { concurrency: params.concurrency }),
  }))
  const diagnostics = [...result.diagnostics].map(projectValidationDiagnostic)
  result.diagnostics.release()
  return { diagnostics, readToken: result.readToken }
}

async function preflightFullXmlSync(params: {
  readonly projectDir: string
  readonly xmlDir: string
  readonly deps: Pick<FullXmlSyncCoordinatorDependencies, "exists" | "isDirectoryEmpty">
}): Promise<{ readonly targetExists: boolean } | { readonly failed: readonly FullXmlSyncDiagnostic[] }> {
  if (!(await params.deps.exists(params.projectDir))) {
    return {
      failed: [operationDiagnostic("full_xml_sync_project_not_found", `Проект не найден: ${params.projectDir}`)],
    }
  }
  if (await params.deps.exists(params.xmlDir)) {
    if (!(await params.deps.isDirectoryEmpty(params.xmlDir))) {
      return {
        failed: [
          operationDiagnostic(
            "full_xml_sync_target_not_empty",
            `XML-каталог должен отсутствовать или быть пустым: ${params.xmlDir}`
          ),
        ],
      }
    }
    return { targetExists: true }
  }
  return { targetExists: false }
}

function withExternalAssignmentIds(
  plan: FullXmlSyncPlan,
  copiedFiles: readonly {
    readonly assignmentId?: string
    readonly sourceProjectPath: string
    readonly targetXmlPath: string
  }[]
) {
  return copiedFiles.map((file) => ({
    ...file,
    assignmentId:
      file.assignmentId ??
      plan.externalFiles.find(
        (candidate) =>
          candidate.sourceProjectPath === file.sourceProjectPath && candidate.targetXmlPath === file.targetXmlPath
      )?.assignmentId ??
      file.sourceProjectPath,
  }))
}

function assertCompleteSelection(selection: XmlSyncSelection, projectPaths: readonly string[]): void {
  if (selection.kind === "all") return
  const selected = new Set(selection.projectPaths)
  if (selected.size !== projectPaths.length || projectPaths.some((projectPath) => !selected.has(projectPath))) {
    throw new Error("Публичная частичная синхронизация в XML пока не поддерживается")
  }
}

async function readCheckedSelectionProjection(params: {
  readonly projectState: ProjectStateService
  readonly componentPath: string
  readonly selection?: XmlSyncSelection
}, projectDir: string): Promise<{
  readonly address: ComponentAddress
  readonly selection: XmlSyncSelection
  readonly targetProjection: ProjectStateComponentProjection
}> {
  const address = parseSupportedComponentPath(params.componentPath)
  const selection = params.selection ?? { kind: "all" }
  const targetComponentPath = componentPath(address)
  const targetProjection = await params.projectState.readComponentProjection({
    projectDir,
    componentPath: targetComponentPath,
  })
  assertCompleteSelection(selection, projectionProjectPaths(targetProjection, targetComponentPath))
  return { address, selection, targetProjection }
}

function projectionProjectPaths(
  projection: ProjectStateComponentProjection,
  expectedComponentPath: string,
): readonly string[] {
  if (projection.componentPath !== expectedComponentPath) {
    throw new Error("Проекция состояния относится к другому компоненту")
  }
  const prefix = `${expectedComponentPath}/`
  return projection.projectFiles.map(({ projectPath }) => {
    if (!projectPath.startsWith(prefix)) {
      throw new Error(`Путь проекции не принадлежит компоненту: ${projectPath}`)
    }
    return projectPath.slice(prefix.length)
  })
}

function parseSupportedComponentPath(path: string): ComponentAddress {
  try {
    return parseComponentPath(path)
  } catch (caught) {
    throw new UnsupportedComponentError(errorMessage(caught))
  }
}

class UnsupportedComponentError extends Error {
  readonly code = "full_xml_sync_component_not_supported"
}

function diagnosticCode(caught: unknown): string {
  return caught instanceof UnsupportedComponentError ? caught.code : "full_xml_sync_operation_failed"
}

function failedResult(
  failed: readonly FullXmlSyncDiagnostic[],
  warnings: readonly FullXmlSyncDiagnostic[] = [],
  diagnostics: readonly FullXmlSyncDiagnostic[] = [...failed, ...warnings],
): FullXmlSyncResult {
  return { succeeded: 0, failed, warnings, diagnostics }
}

function projectValidationDiagnostic(diagnostic: Diagnostic): FullXmlSyncDiagnostic {
  return {
    severity: diagnostic.severity,
    code: "project_validation",
    source: diagnostic.source,
    message: diagnostic.message,
    sourcePath: diagnostic.filePath,
    line: diagnostic.line,
    col: diagnostic.col,
  }
}

function hasErrors(diagnostics: readonly FullXmlSyncDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error")
}

function operationDiagnostic(code: string, message: string): FullXmlSyncDiagnostic {
  return { severity: "error", code, message }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
