import fs from "node:fs"
import { move, transferableSymbol, valueSymbol } from "piscina"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { hashFileBytes } from "../configurationIndex/hash"
import { createConfigurationIndexReader, type ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationContext, ConfigurationContextWithExportToXML } from "../context/types"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlProjectFileDescriptor } from "../project/preparedYamlProject"
import {
  createProjectStateOwnerMetadataCache,
  openProjectStateReadSession,
  type ProjectStateOwnerMetadataCache,
  type ProjectStateReadSession,
  type ProjectStateReadToken,
} from "../projectState"
import type { OwnerTypeRef } from "../validation/dataPath/types"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"
import { createFullXmlSyncCompositionReader, type FullXmlSyncCompositionReader } from "./sharedMetadata"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncExecutionResult,
  FullXmlSyncWorkerCommand,
  FullXmlSyncWorkerCommandResult,
  FullXmlSyncWrittenFile,
} from "./types"
import { writeFullXmlSyncAssignment } from "./writeAssignment"
import type { FullXmlSyncWorkerProfileRuntime } from "./componentProfile"
import { BaseFormSourceError, createVerifiedBaseFormSource, type BaseFormSource } from "./baseFormSource"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { classifyMetadataProjectPath } from "../resourceTopology/projectProjection"
import { aggregateCleanupFailures } from "./cleanupFailure"
import { resolveDataPathCore } from "../validation/dataPath/coreResolver"

interface InitializedFullXmlSyncWorkerState {
  readonly workerIndex: number
  readonly componentPath: string
  readonly componentDir: string
  readonly outputDir: string
  readonly context: ConfigurationContext
  readonly index: ConfigurationIndexReader
  readonly baseIndex?: ConfigurationIndexReader
  readonly composition: FullXmlSyncCompositionReader
  readonly ownerMetadataCache: ProjectStateOwnerMetadataCache
  readonly projectStateReadSession: ProjectStateReadSession
  readonly profile: FullXmlSyncWorkerProfileRuntime
  readonly baseFormSource?: BaseFormSource
  activeAssignmentId: string | undefined
}

let initializedState: InitializedFullXmlSyncWorkerState | undefined

export async function runFullXmlSyncWorkerCommand(
  command: FullXmlSyncWorkerCommand,
  dependencies: FullXmlSyncWorkerDependencies = defaultWorkerDependencies,
): Promise<FullXmlSyncWorkerCommandResult> {
  if (command.kind === "initialize") {
    const projectStateReadSession = dependencies.openReadSession(command.projectStateReadToken)
    try {
      const baseFormSource = createBaseFormSource(command.profile)
      const baseIndex =
        command.profile.baseForms === undefined
          ? undefined
          : createConfigurationIndexReader(command.profile.baseForms.snapshot)
      initializedState = {
        workerIndex: command.workerIndex,
        componentPath: command.componentPath,
        componentDir: command.componentDir,
        outputDir: command.outputDir,
        context: {
          ...command.context,
          importFromYAML: {
            ...command.context.importFromYAML,
            projectDir: command.componentDir,
          },
        },
        index: createConfigurationIndexReader(command.targetIndex),
        ...(baseIndex === undefined ? {} : { baseIndex }),
        composition: createFullXmlSyncCompositionReader(command.composition),
        ownerMetadataCache: createProjectStateOwnerMetadataCache({
          projectDir: command.componentDir,
          componentPath: command.componentPath,
          queryPort: projectStateReadSession,
        }),
        projectStateReadSession,
        profile: command.profile,
        ...(baseFormSource === undefined ? {} : { baseFormSource }),
        activeAssignmentId: undefined,
      }
      return undefined
    } catch (caught) {
      try {
        projectStateReadSession.close()
      } catch (cleanupFailure) {
        throw aggregateCleanupFailures(caught, cleanupFailure)
      }
      throw caught
    }
  }
  if (command.kind === "dispose") {
    const state = initializedState
    initializedState = undefined
    state?.projectStateReadSession.close()
    return undefined
  }
  return executeAssignments(command.assignments, requireInitializedState())
}

export interface FullXmlSyncWorkerDependencies {
  readonly openReadSession: (token: ProjectStateReadToken) => ProjectStateReadSession
}

const defaultWorkerDependencies: FullXmlSyncWorkerDependencies = {
  openReadSession: openProjectStateReadSession,
}

export default async function fullXmlSyncWorkerEntryPoint(
  command: FullXmlSyncWorkerCommand
): Promise<FullXmlSyncWorkerCommandResult> {
  const result = await runFullXmlSyncWorkerCommand(command)
  return result === undefined ? undefined : movableExecutionResult(result)
}

async function executeAssignments(
  assignments: readonly FullXmlSyncAssignment[],
  state: InitializedFullXmlSyncWorkerState
): Promise<FullXmlSyncExecutionResult> {
  const diagnostics: FullXmlSyncDiagnostic[] = []
  const warnings: FullXmlSyncDiagnostic[] = []
  const writtenFiles: FullXmlSyncWrittenFile[] = []
  const expectedOutputs: Array<{ assignmentId: string; targetXmlPath: string }> = []
  const fragments: NonNullable<Awaited<ReturnType<typeof writeFullXmlSyncAssignment>>["fragment"]>[] = []
  const itemTypes = itemTypeByYamlDir(state.composition.assignments())
  state.ownerMetadataCache.preload(assignments.flatMap(ownerRefsFromAssignment))

  for (const assignment of assignments) {
    state.activeAssignmentId = assignment.id
    try {
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
        itemTypeByYamlDir: itemTypes,
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

      const basePreparedYamlFile = await readBaseFormIfAdopted(assignment, state)
      const prepared = prepareFullXmlSyncAssignment({
        assignment,
        preparedYamlFile: yamlFile,
        ...(basePreparedYamlFile === undefined
          ? {}
          : {
              basePreparedYamlFile,
              ...(state.baseIndex === undefined ? {} : { baseConfigurationIndex: state.baseIndex }),
            }),
        context: exportContext(state),
        index: state.index,
        assignments: state.composition.assignments(),
      })
      expectedOutputs.push(
        ...prepared.documents.map(({ targetXmlPath }) => ({
          assignmentId: assignment.id,
          targetXmlPath,
        }))
      )
      const result = await writeFullXmlSyncAssignment({
        prepared,
        context: exportContext(state),
        outputDir: state.outputDir,
      })
      diagnostics.push(...result.diagnostics)
      writtenFiles.push(...result.writtenFiles)
      if (result.fragment !== undefined) fragments.push(result.fragment)
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
  }

  return {
    kind: "executionResult",
    diagnostics,
    warnings,
    writtenFiles,
    expectedOutputs,
    fragmentBuffer: encodeConfigurationIndexFragments(fragments),
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
    baseProjectPath: assignment.sourceProjectPath,
  })
}

function createBaseFormSource(profile: FullXmlSyncWorkerProfileRuntime): BaseFormSource | undefined {
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

function itemTypeByYamlDir(
  assignments: readonly Pick<FullXmlSyncAssignment, "role" | "itemName" | "sourceProjectPath" | "itemType">[]
): Record<string, string> {
  return Object.fromEntries(
    assignments
      .map((assignment) => [ownerFromAssignment(assignment).dir, assignment.itemType] as const)
      .filter(([dir]) => dir.length > 0)
  )
}

function exportContext(state: InitializedFullXmlSyncWorkerState): ConfigurationContextWithExportToXML {
  return {
    ...state.context,
    importFromYAML: {
      ...state.context.importFromYAML,
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
    outputDir: initializedState.outputDir,
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
      return [result.fragmentBuffer]
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
