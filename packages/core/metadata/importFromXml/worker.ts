import { move, transferableSymbol, valueSymbol } from "piscina"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContextFromXML } from "../context/types"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { extractImportOwnerFacts } from "./ownerFacts"
import { ImportXmlInputError, prepareImportModel, type PreparedImportModel } from "./prepareModel"
import type {
  ImportAssignment,
  ImportDiagnostic,
  ImportFirstPassResult,
  ImportWorkerCommand,
  ImportWorkerCommandResult,
} from "./types"

interface InitializedImportWorkerState {
  operationId: string
  workerIndex: number
  context: ConfigurationContextFromXML
  tempDir: string
}

let initializedState: InitializedImportWorkerState | undefined
const preparedModels = new Map<string, PreparedImportModel>()

export async function runImportWorkerCommand(command: ImportWorkerCommand): Promise<ImportWorkerCommandResult> {
  if (command.kind === "initialize") {
    preparedModels.clear()
    initializedState = {
      operationId: command.operationId,
      workerIndex: command.workerIndex,
      context: command.context,
      tempDir: command.tempDir,
    }
    return undefined
  }

  if (command.kind === "dispose") {
    disposeWorkerState()
    return undefined
  }

  if (command.kind === "secondPass") {
    requireInitializedState()
    throw new Error("Второй проход XML-import будет реализован в Task 5")
  }

  return runFirstPass(command.assignments, requireInitializedState())
}

export default async function importWorkerEntryPoint(command: ImportWorkerCommand): Promise<ImportWorkerCommandResult> {
  const result = await runImportWorkerCommand(command)
  return result?.kind === "firstPassResult" ? movableFirstPassResult(result) : result
}

async function runFirstPass(
  assignments: readonly ImportAssignment[],
  state: InitializedImportWorkerState
): Promise<ImportFirstPassResult> {
  preparedModels.clear()
  const diagnostics: ImportDiagnostic[] = []
  const ownerFacts: ValidationOwnerFacts[] = []
  const fragments: ConfigurationIndexFragment[] = []

  for (const assignment of assignments) {
    const collector = createConfigurationIndexCollector()
    try {
      const prepared = await prepareImportModel({ assignment, context: state.context, collector })
      const preparedOwnerFacts = extractImportOwnerFacts(prepared)
      const fragment = collector.fragment(assignment.targetProjectPath)
      preparedModels.set(assignment.id, prepared)
      ownerFacts.push(...preparedOwnerFacts)
      fragments.push(fragment)
    } catch (caught) {
      preparedModels.delete(assignment.id)
      diagnostics.push(importAssignmentDiagnostic(assignment, caught))
    } finally {
      // Полные XML-данные принадлежат prepareImportModel и к этому моменту уже вышли из области видимости.
    }
  }

  return {
    kind: "firstPassResult",
    ownerFacts,
    diagnostics,
    fragmentBuffer: encodeConfigurationIndexFragments(fragments),
  }
}

export function createFirstPassTransferable(result: ImportFirstPassResult) {
  return {
    get [transferableSymbol]() {
      return [result.fragmentBuffer]
    },
    get [valueSymbol]() {
      return result
    },
  }
}

function movableFirstPassResult(result: ImportFirstPassResult): ImportFirstPassResult {
  return move(createFirstPassTransferable(result)) as unknown as ImportFirstPassResult
}

function importAssignmentDiagnostic(assignment: ImportAssignment, caught: unknown): ImportDiagnostic {
  const sourcePath =
    caught instanceof ImportXmlInputError
      ? caught.sourcePath
      : (assignment.xmlFiles.find((input) => input.role === "metadata") ?? assignment.xmlFiles[0])?.sourcePath
  return {
    severity: "error",
    code: "xml_import_assignment_failed",
    message: errorMessage(caught),
    targetProjectPath: assignment.targetProjectPath,
    ...(sourcePath === undefined ? {} : { sourcePath }),
  }
}

function requireInitializedState(): InitializedImportWorkerState {
  if (initializedState === undefined) throw new Error("XML-import worker не инициализирован")
  return initializedState
}

function disposeWorkerState(): void {
  preparedModels.clear()
  initializedState = undefined
}

export function workerStateForTests(): {
  initialized: boolean
  operationId?: string
  workerIndex?: number
  tempDir?: string
  preparedIds: string[]
} {
  return {
    initialized: initializedState !== undefined,
    ...(initializedState === undefined
      ? {}
      : {
          operationId: initializedState.operationId,
          workerIndex: initializedState.workerIndex,
          tempDir: initializedState.tempDir,
        }),
    preparedIds: [...preparedModels.keys()],
  }
}

export function resetImportWorkerStateForTests(): void {
  disposeWorkerState()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
