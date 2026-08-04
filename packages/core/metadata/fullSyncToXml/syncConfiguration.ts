import fs from "node:fs"
import { resolve } from "node:path"
import { componentPath, parseComponentPath, type ComponentAddress } from "../components/address"
import { configurationIndexPath, writeConfigurationIndexAtomically } from "../configurationIndex/fileIO"
import { decodeConfigurationIndex, readConfigurationIndexSnapshot } from "../configurationIndex"
import type {
  ConfigurationSnapshot,
  ConfigurationSnapshotEntity,
  MergedConfigurationSnapshotFragments,
} from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import {
  confirmComponentState,
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
  type ConfirmedComponentState,
} from "../project/componentState"
import { createValidationProfiler } from "../validation/profile"
import type { Diagnostic } from "../validation/types"
import type { ProjectStateComponentProjection, ProjectStateReadToken, ProjectStateService } from "../projectState"
import { resolveFullXmlSyncComponentProfile, type FullXmlSyncComponentProfile } from "./componentProfile"
import { buildXmlSyncPlan, type XmlSyncSelection } from "./selection"
import { createFullXmlSyncCompositionSnapshot } from "./sharedMetadata"
import { transferFullXmlSyncExternalFiles } from "./transferExternalFiles"
import type { FullXmlSyncDiagnostic, FullXmlSyncPlan } from "./types"
import { createFullXmlSyncWorkerPool, normalizeFullXmlSyncConcurrency, type FullXmlSyncWorkerPool } from "./workerPool"
import { validateFullXmlSyncWrittenFiles } from "./validateWrittenFiles"

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

type ReadStructure = typeof readComponentProjectStructure
type ReadSnapshot = typeof readConfigurationIndexSnapshot
type ReadHashes = typeof readComponentHashState
type ReadIndexes = typeof readComponentIndexes

export interface FullXmlSyncCoordinatorDependencies {
  readonly exists: (path: string) => Promise<boolean>
  readonly isDirectoryEmpty: (path: string) => Promise<boolean>
  readonly mkdir: (path: string) => Promise<void>
  readonly readStructure: ReadStructure
  readonly readSnapshot: ReadSnapshot
  readonly readHashes: ReadHashes
  readonly readIndexes: ReadIndexes
  readonly confirmState: typeof confirmComponentState
  readonly resolveProfile: typeof resolveFullXmlSyncComponentProfile
  readonly buildPlan: typeof buildXmlSyncPlan
  readonly createWorkerPool?: (params: { concurrency: number }) => FullXmlSyncWorkerPool
  readonly transferExternalFiles: typeof transferFullXmlSyncExternalFiles
  readonly validateWrittenFiles: typeof validateFullXmlSyncWrittenFiles
  readonly writeIndex: (params: {
    projectDir: string
    address: ComponentAddress
    data: ConfigurationSnapshot
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
  readStructure: readComponentProjectStructure,
  readSnapshot: readConfigurationIndexSnapshot,
  readHashes: readComponentHashState,
  readIndexes: readComponentIndexes,
  confirmState: confirmComponentState,
  resolveProfile: resolveFullXmlSyncComponentProfile,
  buildPlan: buildXmlSyncPlan,
  transferExternalFiles: transferFullXmlSyncExternalFiles,
  validateWrittenFiles: validateFullXmlSyncWrittenFiles,
  writeIndex: writeConfigurationIndexAtomically,
}

export async function syncComponentToXml(
  params: SyncComponentToXmlParams,
  deps: FullXmlSyncCoordinatorDependencies = defaultDependencies
): Promise<FullXmlSyncResult> {
  const projectDir = resolve(params.projectDir)
  const xmlDir = resolve(params.xmlDir)
  let pool: FullXmlSyncWorkerPool | undefined
  let warnings: FullXmlSyncDiagnostic[] = []
  let diagnostics: FullXmlSyncDiagnostic[] = []
  const profiler = createValidationProfiler({ scope: "main" })

  try {
    const refreshed = await refreshSyncProject({ ...params, projectDir })
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
      projectDir,
      address,
      profile,
      projectStateReadToken: refreshed.readToken,
      projectStateIndexReadToken: await params.projectState.createReadToken(projectDir),
      targetProjection,
      deps,
    })
    const runtime = profile.confirm({ target, ...(base === undefined ? {} : { base }) })
    const plan = deps.buildPlan({
      structure: target.structure,
      hashes: target.hashes,
      selection,
    })

    const workerConcurrency = normalizeFullXmlSyncConcurrency(params.concurrency)
    const usesUniversalWorkers = deps.createWorkerPool === undefined
    pool = usesUniversalWorkers
      ? createFullXmlSyncWorkerPool({
          concurrency: workerConcurrency,
          operation: await params.projectState.workers.beginOperation({
            id: `full-xml-sync-${Date.now()}-${Math.random()}`,
            concurrency: workerConcurrency,
            context: params.context,
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
      outputDir: xmlDir,
      context: params.context,
      profile: runtime.workerProfile,
      composition: createFullXmlSyncCompositionSnapshot(plan.assignments),
      targetIndex: target.snapshot,
      ...(projectStateReadTokens === undefined ? {} : { projectStateReadTokens }),
    })
    const execution = await pool.execute(plan.assignments)
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

    const previous = decodeSnapshot(target.snapshot)
    const indexData = buildFullXmlSyncConfigurationSnapshot({
      previous,
      target,
      fragmentData: execution.fragmentData,
    })
    await deps.writeIndex({ projectDir, address, data: indexData })

    return await complete({
      succeeded: plan.assignments.length + plan.externalFiles.length,
      failed: [],
      warnings,
      diagnostics,
      configurationIndexPath: configurationIndexPath(projectDir, address),
    })
  } catch (caught) {
    const failure = operationDiagnostic(diagnosticCode(caught), errorMessage(caught))
    return await complete(failedResult([failure], warnings, [...diagnostics, failure]))
  } finally {
    profiler.flush()
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
    const context = { version: "2.20", defaultLanguage: "ru" } as const
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
    profile.confirm({ target, ...(base === undefined ? {} : { base }) })
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
      configurationIndexPath: configurationIndexPath(projectDir, address),
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

async function readProfileComponentStates(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly profile: FullXmlSyncComponentProfile
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly projectState: ProjectStateService
  readonly projectStateReadToken: ProjectStateReadToken
  readonly projectStateIndexReadToken: ProjectStateReadToken
  readonly targetProjection: ProjectStateComponentProjection
  readonly deps: FullXmlSyncCoordinatorDependencies
}): Promise<{ readonly target: ConfirmedComponentState; readonly base?: ConfirmedComponentState }> {
  const projectStateReadSession = params.projectState.openReadSession(params.projectStateIndexReadToken)
  const common = {
    projectDir: params.projectDir,
    context: params.context,
    concurrency: params.concurrency,
    projectState: params.projectState,
    projectStateReadToken: params.projectStateReadToken,
    projectStateReadSession,
    deps: params.deps,
  }
  try {
    const target = await readConfirmedComponentState({
      ...common,
      address: params.address,
      projection: params.targetProjection,
    })
    const baseAddress = params.profile.baseAddress(params.address)
    const base = baseAddress === undefined
      ? undefined
      : await readConfirmedComponentState({ ...common, address: baseAddress })
    return { target, ...(base === undefined ? {} : { base }) }
  } finally {
    projectStateReadSession.close()
  }
}

async function refreshSyncProject(params: {
  readonly projectState: ProjectStateService
  readonly projectDir: string
  readonly context: ConfigurationContext
  readonly concurrency?: number
}): Promise<{ readonly diagnostics: FullXmlSyncDiagnostic[]; readonly readToken: ProjectStateReadToken }> {
  const result = await params.projectState.refreshAndValidate({
    projectDir: params.projectDir,
    context: params.context,
    ...(params.concurrency === undefined ? {} : { concurrency: params.concurrency }),
  })
  const diagnostics = [...result.diagnostics].map(projectValidationDiagnostic)
  result.diagnostics.release()
  return { diagnostics, readToken: result.readToken }
}

async function readConfirmedComponentState(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly projectState: ProjectStateService
  readonly projectStateReadToken: ProjectStateReadToken
  readonly projectStateReadSession: Pick<import("../projectState").ProjectStateReadSession, "readComponentTargetPage">
  readonly projection?: ProjectStateComponentProjection
  readonly deps: FullXmlSyncCoordinatorDependencies
}): Promise<ConfirmedComponentState> {
  const structure = await params.deps.readStructure({
    projectDir: params.projectDir,
    address: params.address,
  })
  const snapshot = await params.deps.readSnapshot({
    projectDir: params.projectDir,
    address: params.address,
  })
  const projection = params.projection ?? await params.projectState.readComponentProjection({
    projectDir: params.projectDir,
    componentPath: structure.componentPath,
  })
  const hashes = await params.deps.readHashes({ structure, projection })
  const indexes = await params.deps.readIndexes({ structure, hashes, projectStateReadSession: params.projectStateReadSession })
  return params.deps.confirmState({
    structure,
    snapshot,
    hashes,
    indexes,
    projectStateReadToken: params.projectStateReadToken,
  })
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

function buildFullXmlSyncConfigurationSnapshot(params: {
  readonly previous: ConfigurationSnapshot
  readonly target: ConfirmedComponentState
  readonly fragmentData: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshot {
  const files = [...params.target.hashes.projectFiles]
  const currentProjectPaths = new Set(files.map(({ projectPath }) => projectPath))
  return {
    specificationVersion: "1.3",
    indexGeneration: params.previous.indexGeneration + 1n,
    componentPath: params.previous.componentPath,
    files,
    entities: replaceSnapshotEntities({
      previous: params.previous.entities.filter(({ sourceProjectPath }) =>
        currentProjectPaths.has(sourceProjectPath)
      ),
      replacements: params.fragmentData,
    }),
  }
}

export function replaceSnapshotEntities(params: {
  readonly previous: readonly ConfigurationSnapshotEntity[]
  readonly replacements: MergedConfigurationSnapshotFragments
}): ConfigurationSnapshotEntity[] {
  const replacedPaths = new Set(params.replacements.sourceProjectPaths)
  const entities = [
    ...params.previous.filter(({ sourceProjectPath }) => !replacedPaths.has(sourceProjectPath)),
    ...params.replacements.entities,
  ]
  const logicalAddresses = new Set<string>()
  for (const entity of entities) {
    if (logicalAddresses.has(entity.logicalAddress)) {
      throw new Error(`Повторный logicalAddress в снимке конфигурации: ${entity.logicalAddress}`)
    }
    logicalAddresses.add(entity.logicalAddress)
  }
  return entities.sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
}

function decodeSnapshot(snapshot: ConfirmedComponentState["snapshot"]): ConfigurationSnapshot {
  return decodeConfigurationIndex(new Uint8Array(snapshot.bytes, 0, snapshot.byteLength))
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

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
