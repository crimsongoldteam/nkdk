import fs from "node:fs"
import { move, transferableSymbol, valueSymbol } from "piscina"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import { encodeConfigurationBlockFragments } from "@nkdk/runtime"
import { hashFileBytes } from "@nkdk/runtime"
import {
  createLocalConfigurationIndexReader,
  type ConfigurationIndexBlock,
  type ConfigurationIndexStoreDescriptor,
  type LocalConfigurationIndexReader,
} from "@nkdk/runtime"
import { openConfigurationIndexStore } from "@nkdk/runtime/configuration-index-store"
import type { ConfigurationContext, ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlProjectFileDescriptor } from "../projectDefinition/preparedYamlContracts"
import type { CompiledMetadataResourceTopology } from "@nkdk/runtime/rule-kit"
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
  FullXmlSyncExpectedOutput,
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
import {
  BaseFormSourceError,
  createVerifiedBaseFormSource,
  type BaseFormSource,
  type BaseFormSourceResult,
} from "./baseFormSource"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
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
  const runner = createFullXmlSyncWorkerCommandRunner()
  registry.register(
    "fullSync",
    async (operation, state) => ({
      kind: "fullSyncResult",
      result: await runner.run(operation.command, {
        openReadSession() { throw new Error("Состояние проекта не установлено в универсальный worker") },
        ...(state.projectState === undefined ? {} : { projectStateReadSession: state.projectState }),
      }),
    }),
    async () => { await runner.run({ kind: "dispose" }) },
  )
}

interface InitializedFullXmlSyncWorkerState {
  readonly workerIndex: number
  readonly componentPath: string
  readonly componentDir: string
  readonly outputTarget: FullXmlSyncOutputTarget
  readonly context: ConfigurationContext
  readonly targetIndex: ConfigurationIndexStoreDescriptor
  readonly baseIndex?: ConfigurationIndexStoreDescriptor
  readonly operationSeed: Uint8Array
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

export interface FullXmlSyncWorkerDependencies {
  readonly openReadSession: (token: ProjectStateReadToken) => ProjectStateReadSession
  readonly projectStateReadSession?: ProjectStateReadSession
  readonly createCompositionReader?: typeof createFullXmlSyncCompositionReader
}

export interface FullXmlSyncWorkerCommandRunner {
  readonly run: (
    command: FullXmlSyncWorkerCommand,
    dependencies?: FullXmlSyncWorkerDependencies,
  ) => Promise<FullXmlSyncWorkerCommandResult>
  readonly entryPoint: (command: FullXmlSyncWorkerCommand) => Promise<FullXmlSyncWorkerCommandResult>
  readonly stateForTests: () => {
    readonly initialized: boolean
    readonly workerIndex?: number
    readonly componentDir?: string
    readonly importProjectDir?: string
    readonly outputDir?: string
    readonly activeAssignmentId?: string
    readonly baseIndexPath?: string
  }
  readonly resetForTests: () => void
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
  assignment: FullXmlSyncAssignment,
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

function assignmentDiagnostic(
  assignment: FullXmlSyncAssignment,
  code: string,
  message: string,
): FullXmlSyncDiagnostic {
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

interface FullXmlSyncAssignmentBaseFormInput {
  readonly baseFormSource: BaseFormSourceResult
  readonly baseConfigurationIndex?: LocalConfigurationIndexReader
  readonly baseFormConfigurationIndex?: LocalConfigurationIndexReader
}

export interface ExecuteFullXmlSyncAssignmentCoreParams {
  readonly assignment: FullXmlSyncAssignment
  readonly sourceBytes: Uint8Array
  readonly descriptor: PreparedYamlProjectFileDescriptor
  readonly itemTypeByYamlDir: Readonly<Record<string, string>>
  readonly context: ConfigurationContextWithExportToXML
  readonly index: LocalConfigurationIndexReader
  readonly operationSeed?: Uint8Array
  readonly composition: Parameters<typeof prepareFullXmlSyncAssignment>[0]["composition"]
  readonly topology?: CompiledMetadataResourceTopology
  readonly outputTarget: FullXmlSyncOutputTarget
  readonly resolveBaseForm?: () => Promise<FullXmlSyncAssignmentBaseFormInput | undefined>
}

export interface ExecuteFullXmlSyncAssignmentCoreResult {
  readonly diagnostics: readonly FullXmlSyncDiagnostic[]
  readonly warnings: readonly FullXmlSyncDiagnostic[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly expectedOutputs: readonly FullXmlSyncExpectedOutput[]
  readonly generatedDocuments: readonly FullXmlSyncGeneratedDocument[]
  readonly fragments: readonly ConfigurationIndexBlockFragment[]
  readonly stopExecution: boolean
}

/**
 * Единственный производственный путь подготовки и записи одного assignment.
 * Он не читает YAML с диска, чтобы одинаково обслуживать обычный worker и partial sync.
 */
export async function executeFullXmlSyncAssignmentCore(
  params: ExecuteFullXmlSyncAssignmentCoreParams,
): Promise<ExecuteFullXmlSyncAssignmentCoreResult> {
  const diagnostics: FullXmlSyncDiagnostic[] = []
  if (hashFileBytes(params.sourceBytes) !== params.assignment.expectedContentHash) {
    diagnostics.push(
      assignmentDiagnostic(
        params.assignment,
        "full_xml_sync_source_changed",
        `YAML изменён после получения хэшей: ${params.assignment.sourceProjectPath}`,
      ),
    )
    return emptyAssignmentCoreResult(diagnostics, true)
  }

  const preparedYaml = prepareYamlFiles({
    files: [params.descriptor],
    itemTypeByYamlDir: params.itemTypeByYamlDir,
    sourceBytes: new Map([[params.assignment.sourcePath, params.sourceBytes]]),
  })
  diagnostics.push(
    ...preparedYaml.diagnostics.map((diagnostic) =>
      syncDiagnosticFromProjectDiagnostic(diagnostic, params.assignment)),
  )
  const preparedYamlFile = preparedYaml.yamlFiles[0]
  if (preparedYamlFile === undefined) return emptyAssignmentCoreResult(diagnostics)

  const syntaxDiagnostics = preparedYamlFile.syntaxDiagnostics.map((diagnostic) =>
    syncDiagnosticFromProjectDiagnostic(diagnostic, params.assignment),
  )
  diagnostics.push(...syntaxDiagnostics)
  if (syntaxDiagnostics.some(({ severity }) => severity === "error")) {
    return emptyAssignmentCoreResult(diagnostics)
  }

  const baseForm = await params.resolveBaseForm?.()
  const prepared = prepareFullXmlSyncAssignment({
    assignment: params.assignment,
    preparedYamlFile,
    ...(baseForm ?? {}),
    context: params.context,
    index: params.index,
    ...(params.operationSeed === undefined ? {} : { operationSeed: params.operationSeed }),
    composition: params.composition,
    ...(params.topology === undefined ? {} : { topology: params.topology }),
  })
  const expectedOutputs = prepared.documents.map(({ targetXmlPath }) => ({
    assignmentId: params.assignment.id,
    targetXmlPath,
  }))
  const written = await writeFullXmlSyncAssignment({
    prepared,
    context: params.context,
    outputTarget: params.outputTarget,
  })
  diagnostics.push(...written.diagnostics)
  return {
    diagnostics,
    warnings: [],
    writtenFiles: written.writtenFiles,
    expectedOutputs,
    generatedDocuments: written.generatedDocuments,
    fragments: written.fragments,
    stopExecution: false,
  }
}

function emptyAssignmentCoreResult(
  diagnostics: readonly FullXmlSyncDiagnostic[],
  stopExecution = false,
): ExecuteFullXmlSyncAssignmentCoreResult {
  return {
    diagnostics,
    warnings: [],
    writtenFiles: [],
    expectedOutputs: [],
    generatedDocuments: [],
    fragments: [],
    stopExecution,
  }
}

export function createFullXmlSyncWorkerCommandRunner(): FullXmlSyncWorkerCommandRunner {
  let initializedState: InitializedFullXmlSyncWorkerState | undefined

async function runFullXmlSyncWorkerCommand(
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
        targetIndex: command.targetIndex,
        ...(command.baseIndex === undefined ? {} : { baseIndex: command.baseIndex }),
        operationSeed: command.operationSeed,
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

function requireProjectStateReadToken(token: ProjectStateReadToken | undefined): ProjectStateReadToken {
  if (token === undefined) throw new Error("Full XML sync worker не получил состояние проекта")
  return token
}

const defaultWorkerDependencies: FullXmlSyncWorkerDependencies = {
  openReadSession: openProjectStateReadSession,
}

async function fullXmlSyncWorkerEntryPoint(
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
  const fragments: ConfigurationIndexBlockFragment[] = []
  const targetStore = openConfigurationIndexStore(state.targetIndex, "readOnly")
  const baseStore = state.baseIndex === undefined ? undefined : openConfigurationIndexStore(state.baseIndex, "readOnly")
  const targetBlocks = targetStore.getBlocks(assignments.flatMap(({ configurationIndexSources }) => configurationIndexSources.targetProjectPaths))
  const baseBlocks = baseStore?.getBlocks(assignments.flatMap(({ configurationIndexSources }) => configurationIndexSources.baseProjectPaths)) ?? new Map()
  state.ownerMetadataCache.preload(assignments.flatMap(ownerRefsFromAssignment))

  try { for (const assignment of assignments) {
    state.activeAssignmentId = assignment.id
    try {
      const assignmentIndex = createLocalConfigurationIndexReader(selectBlocks(targetBlocks, assignment.configurationIndexSources.targetProjectPaths))
      const assignmentBaseIndex = createLocalConfigurationIndexReader(selectBlocks(baseBlocks, assignment.configurationIndexSources.baseProjectPaths))
      const bytes = await fs.promises.readFile(assignment.sourcePath)
      const context = exportContext(state, assignment.logicalAddress)
      const result = await executeFullXmlSyncAssignmentCore({
        assignment,
        sourceBytes: bytes,
        descriptor: assignmentDescriptor(assignment, state),
        itemTypeByYamlDir: state.itemTypeByYamlDir,
        context,
        index: assignmentIndex,
        operationSeed: state.operationSeed,
        composition: state.composition,
        outputTarget: state.outputTarget,
        resolveBaseForm: async () => {
          const baseFormSource = await readBaseFormIfAdopted(assignment, state)
          if (baseFormSource === undefined) return undefined
          return {
            baseFormSource,
            ...(baseFormSource.kind === "saved"
              ? { baseFormConfigurationIndex: assignmentIndex }
              : {}),
            ...(baseFormSource.kind === "projected" && state.baseIndex !== undefined
              ? { baseConfigurationIndex: assignmentBaseIndex }
              : {}),
          }
        },
      })
      diagnostics.push(...result.diagnostics)
      warnings.push(...result.warnings)
      writtenFiles.push(...result.writtenFiles)
      expectedOutputs.push(...result.expectedOutputs)
      generatedDocuments.push(...result.generatedDocuments)
      fragments.push(...result.fragments)
      if (result.stopExecution) break
    } catch (caught) {
      diagnostics.push(
        assignmentDiagnostic(
          assignment,
          caught instanceof BaseFormSourceError ? caught.code : "full_xml_sync_assignment_failed",
          errorMessage(caught)
        )
      )
    } finally {
      state.activeAssignmentId = undefined
    }
  } } finally {
    await targetStore.close()
    await baseStore?.close()
  }

  return {
    kind: "executionResult",
    diagnostics,
    warnings,
    writtenFiles,
    expectedOutputs,
    generatedDocuments,
    fragmentBuffer: encodeConfigurationBlockFragments(fragments),
  }
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

function selectBlocks(
  blocks: ReadonlyMap<string, ConfigurationIndexBlock>,
  projectPaths: readonly string[],
): ReadonlyMap<string, ConfigurationIndexBlock> {
  const selected = new Map<string, ConfigurationIndexBlock>()
  for (const projectPath of projectPaths) {
    const block = blocks.get(projectPath)
    if (block !== undefined) selected.set(projectPath, block)
  }
  return selected
}

function ownerFromAssignment(assignment: Pick<FullXmlSyncAssignment, "role" | "itemName" | "sourceProjectPath">): {
  dir: string
  name: string
} {
  if (assignment.role === "configuration") return { dir: "", name: assignment.itemName }
  const parts = assignment.sourceProjectPath.split("/")
  if (assignment.role === "properties") return { dir: parts[0] ?? "", name: assignment.itemName }
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

function requireInitializedState(): InitializedFullXmlSyncWorkerState {
  if (initializedState === undefined) throw new Error("Full XML sync worker не инициализирован")
  return initializedState
}

function fullXmlSyncWorkerStateForTests(): {
  readonly initialized: boolean
  readonly workerIndex?: number
  readonly componentDir?: string
  readonly importProjectDir?: string
  readonly outputDir?: string
  readonly activeAssignmentId?: string
  readonly baseIndexPath?: string
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
    ...(initializedState.baseIndex === undefined ? {} : { baseIndexPath: initializedState.baseIndex.dataPath }),
    ...(initializedState.activeAssignmentId === undefined
      ? {}
      : { activeAssignmentId: initializedState.activeAssignmentId }),
  }
}

function resetFullXmlSyncWorkerStateForTests(): void {
  initializedState = undefined
}

function createExecutionTransferable(result: FullXmlSyncExecutionResult) {
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

return {
  run: runFullXmlSyncWorkerCommand,
  entryPoint: fullXmlSyncWorkerEntryPoint,
  stateForTests: fullXmlSyncWorkerStateForTests,
  resetForTests: resetFullXmlSyncWorkerStateForTests,
}
}
