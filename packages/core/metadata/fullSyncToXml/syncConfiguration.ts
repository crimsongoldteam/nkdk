import fs from "node:fs"
import { resolve } from "node:path"
import { NKDK_CORE_VERSION } from "../../version"
import { parseComponentPath, type ComponentAddress } from "../components/address"
import { configurationIndexPath, writeConfigurationIndexAtomically } from "../configurationIndex/fileIO"
import { decodeConfigurationIndex, readConfigurationIndexSnapshot } from "../configurationIndex"
import type { ConfigurationIndexData } from "../configurationIndex/types"
import type { ConfigurationContext } from "../context/types"
import {
  confirmComponentState,
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
  type ConfirmedComponentState,
} from "../project/componentState"
import { serializeSharedValidationSnapshot } from "../validation/persistedSharedValidationSnapshot"
import { createValidationProfiler } from "../validation/profile"
import { resolveFullXmlSyncComponentProfile } from "./componentProfile"
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
}

export type SyncConfigurationToXmlParams = SyncComponentToXmlParams

export interface PlanSyncConfigurationToXmlParams {
  readonly projectDir: string
  readonly componentPath: string
  readonly xmlDir: string
  readonly selection?: XmlSyncSelection
  readonly concurrency?: number
}

export interface FullXmlSyncResult {
  readonly succeeded: number
  readonly failed: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly configurationIndexPath?: string
}

export type FullXmlSyncPlanResult =
  | {
      readonly ok: true
      readonly mode: "plan"
      readonly assignments: number
      readonly externalFiles: number
      readonly configurationIndexPath: string
    }
  | {
      readonly ok: false
      readonly failed: readonly FullXmlSyncDiagnostic[]
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
  readonly createWorkerPool: (params: { concurrency: number }) => FullXmlSyncWorkerPool
  readonly transferExternalFiles: typeof transferFullXmlSyncExternalFiles
  readonly validateWrittenFiles: typeof validateFullXmlSyncWrittenFiles
  readonly writeIndex: (params: {
    projectDir: string
    address: ComponentAddress
    data: ConfigurationIndexData
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
  createWorkerPool: ({ concurrency }) => createFullXmlSyncWorkerPool({ concurrency }),
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
  const profiler = createValidationProfiler({ scope: "main" })

  try {
    const preflight = await preflightFullXmlSync({ projectDir, xmlDir, deps })
    if ("failed" in preflight) return failedResult(preflight.failed)

    const address = parseSupportedComponentPath(params.componentPath)
    const profile = deps.resolveProfile(address)
    if (!preflight.targetExists) await deps.mkdir(xmlDir)

    const target = await readConfirmedComponentState({
      projectDir,
      address,
      context: params.context,
      concurrency: params.concurrency,
      deps,
    })
    const baseAddress = profile.baseAddress(address)
    const base =
      baseAddress === undefined
        ? undefined
        : await readConfirmedComponentState({
            projectDir,
            address: baseAddress,
            context: params.context,
            concurrency: params.concurrency,
            deps,
          })
    const runtime = profile.confirm({ target, ...(base === undefined ? {} : { base }) })
    const selection = params.selection ?? { kind: "all" }
    assertCompleteSelection(selection, target.structure.projectPaths)
    const plan = deps.buildPlan({
      structure: target.structure,
      hashes: target.hashes,
      selection,
    })

    pool = deps.createWorkerPool({
      concurrency: normalizeFullXmlSyncConcurrency(params.concurrency),
    })
    await pool.initialize({
      componentPath: target.structure.componentPath,
      componentDir: target.structure.componentDir,
      outputDir: xmlDir,
      context: params.context,
      profile: runtime.workerProfile,
      composition: createFullXmlSyncCompositionSnapshot(plan.assignments),
      targetIndex: target.snapshot,
      localMetadata: target.indexes.metadata,
      ...(base === undefined ? {} : { baseMetadata: base.indexes.metadata }),
    })
    const execution = await pool.execute(plan.assignments)
    warnings = execution.warnings
    if (hasErrors(execution.diagnostics)) {
      return failedResult(execution.diagnostics, warnings)
    }

    const external = await deps.transferExternalFiles({
      outputDir: xmlDir,
      files: plan.externalFiles,
      ...(params.transferConcurrency === undefined ? {} : { concurrency: params.transferConcurrency }),
    })
    const outputDiagnostics = deps.validateWrittenFiles({
      expectedOutputs: execution.expectedOutputs,
      writtenFiles: execution.writtenFiles,
      copiedFiles: withExternalAssignmentIds(plan, external.copiedFiles),
    })
    if (hasErrors(outputDiagnostics)) return failedResult(outputDiagnostics, warnings)

    const previous = decodeSnapshot(target.snapshot)
    const indexData = buildFullXmlSyncConfigurationIndex({
      previous,
      target,
      fragmentData: execution.fragmentData,
    })
    await deps.writeIndex({ projectDir, address, data: indexData })

    return {
      succeeded: plan.assignments.length + plan.externalFiles.length,
      failed: [],
      warnings,
      configurationIndexPath: configurationIndexPath(projectDir, address),
    }
  } catch (caught) {
    return failedResult([operationDiagnostic(diagnosticCode(caught), errorMessage(caught))], warnings)
  } finally {
    profiler.flush()
    await pool?.close()
  }
}

export const syncConfigurationToXml = syncComponentToXml

export async function planSyncConfigurationToXml(
  params: PlanSyncConfigurationToXmlParams,
  deps: FullXmlSyncCoordinatorDependencies = defaultDependencies
): Promise<FullXmlSyncPlanResult> {
  const projectDir = resolve(params.projectDir)
  const xmlDir = resolve(params.xmlDir)
  try {
    const preflight = await preflightFullXmlSync({ projectDir, xmlDir, deps })
    if ("failed" in preflight) return { ok: false, failed: preflight.failed }
    const address = parseSupportedComponentPath(params.componentPath)
    const profile = deps.resolveProfile(address)
    const target = await readConfirmedComponentState({
      projectDir,
      address,
      context: { version: "2.20", defaultLanguage: "ru" },
      concurrency: params.concurrency,
      deps,
    })
    const baseAddress = profile.baseAddress(address)
    const base =
      baseAddress === undefined
        ? undefined
        : await readConfirmedComponentState({
            projectDir,
            address: baseAddress,
            context: { version: "2.20", defaultLanguage: "ru" },
            concurrency: params.concurrency,
            deps,
          })
    profile.confirm({ target, ...(base === undefined ? {} : { base }) })
    const selection = params.selection ?? { kind: "all" }
    assertCompleteSelection(selection, target.structure.projectPaths)
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
    }
  } catch (caught) {
    return {
      ok: false,
      failed: [operationDiagnostic(diagnosticCode(caught), errorMessage(caught))],
    }
  }
}

async function readConfirmedComponentState(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly context: ConfigurationContext
  readonly concurrency?: number
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
  const hashes = await params.deps.readHashes({
    structure,
    ...(params.concurrency === undefined ? {} : { concurrency: params.concurrency }),
  })
  const indexes = await params.deps.readIndexes({
    structure,
    hashes,
    context: params.context,
    ...(params.concurrency === undefined ? {} : { concurrency: params.concurrency }),
  })
  return params.deps.confirmState({ structure, snapshot, hashes, indexes })
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

function buildFullXmlSyncConfigurationIndex(params: {
  readonly previous: ConfigurationIndexData
  readonly target: ConfirmedComponentState
  readonly fragmentData: Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues">
}): ConfigurationIndexData {
  return {
    binding: {
      ...params.previous.binding,
      producerVersion: NKDK_CORE_VERSION,
      indexGeneration: params.previous.binding.indexGeneration + 1n,
    },
    projectFiles: [...params.target.hashes.projectFiles],
    identities: [...params.fragmentData.identities].sort((left, right) =>
      compareIndexKeys(`${left.logicalAddress}\0${left.kind}`, `${right.logicalAddress}\0${right.kind}`)
    ),
    xmlNodes: [...params.fragmentData.xmlNodes].sort((left, right) =>
      compareIndexKeys(left.logicalAddress, right.logicalAddress)
    ),
    xmlValues: [...params.fragmentData.xmlValues].sort((left, right) =>
      compareIndexKeys(left.logicalAddress, right.logicalAddress)
    ),
    localIndexes: {
      metadata: serializeSharedValidationSnapshot(params.target.indexes.metadata),
      dependencies: [...params.target.indexes.dependencies],
      logicalAddresses: [...params.target.indexes.logicalAddresses],
    },
  }
}

function decodeSnapshot(snapshot: ConfirmedComponentState["snapshot"]): ConfigurationIndexData {
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
  warnings: readonly FullXmlSyncDiagnostic[] = []
): FullXmlSyncResult {
  return { succeeded: 0, failed, warnings }
}

function hasErrors(diagnostics: readonly FullXmlSyncDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error")
}

function operationDiagnostic(code: string, message: string): FullXmlSyncDiagnostic {
  return { severity: "error", code, message }
}

function compareIndexKeys(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
