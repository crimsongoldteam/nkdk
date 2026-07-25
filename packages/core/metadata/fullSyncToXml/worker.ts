import { move, transferableSymbol, valueSymbol } from "piscina"
import { performance } from "node:perf_hooks"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexReader, type ConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import { hashFileBytes } from "../configurationIndex/hash"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { extractValidationOwnerYamlFacts } from "../validation/yamlFactExtractor"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlProjectFileDescriptor } from "../project/preparedYamlProject"
import type { ConfigurationContext, ConfigurationContextWithExportToXML } from "../context/types"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncFirstPassResult,
  FullXmlSyncOwnerFacts,
  FullXmlSyncSecondPassResult,
  FullXmlSyncWorkerCommand,
  FullXmlSyncWorkerCommandResult,
  FullXmlSyncWrittenFile,
  PreparedXMLAssignment,
} from "./types"
import { writeFullXmlSyncAssignment } from "./writeAssignment"
import {
  createFullXmlSyncCompositionReader,
  createFullXmlSyncSharedMetadataReader,
  type FullXmlSyncCompositionReader,
} from "./sharedMetadata"
import { prepareFullXmlSyncAssignment } from "./prepareAssignment"

registerValidationMetadata()

interface InitializedFullXmlSyncWorkerState {
  workerIndex: number
  projectDir: string
  outputDir: string
  context: ConfigurationContext
  index: ConfigurationIndexReader
  composition: FullXmlSyncCompositionReader
}

let initializedState: InitializedFullXmlSyncWorkerState | undefined

const preparedAssignments = new Map<string, PreparedXMLAssignment>()

export async function runFullXmlSyncWorkerCommand(
  command: FullXmlSyncWorkerCommand
): Promise<FullXmlSyncWorkerCommandResult> {
  if (command.kind === "initialize") {
    preparedAssignments.clear()
    initializedState = {
      workerIndex: command.workerIndex,
      projectDir: command.projectDir,
      outputDir: command.outputDir,
      context: {
        ...command.context,
        importFromYAML: {
          ...command.context.importFromYAML,
          projectDir: command.projectDir,
        },
      },
      index: createConfigurationIndexReader(command.index),
      composition: createFullXmlSyncCompositionReader(command.composition),
    }
    return undefined
  }

  if (command.kind === "dispose") {
    disposeWorkerState()
    return undefined
  }

  if (command.kind === "secondPass") {
    return runSecondPass(command.sharedMetadata, requireInitializedState())
  }

  return runFirstPass(command.assignments, requireInitializedState())
}

export default async function fullXmlSyncWorkerEntryPoint(
  command: FullXmlSyncWorkerCommand
): Promise<FullXmlSyncWorkerCommandResult> {
  const result = await runFullXmlSyncWorkerCommand(command)
  return result?.kind === "secondPassResult" ? movableSecondPassResult(result) : result
}

function runFirstPass(
  assignments: readonly FullXmlSyncAssignment[],
  state: InitializedFullXmlSyncWorkerState
): FullXmlSyncFirstPassResult {
  preparedAssignments.clear()
  const diagnostics: FullXmlSyncDiagnostic[] = []
  const projectFiles: FullXmlSyncFirstPassResult["projectFiles"][number][] = []
  const ownerFacts: FullXmlSyncOwnerFacts[] = []
  const expectedOutputs: Array<{ assignmentId: string; targetXmlPath: string }> = []
  const rulesSnapshot = createValidationRulesSnapshot(state.context)

  for (const assignment of assignments) {
    try {
      const prepared = prepareYamlFiles({
        files: [assignmentDescriptor(assignment)],
        itemTypeByYamlDir: itemTypeByYamlDir(assignments),
        includeProjectFiles: true,
        hashFileBytes,
      })
      diagnostics.push(
        ...prepared.diagnostics.map((diagnostic) => syncDiagnosticFromProjectDiagnostic(diagnostic, assignment))
      )
      projectFiles.push(...prepared.projectFiles)
      const yamlFile = prepared.yamlFiles[0]
      if (yamlFile === undefined) continue
      const syntaxDiagnostics = yamlFile.syntaxDiagnostics.map((diagnostic) =>
        syncDiagnosticFromProjectDiagnostic(diagnostic, assignment)
      )
      diagnostics.push(...syntaxDiagnostics)
      if (syntaxDiagnostics.some((diagnostic) => diagnostic.severity === "error")) continue

      const validationFile = resolveValidationProjectFile(state.projectDir, assignment.sourcePath)
      if (validationFile !== undefined) {
        const facts = extractValidationOwnerYamlFacts({
          file: validationFile,
          data: yamlFile.data,
          rulesSnapshot,
        })
        ownerFacts.push({
          assignmentId: assignment.id,
          sourceProjectPath: assignment.sourceProjectPath,
          sourcePath: assignment.sourcePath,
          role: assignment.role,
          owner: { dir: validationFile.owner.dir, name: validationFile.owner.name },
          itemType: assignment.itemType,
          ...(facts?.ownerFacts === undefined ? {} : { ownerFacts: facts.ownerFacts }),
          ...(facts?.fieldIndex === undefined ? {} : { fieldIndex: facts.fieldIndex }),
        })
      }
      const preparedAssignment = prepareFullXmlSyncAssignment({
          assignment,
          preparedYamlFile: yamlFile,
          context: exportContextForSecondPass(state),
          index: state.index,
          assignments: state.composition.assignments(),
        })
      preparedAssignments.set(assignment.id, preparedAssignment)
      expectedOutputs.push(
        ...preparedAssignment.documents.map((document) => ({
          assignmentId: assignment.id,
          targetXmlPath: document.targetXmlPath,
        }))
      )
    } catch (caught) {
      preparedAssignments.delete(assignment.id)
      diagnostics.push(
        assignmentDiagnostic(assignment, "full_xml_sync_first_pass_failed", errorMessage(caught))
      )
    }
  }

  return { kind: "firstPassResult", diagnostics, projectFiles, ownerFacts, expectedOutputs }
}

async function runSecondPass(
  sharedMetadata: Extract<FullXmlSyncWorkerCommand, { kind: "secondPass" }>["sharedMetadata"],
  state: InitializedFullXmlSyncWorkerState
): Promise<FullXmlSyncSecondPassResult> {
  const diagnostics: FullXmlSyncDiagnostic[] = []
  const warnings: FullXmlSyncDiagnostic[] = []
  const writtenFiles: FullXmlSyncWrittenFile[] = []
  const fragments: NonNullable<Awaited<ReturnType<typeof writeFullXmlSyncAssignment>>["fragment"]>[] = []
  const progress = createSecondPassProgressReporter(state.workerIndex, preparedAssignments.size)
  let assignmentIndex = 0

  for (const [id, prepared] of preparedAssignments) {
    assignmentIndex += 1
    progress.assignmentStart(assignmentIndex, prepared.assignment)
    const startedAt = performance.now()
    const diagnosticsBefore = diagnostics.length
    const writtenBefore = writtenFiles.length
    try {
      const result = await writeFullXmlSyncAssignment({
        prepared,
        context: secondPassContext(state, sharedMetadata),
        outputDir: state.outputDir,
      })
      diagnostics.push(...result.diagnostics)
      writtenFiles.push(...result.writtenFiles)
      if (result.fragment !== undefined) fragments.push(result.fragment)
    } catch (caught) {
      diagnostics.push(
        assignmentDiagnostic(prepared.assignment, "full_xml_sync_second_pass_failed", errorMessage(caught))
      )
    } finally {
      progress.assignmentEnd({
        index: assignmentIndex,
        assignment: prepared.assignment,
        timeMs: performance.now() - startedAt,
        diagnostics: diagnostics.length - diagnosticsBefore,
        writtenFiles: writtenFiles.length - writtenBefore,
      })
      preparedAssignments.delete(id)
    }
  }

  return {
    kind: "secondPassResult",
    diagnostics,
    warnings,
    writtenFiles,
    fragmentBuffer: encodeConfigurationIndexFragments(fragments),
  }
}

function createSecondPassProgressReporter(
  workerIndex: number,
  total: number
): {
  assignmentStart(index: number, assignment: FullXmlSyncAssignment): void
  assignmentEnd(params: {
    index: number
    assignment: FullXmlSyncAssignment
    timeMs: number
    diagnostics: number
    writtenFiles: number
  }): void
} {
  let lastProgressAt = 0
  const enabled = process.env["NKDK_FULL_SYNC_PROFILE"] === "1"

  return {
    assignmentStart(index, assignment) {
      if (!enabled) return
      const now = performance.now()
      if (index !== 1 && now - lastProgressAt < 5_000) return
      lastProgressAt = now
      console.error(formatSecondPassProgress("assignment-start", workerIndex, total, { index, assignment }))
    },
    assignmentEnd(params) {
      if (!enabled || params.timeMs < 1_000) return
      console.error(formatSecondPassProgress("slow-assignment", workerIndex, total, params))
    },
  }
}

function formatSecondPassProgress(
  event: "assignment-start" | "slow-assignment",
  workerIndex: number,
  total: number,
  params: {
    index: number
    assignment: FullXmlSyncAssignment
    timeMs?: number
    diagnostics?: number
    writtenFiles?: number
  }
): string {
  const memory = process.memoryUsage()
  return [
    "[full-sync-worker-progress]",
    `event=${event}`,
    `worker=${workerIndex}`,
    `index=${params.index}`,
    `total=${total}`,
    `role=${JSON.stringify(params.assignment.role)}`,
    `itemType=${JSON.stringify(params.assignment.itemType)}`,
    `source=${JSON.stringify(params.assignment.sourceProjectPath)}`,
    params.timeMs === undefined ? undefined : `time=${params.timeMs.toFixed(2)}ms`,
    params.diagnostics === undefined ? undefined : `diagnostics=${params.diagnostics}`,
    params.writtenFiles === undefined ? undefined : `written=${params.writtenFiles}`,
    `rss=${bytesToMiB(memory.rss).toFixed(1)}MiB`,
    `heap=${bytesToMiB(memory.heapUsed).toFixed(1)}MiB`,
  ]
    .filter((part): part is string => part !== undefined)
    .join(" ")
}

function assignmentDescriptor(assignment: FullXmlSyncAssignment): PreparedYamlProjectFileDescriptor {
  const owner = ownerFromAssignment(assignment)
  return {
    projectPath: assignment.sourceProjectPath,
    filePath: assignment.sourcePath,
    role: assignment.role,
    owner,
    itemType: assignment.itemType,
  }
}

function ownerFromAssignment(assignment: FullXmlSyncAssignment): { dir: string; name: string } {
  if (assignment.role === "configuration") return { dir: "", name: assignment.itemName }
  const parts = assignment.sourceProjectPath.split("/")
  return { dir: parts[0] ?? "", name: parts[1] ?? assignment.itemName }
}

function itemTypeByYamlDir(assignments: readonly FullXmlSyncAssignment[]): Record<string, string> {
  return Object.fromEntries(
    assignments
      .map((assignment) => [ownerFromAssignment(assignment).dir, assignment.itemType] as const)
      .filter(([dir]) => dir.length > 0)
  )
}

function syncDiagnosticFromProjectDiagnostic(
  diagnostic: {
    severity: "error" | "warning"
    source: string
    message: string
    filePath: string
    line?: number
    col?: number
  },
  assignment?: FullXmlSyncAssignment
): FullXmlSyncDiagnostic {
  return {
    severity: diagnostic.severity,
    code: diagnostic.source,
    message: diagnostic.message,
    ...(assignment === undefined
      ? {}
      : {
          assignmentId: assignment.id,
          sourceProjectPath: assignment.sourceProjectPath,
          targetXmlPath: assignment.potentialOutputs[0]?.targetXmlPath,
        }),
    sourcePath: diagnostic.filePath,
    ...(diagnostic.line === undefined ? {} : { line: diagnostic.line }),
    ...(diagnostic.col === undefined ? {} : { col: diagnostic.col }),
  }
}

function requireInitializedState(): InitializedFullXmlSyncWorkerState {
  if (initializedState === undefined) throw new Error("Full XML sync worker не инициализирован")
  return initializedState
}

function disposeWorkerState(): void {
  preparedAssignments.clear()
  initializedState = undefined
}

export function fullXmlSyncWorkerStateForTests(): {
  initialized: boolean
  workerIndex?: number
  projectDir?: string
  importProjectDir?: string
  outputDir?: string
  preparedIds: string[]
  prepared: { id: string; documents: string[]; holdsPreparedYamlFile: false }[]
} {
  return {
    initialized: initializedState !== undefined,
    ...(initializedState === undefined
      ? {}
      : {
          workerIndex: initializedState.workerIndex,
          projectDir: initializedState.projectDir,
          importProjectDir: initializedState.context.importFromYAML?.projectDir,
          outputDir: initializedState.outputDir,
        }),
    preparedIds: [...preparedAssignments.keys()],
    prepared: [...preparedAssignments.entries()].map(([id, prepared]) => ({
      id,
      documents: prepared.documents.map((document) => document.targetXmlPath),
      holdsPreparedYamlFile: false,
    })),
  }
}

export function resetFullXmlSyncWorkerStateForTests(): void {
  disposeWorkerState()
}

export function createSecondPassTransferable(result: FullXmlSyncSecondPassResult) {
  return {
    get [transferableSymbol]() {
      return [result.fragmentBuffer]
    },
    get [valueSymbol]() {
      return result
    },
  }
}

function movableSecondPassResult(result: FullXmlSyncSecondPassResult): FullXmlSyncSecondPassResult {
  return move(createSecondPassTransferable(result)) as unknown as FullXmlSyncSecondPassResult
}

function exportContextForSecondPass(state: InitializedFullXmlSyncWorkerState): ConfigurationContextWithExportToXML {
  return {
    ...state.context,
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: state.context.version,
      context: {
        metadataForNumbering: [],
        forms: [],
        templates: [],
        parentName: "",
      },
      ...(state.context.exportToXML ?? {}),
    },
  }
}

function secondPassContext(
  state: InitializedFullXmlSyncWorkerState,
  sharedMetadata: Extract<FullXmlSyncWorkerCommand, { kind: "secondPass" }>["sharedMetadata"]
): ConfigurationContextWithExportToXML {
  const context = exportContextForSecondPass(state)
  return {
    ...context,
    exportToYAML: {
      toTyped: context.exportToYAML?.toTyped ?? false,
      ...context.exportToYAML,
      ownerMetadataCache: createFullXmlSyncSharedMetadataReader(sharedMetadata).ownerCache(state.projectDir),
    },
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function bytesToMiB(value: number): number {
  return value / 1024 / 1024
}
