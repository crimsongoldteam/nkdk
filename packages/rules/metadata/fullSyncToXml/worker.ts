import fs from "node:fs"
import { move, transferableSymbol, valueSymbol } from "piscina"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import { encodeConfigurationIndexFragments } from "@nkdk/runtime"
import { hashFileBytes } from "@nkdk/runtime"
import {
  createConfigurationIndexAssignmentLookupStats,
  createConfigurationIndexReader,
  type AssignmentScopedConfigurationIndexReader,
  type ConfigurationIndexAssignmentLookupStats,
  type ConfigurationIndexReader,
} from "@nkdk/runtime"
import type { ConfigurationContext, ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlProjectFileDescriptor } from "../projectDefinition/preparedYamlContracts"
import { openProjectStateReadSession } from "../composition/projectState"
import type { ProjectStateReadSession } from "../projectState/readSession"
import type { ProjectStateReadToken } from "../projectState/contracts/readToken"
import {
  createProjectStateOwnerMetadataCache,
  type ProjectStateOwnerMetadataCache,
} from "../validation/projectStateDependencyValidation"
import type { OwnerTypeRef } from "../validation/dataPath/types"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import { createFullXmlSyncCompositionReader, type FullXmlSyncCompositionReader } from "./sharedMetadata"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncExecutionAssignment,
  FullXmlSyncExecutionResult,
  FullXmlSyncGeneratedDocument,
  FullXmlSyncOutputTarget,
  FullXmlSyncWorkerCommand,
  FullXmlSyncWorkerCommandResult,
  FullXmlSyncWrittenFile,
} from "./types"
import { writeFullXmlSyncAssignment } from "./writeAssignment"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import { BaseFormSourceError, createVerifiedBaseFormSource, type BaseFormSource } from "./baseFormSource"
import type { ConfigurationSnapshotFragment } from "@nkdk/runtime"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import { aggregateCleanupFailures } from "./cleanupFailure"
import { resolveDataPathCore } from "../validation/dataPath/coreResolver"
import { createFullXmlSyncBinaryResult } from "./binaryResult"
import { createOperationProfiler, type ValidationProfiler } from "../validation/profile"
import type { MetadataWorkerOperationRegistry } from "../workerPool/operationRegistry"

declare module "../workerPool/types" {
  interface MetadataWorkerOperationTypeMap {
    fullSync: {
      command: { readonly kind: "fullSync"; readonly command: FullXmlSyncWorkerCommand }
      result: { readonly kind: "fullSyncResult"; readonly result: FullXmlSyncWorkerCommandResult }
    }
  }
}

export function registerFullSyncWorkerOperation(
  registry: MetadataWorkerOperationRegistry,
): void {
  registry.register(
    "fullSync",
    async (operation, state) => ({
      kind: "fullSyncResult",
      result: await runFullXmlSyncWorkerCommand(operation.command, {
        openReadSession() { throw new Error("Состояние проекта не установлено в универсальный worker") },
        ...(state.projectState === undefined ? {} : { projectStateReadSession: state.projectState }),
      }),
    }),
    async () => { await runFullXmlSyncWorkerCommand({ kind: "dispose" }) },
  )
}

interface InitializedFullXmlSyncWorkerState {
  readonly workerIndex: number
  readonly componentPath: string
  readonly componentDir: string
  readonly outputTarget: FullXmlSyncOutputTarget
  readonly context: ConfigurationContext
  readonly index: AssignmentScopedConfigurationIndexReader
  readonly baseIndex?: ConfigurationIndexReader
  readonly composition: FullXmlSyncCompositionReader
  readonly itemTypeByYamlDir: Readonly<Record<string, string>>
  readonly ownerMetadataCache: ProjectStateOwnerMetadataCache
  readonly projectStateReadSession: ProjectStateReadSession
  readonly ownsProjectStateReadSession: boolean
  readonly profile: FullXmlSyncWorkerProfileRuntime
  readonly lookupProfiler: ValidationProfiler
  readonly baseFormSource?: BaseFormSource
  activeAssignmentId: string | undefined
}

let initializedState: InitializedFullXmlSyncWorkerState | undefined

export async function runFullXmlSyncWorkerCommand(
  command: FullXmlSyncWorkerCommand,
  dependencies: FullXmlSyncWorkerDependencies = defaultWorkerDependencies,
): Promise<FullXmlSyncWorkerCommandResult> {
  if (command.kind === "initialize") {
    const projectStateReadSession = dependencies.projectStateReadSession
      ?? dependencies.openReadSession(requireProjectStateReadToken(command.projectStateReadToken))
    const ownsProjectStateReadSession = dependencies.projectStateReadSession === undefined
    try {
      const baseFormSource = createBaseFormSource(command.profile, command.componentPath, command.componentDir)
      const composition = (dependencies.createCompositionReader ?? createFullXmlSyncCompositionReader)(
        command.composition,
      )
      const baseIndex =
        command.profile.baseForms === undefined
          ? undefined
          : createConfigurationIndexReader(command.profile.baseForms.snapshot)
      initializedState = {
        workerIndex: command.workerIndex,
        componentPath: command.componentPath,
        componentDir: command.componentDir,
        outputTarget: command.outputTarget,
        context: {
          ...command.context,
          importFromYAML: {
            ...command.context.importFromYAML,
            projectDir: command.componentDir,
          },
        },
        index: createConfigurationIndexReader(command.targetIndex),
        ...(baseIndex === undefined ? {} : { baseIndex }),
        composition,
        itemTypeByYamlDir: composition.itemTypeByYamlDir(),
        ownerMetadataCache: createProjectStateOwnerMetadataCache({
          projectDir: command.componentDir,
          componentPath: command.componentPath,
          queryPort: projectStateReadSession,
        }),
        projectStateReadSession,
        ownsProjectStateReadSession,
        profile: command.profile,
        lookupProfiler: createOperationProfiler({
          operation: "full-sync-to-xml",
          scope: { scope: "worker", workerIndex: command.workerIndex },
          aggregate: true,
        }),
        ...(baseFormSource === undefined ? {} : { baseFormSource }),
        activeAssignmentId: undefined,
      }
      return undefined
    } catch (caught) {
      try {
        if (ownsProjectStateReadSession) projectStateReadSession.close()
      } catch (cleanupFailure) {
        throw aggregateCleanupFailures(caught, cleanupFailure)
      }
      throw caught
    }
  }
  if (command.kind === "dispose") {
    const state = initializedState
    initializedState = undefined
    if (state?.ownsProjectStateReadSession === true) state.projectStateReadSession.close()
    return undefined
  }
  if (command.kind === "finishExecution") {
    requireInitializedState().lookupProfiler.flush()
    return undefined
  }
  if (command.kind === "executeBatch") {
    const result = await executeAssignments(command.assignments, requireInitializedState())
    return createFullXmlSyncBinaryResult({
      diagnostics: result.diagnostics,
      warnings: result.warnings,
      writtenFiles: result.writtenFiles,
      expectedOutputs: result.expectedOutputs,
      generatedDocuments: result.generatedDocuments,
      fragmentBuffer: result.fragmentBuffer,
    })
  }
  return executeAssignments(command.assignments, requireInitializedState())
}

export interface FullXmlSyncWorkerDependencies {
  readonly openReadSession: (token: ProjectStateReadToken) => ProjectStateReadSession
  readonly projectStateReadSession?: ProjectStateReadSession
  readonly createCompositionReader?: typeof createFullXmlSyncCompositionReader
}

function requireProjectStateReadToken(token: ProjectStateReadToken | undefined): ProjectStateReadToken {
  if (token === undefined) throw new Error("Full XML sync worker не получил состояние проекта")
  return token
}

const defaultWorkerDependencies: FullXmlSyncWorkerDependencies = {
  openReadSession: openProjectStateReadSession,
}

export default async function fullXmlSyncWorkerEntryPoint(
  command: FullXmlSyncWorkerCommand
): Promise<FullXmlSyncWorkerCommandResult> {
  const result = await runFullXmlSyncWorkerCommand(command)
  return result === undefined
    ? undefined
    : result.kind === "binaryResult"
      ? createMovableBinaryResult(result)
      : movableExecutionResult(result)
}

async function executeAssignments(
  assignments: readonly FullXmlSyncExecutionAssignment[],
  state: InitializedFullXmlSyncWorkerState
): Promise<FullXmlSyncExecutionResult> {
  const diagnostics: FullXmlSyncDiagnostic[] = []
  const warnings: FullXmlSyncDiagnostic[] = []
  const writtenFiles: FullXmlSyncWrittenFile[] = []
  const expectedOutputs: Array<{ assignmentId: string; targetXmlPath: string }> = []
  const generatedDocuments: FullXmlSyncGeneratedDocument[] = []
  const fragments: ConfigurationSnapshotFragment[] = []
  state.ownerMetadataCache.preload(assignments.flatMap(ownerRefsFromAssignment))

  for (const assignment of assignments) {
    state.activeAssignmentId = assignment.id
    const lookupStats = createConfigurationIndexAssignmentLookupStats()
    try {
      const assignmentIndex = state.index.forEntityRange(
        assignment.configurationIndexEntityRange,
        lookupStats,
      )
      const bytes = await fs.promises.readFile(assignment.sourcePath)
      const actualHash = hashFileBytes(bytes)
      if (actualHash !== assignment.expectedContentHash) {
        diagnostics.push(
          assignmentDiagnostic(
            assignment,
            "full_xml_sync_source_changed",
            `YAML изменён после получения хэшей: ${assignment.sourceProjectPath}`
          )
        )
        break
      }

      const preparedYaml = prepareYamlFiles({
        files: [assignmentDescriptor(assignment, state)],
        itemTypeByYamlDir: state.itemTypeByYamlDir,
        sourceBytes: new Map([[assignment.sourcePath, bytes]]),
      })
      diagnostics.push(
        ...preparedYaml.diagnostics.map((diagnostic) => syncDiagnosticFromProjectDiagnostic(diagnostic, assignment))
      )
      const yamlFile = preparedYaml.yamlFiles[0]
      if (yamlFile === undefined) continue
      const syntaxDiagnostics = yamlFile.syntaxDiagnostics.map((diagnostic) =>
        syncDiagnosticFromProjectDiagnostic(diagnostic, assignment)
      )
      diagnostics.push(...syntaxDiagnostics)
      if (syntaxDiagnostics.some(({ severity }) => severity === "error")) continue

      const baseFormSource = await readBaseFormIfAdopted(assignment, state)
      const prepared = prepareFullXmlSyncAssignment({
        assignment,
        preparedYamlFile: yamlFile,
        ...(baseFormSource === undefined
          ? {}
          : {
              baseFormSource,
              ...(baseFormSource.kind === "saved"
                ? { baseFormConfigurationIndex: state.index }
                : {}),
              ...(baseFormSource.kind === "projected" && state.baseIndex !== undefined
                ? { baseConfigurationIndex: state.baseIndex }
                : {}),
            }),
        context: exportContext(state, assignment.logicalAddress),
        index: assignmentIndex,
        composition: state.composition,
      })
      expectedOutputs.push(
        ...prepared.documents.map(({ targetXmlPath }) => ({
          assignmentId: assignment.id,
          targetXmlPath,
        }))
      )
      const result = await writeFullXmlSyncAssignment({
        prepared,
        context: exportContext(state, assignment.logicalAddress),
        outputTarget: state.outputTarget,
      })
      diagnostics.push(...result.diagnostics)
      writtenFiles.push(...result.writtenFiles)
      generatedDocuments.push(...result.generatedDocuments)
      fragments.push(...result.fragments)
    } catch (caught) {
      diagnostics.push(
        assignmentDiagnostic(
          assignment,
          caught instanceof BaseFormSourceError ? caught.code : "full_xml_sync_assignment_failed",
          errorMessage(caught)
        )
      )
    } finally {
      recordConfigurationIndexLookupStats(state.lookupProfiler, lookupStats)
      state.activeAssignmentId = undefined
    }
  }

  return {
    kind: "executionResult",
    diagnostics,
    warnings,
    writtenFiles,
    expectedOutputs,
    generatedDocuments,
    fragmentBuffer: encodeConfigurationIndexFragments(fragments),
  }
}

function recordConfigurationIndexLookupStats(
  profiler: ValidationProfiler,
  stats: ConfigurationIndexAssignmentLookupStats,
): void {
  if (process.env["NKDK_PROFILE"] !== "1") return
  const step = "Configuration index назначения"
  profiler.record(step, "Локальные попадания", { items: stats.localHits, timeMs: 0 })
  profiler.record(step, "Локальные промахи", { items: stats.localMisses, timeMs: 0 })
  profiler.record(step, "Глобальные fallback", { items: stats.globalFallbacks, timeMs: 0 })
  profiler.record(step, "Декодированные entity", { items: stats.decodedEntities, timeMs: 0 })
  profiler.record(step, "Entity в диапазонах", { items: stats.rangeEntities, timeMs: 0 })
}

function ownerRefsFromAssignment(assignment: FullXmlSyncAssignment): OwnerTypeRef[] {
  const owner = ownerFromAssignment(assignment)
  return owner.dir.length === 0 ? [] : [{ kind: owner.dir, name: owner.name }]
}

async function readBaseFormIfAdopted(assignment: FullXmlSyncAssignment, state: InitializedFullXmlSyncWorkerState) {
  const baseInput = assignment.potentialOutputs.map((output) => output.baseInput).find((value) => value !== undefined)
  if (baseInput === undefined || state.profile.adoptedUuids[assignment.logicalAddress] === undefined) {
    return undefined
  }
  if (state.baseFormSource === undefined) {
    throw new Error(`Для заимствованной формы не настроен источник основной конфигурации: ${assignment.logicalAddress}`)
  }
  return state.baseFormSource.read({
    extensionAssignment: assignment,
    baseProjectPath: assignment.baseFormPaths?.baseProjectPath ?? assignment.sourceProjectPath,
    ...(assignment.baseFormPaths?.savedProjectPath === undefined
      ? {}
      : { savedProjectPath: assignment.baseFormPaths.savedProjectPath }),
  })
}

function createBaseFormSource(
  profile: FullXmlSyncWorkerProfileRuntime,
  targetComponentPath: string,
  targetComponentDir: string,
): BaseFormSource | undefined {
  if (profile.baseForms === undefined) return undefined
  const topology = compileRegisteredMetadataResourceTopology()
  const resources = profile.baseForms.projectFiles.flatMap(({ projectPath }) => {
    const resource = classifyMetadataProjectPath(topology, projectPath)
    return resource === undefined ? [] : [resource]
  })
  return createVerifiedBaseFormSource({
    baseStructure: {
      address: { kind: "configuration" },
      componentPath: "cf",
      componentDir: profile.baseForms.componentDir,
      topology,
      resources,
      projectPaths: profile.baseForms.projectFiles.map(({ projectPath }) => projectPath),
    },
    baseHashes: {
      componentPath: "cf",
      projectFiles: profile.baseForms.projectFiles,
    },
    ...(profile.baseForms.targetProjectFiles === undefined
      ? {}
      : {
          savedStructure: {
            address: { kind: "configurationExtension", name: "extension" },
            componentPath: targetComponentPath,
            componentDir: targetComponentDir,
            topology,
            resources: profile.baseForms.targetProjectFiles.flatMap(({ projectPath }) => {
              const resource = classifyMetadataProjectPath(topology, projectPath)
              return resource === undefined ? [] : [resource]
            }),
            projectPaths: profile.baseForms.targetProjectFiles.map(({ projectPath }) => projectPath),
          },
          savedHashes: {
            componentPath: targetComponentPath,
            projectFiles: profile.baseForms.targetProjectFiles,
          },
        }),
  })
}

function assignmentDescriptor(
  assignment: FullXmlSyncAssignment,
  state: Pick<InitializedFullXmlSyncWorkerState, "componentPath" | "componentDir">
): PreparedYamlProjectFileDescriptor {
  return {
    componentPath: state.componentPath,
    componentDir: state.componentDir,
    rootProjectPath: `${state.componentPath}/${assignment.sourceProjectPath}`,
    projectPath: assignment.sourceProjectPath,
    filePath: assignment.sourcePath,
    role: assignment.role,
    owner: ownerFromAssignment(assignment),
    itemType: assignment.itemType,
  }
}

function ownerFromAssignment(assignment: Pick<FullXmlSyncAssignment, "role" | "itemName" | "sourceProjectPath">): {
  dir: string
  name: string
} {
  if (assignment.role === "configuration") return { dir: "", name: assignment.itemName }
  const parts = assignment.sourceProjectPath.split("/")
  return { dir: parts[0] ?? "", name: parts[1] ?? assignment.itemName }
}

function exportContext(
  state: InitializedFullXmlSyncWorkerState,
  currentPath: string,
): ConfigurationContextWithExportToXML {
  return {
    ...state.context,
    importFromYAML: {
      ...state.context.importFromYAML,
      ...(state.profile.referencePathByCurrentPath === undefined
        ? {}
        : {
            referenceRemap: {
              currentPath,
              referencePathByCurrentPath: state.profile.referencePathByCurrentPath,
            },
          }),
      ownerMetadataCache: state.ownerMetadataCache,
      resolveDataPath: ({ value, index, ownerCache }) =>
        resolveDataPathCore({ value, nameMode: "yaml", index, ownerCache }),
    },
    exportToYAML: {
      toTyped: state.context.exportToYAML?.toTyped ?? false,
      ...state.context.exportToYAML,
      ownerMetadataCache: state.ownerMetadataCache,
    },
    exportToXML: {
      ...(state.context.exportToXML ?? {}),
      itemsTree: [],
      version: state.context.version,
      context: {
        metadataForNumbering: [],
        forms: [],
        templates: [],
        parentName: "",
      },
      componentKind: state.profile.componentKind,
      adoptedUuids: state.profile.adoptedUuids,
      typeDescriptionXMLNameByType: state.profile.typeDescriptionXMLNameByType,
      xmlDefaultVariantByLogicalAddress: state.profile.xmlDefaultVariantByLogicalAddress,
    },
  }
}

function syncDiagnosticFromProjectDiagnostic(
  diagnostic: {
    readonly severity: "error" | "warning"
    readonly source: string
    readonly message: string
    readonly filePath: string
    readonly line?: number
    readonly col?: number
  },
  assignment: FullXmlSyncAssignment
): FullXmlSyncDiagnostic {
  return {
    severity: diagnostic.severity,
    code: diagnostic.source,
    message: diagnostic.message,
    assignmentId: assignment.id,
    sourceProjectPath: assignment.sourceProjectPath,
    sourcePath: diagnostic.filePath,
    targetXmlPath: assignment.potentialOutputs[0]?.targetXmlPath,
    ...(diagnostic.line === undefined ? {} : { line: diagnostic.line }),
    ...(diagnostic.col === undefined ? {} : { col: diagnostic.col }),
  }
}

function assignmentDiagnostic(assignment: FullXmlSyncAssignment, code: string, message: string): FullXmlSyncDiagnostic {
  return {
    severity: "error",
    code,
    message,
    assignmentId: assignment.id,
    sourceProjectPath: assignment.sourceProjectPath,
    sourcePath: assignment.sourcePath,
    targetXmlPath: assignment.potentialOutputs[0]?.targetXmlPath,
  }
}

function requireInitializedState(): InitializedFullXmlSyncWorkerState {
  if (initializedState === undefined) throw new Error("Full XML sync worker не инициализирован")
  return initializedState
}

export function fullXmlSyncWorkerStateForTests(): {
  readonly initialized: boolean
  readonly workerIndex?: number
  readonly componentDir?: string
  readonly importProjectDir?: string
  readonly outputDir?: string
  readonly activeAssignmentId?: string
  readonly baseIndexSnapshot?: ConfigurationIndexReader["snapshot"]
} {
  if (initializedState === undefined) return { initialized: false }
  return {
    initialized: true,
    workerIndex: initializedState.workerIndex,
    componentDir: initializedState.componentDir,
    importProjectDir: initializedState.context.importFromYAML?.projectDir,
    ...(initializedState.outputTarget.kind === "directory"
      ? { outputDir: initializedState.outputTarget.outputDir }
      : {}),
    ...(initializedState.baseIndex === undefined ? {} : { baseIndexSnapshot: initializedState.baseIndex.snapshot }),
    ...(initializedState.activeAssignmentId === undefined
      ? {}
      : { activeAssignmentId: initializedState.activeAssignmentId }),
  }
}

export function resetFullXmlSyncWorkerStateForTests(): void {
  initializedState = undefined
}

export function createExecutionTransferable(result: FullXmlSyncExecutionResult) {
  return {
    get [transferableSymbol]() {
      return [
        result.fragmentBuffer,
        ...result.generatedDocuments.map(({ content }) =>
          content.byteOffset === 0 && content.byteLength === content.buffer.byteLength
            ? content.buffer
            : content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength)
        ),
      ]
    },
    get [valueSymbol]() {
      return result
    },
  }
}

function movableExecutionResult(result: FullXmlSyncExecutionResult): FullXmlSyncExecutionResult {
  return move(createExecutionTransferable(result)) as unknown as FullXmlSyncExecutionResult
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
