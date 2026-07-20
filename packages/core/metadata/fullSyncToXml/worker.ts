import { move, transferableSymbol, valueSymbol } from "piscina"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexReader } from "../configurationIndex/sharedSnapshot"
import { hashFileBytes } from "../configurationIndex/hash"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { extractValidationOwnerYamlFacts } from "../validation/yamlFactExtractor"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlFile, PreparedYamlProjectFileDescriptor } from "../project/preparedYamlProject"
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
} from "./types"
import { writeFullXmlSyncAssignment } from "./writeAssignment"

registerValidationMetadata()

interface InitializedFullXmlSyncWorkerState {
  workerIndex: number
  projectDir: string
  outputDir: string
  context: ConfigurationContext
}

interface PreparedSyncAssignment {
  assignment: FullXmlSyncAssignment
  yamlFile: PreparedYamlFile
}

let initializedState: InitializedFullXmlSyncWorkerState | undefined
const preparedAssignments = new Map<string, PreparedSyncAssignment>()
let firstPassAssignments: FullXmlSyncAssignment[] = []

export async function runFullXmlSyncWorkerCommand(
  command: FullXmlSyncWorkerCommand
): Promise<FullXmlSyncWorkerCommandResult> {
  if (command.kind === "initialize") {
    preparedAssignments.clear()
    initializedState = {
      workerIndex: command.workerIndex,
      projectDir: command.projectDir,
      outputDir: command.outputDir,
      context: command.context,
    }
    return undefined
  }

  if (command.kind === "dispose") {
    disposeWorkerState()
    return undefined
  }

  if (command.kind === "secondPass") {
    return runSecondPass(command, requireInitializedState())
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
  firstPassAssignments = [...assignments]
  const descriptors = assignments.map(assignmentDescriptor)
  const prepared = prepareYamlFiles({
    files: descriptors,
    itemTypeByYamlDir: itemTypeByYamlDir(assignments),
    includeProjectFiles: true,
    hashFileBytes,
  })
  const diagnostics: FullXmlSyncDiagnostic[] = [
    ...prepared.diagnostics.map((diagnostic) => syncDiagnosticFromProjectDiagnostic(diagnostic)),
  ]
  const ownerFacts: FullXmlSyncOwnerFacts[] = []
  const rulesSnapshot = createValidationRulesSnapshot(state.context)
  const yamlFileByPath = new Map(prepared.yamlFiles.map((file) => [file.projectPath, file]))

  for (const assignment of assignments) {
    const yamlFile = yamlFileByPath.get(assignment.sourceProjectPath)
    if (yamlFile === undefined) continue

    const syntaxDiagnostics = yamlFile.syntaxDiagnostics.map((diagnostic) => syncDiagnosticFromProjectDiagnostic(diagnostic, assignment))
    diagnostics.push(...syntaxDiagnostics)
    if (syntaxDiagnostics.some((diagnostic) => diagnostic.severity === "error")) continue

    preparedAssignments.set(assignment.id, { assignment, yamlFile })

    const validationFile = resolveValidationProjectFile(state.projectDir, assignment.sourcePath)
    if (validationFile === undefined) continue
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
      ...(facts?.ownerModelStub === undefined ? {} : { ownerModelStub: facts.ownerModelStub }),
      ...(facts?.fieldIndex === undefined ? {} : { fieldIndex: facts.fieldIndex }),
    })
  }

  return { kind: "firstPassResult", diagnostics, projectFiles: prepared.projectFiles, ownerFacts }
}

async function runSecondPass(
  command: Extract<FullXmlSyncWorkerCommand, { kind: "secondPass" }>,
  state: InitializedFullXmlSyncWorkerState
): Promise<FullXmlSyncSecondPassResult> {
  const index = createConfigurationIndexReader(command.index)
  const diagnostics: FullXmlSyncDiagnostic[] = []
  const warnings: FullXmlSyncDiagnostic[] = []
  const writtenFiles: FullXmlSyncWrittenFile[] = []
  const fragments: NonNullable<Awaited<ReturnType<typeof writeFullXmlSyncAssignment>>["fragment"]>[] = []

  for (const [id, prepared] of preparedAssignments) {
    try {
      const result = await writeFullXmlSyncAssignment({
        assignment: prepared.assignment,
        assignments: firstPassAssignments,
        preparedYamlFile: prepared.yamlFile,
        context: exportContextForSecondPass(state),
        outputDir: state.outputDir,
        index,
      })
      diagnostics.push(...result.diagnostics)
      writtenFiles.push(...result.writtenFiles)
      if (result.fragment !== undefined) fragments.push(result.fragment)
    } catch (caught) {
      diagnostics.push(assignmentDiagnostic(prepared.assignment, "full_xml_sync_second_pass_failed", errorMessage(caught)))
    } finally {
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
          targetXmlPath: assignment.outputs[0]?.targetXmlPath,
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
  firstPassAssignments = []
  initializedState = undefined
}

export function fullXmlSyncWorkerStateForTests(): {
  initialized: boolean
  workerIndex?: number
  projectDir?: string
  outputDir?: string
  preparedIds: string[]
} {
  return {
    initialized: initializedState !== undefined,
    ...(initializedState === undefined
      ? {}
      : {
          workerIndex: initializedState.workerIndex,
          projectDir: initializedState.projectDir,
          outputDir: initializedState.outputDir,
        }),
    preparedIds: [...preparedAssignments.keys()],
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

function assignmentDiagnostic(
  assignment: FullXmlSyncAssignment,
  code: string,
  message: string
): FullXmlSyncDiagnostic {
  return {
    severity: "error",
    code,
    message,
    assignmentId: assignment.id,
    sourceProjectPath: assignment.sourceProjectPath,
    sourcePath: assignment.sourcePath,
    targetXmlPath: assignment.outputs[0]?.targetXmlPath,
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
