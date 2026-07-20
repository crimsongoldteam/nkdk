import { hashFileBytes } from "../configurationIndex/hash"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { extractValidationOwnerYamlFacts } from "../validation/yamlFactExtractor"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlFile, PreparedYamlProjectFileDescriptor } from "../project/preparedYamlProject"
import type { ConfigurationContext } from "../context/types"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncFirstPassResult,
  FullXmlSyncOwnerFacts,
  FullXmlSyncWorkerCommand,
  FullXmlSyncWorkerCommandResult,
} from "./types"

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
    requireInitializedState()
    preparedAssignments.clear()
    return { kind: "secondPassResult", diagnostics: [], warnings: [], writtenFiles: [] }
  }

  return runFirstPass(command.assignments, requireInitializedState())
}

export default async function fullXmlSyncWorkerEntryPoint(
  command: FullXmlSyncWorkerCommand
): Promise<FullXmlSyncWorkerCommandResult> {
  return runFullXmlSyncWorkerCommand(command)
}

function runFirstPass(
  assignments: readonly FullXmlSyncAssignment[],
  state: InitializedFullXmlSyncWorkerState
): FullXmlSyncFirstPassResult {
  preparedAssignments.clear()
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
