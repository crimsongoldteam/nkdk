import fs from "node:fs"
import { dirname, join, posix } from "node:path"
import { move, transferableSymbol, valueSymbol } from "piscina"
import { exportToYAML } from "../../yaml/export"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContext, ConfigurationContextFromXML, ExternalFileEntry } from "../context/types"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import { exportClientApplicationFormToYAML } from "../forms/clientApplicationForm/toYAML"
import type { ClientApplicationForm } from "../forms/clientApplicationForm/types"
import { exportMetadataItemToYAML } from "../orchestration"
import { withExportMetadataTargetOwners } from "../orchestration/appliedObject/metadataItemOwnerContext"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../validation/dataPath/sharedOwnerCache"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { extractImportOwnerFacts } from "./ownerFacts"
import { ImportXmlInputError, prepareImportModel, type PreparedImportModel } from "./prepareModel"
import type {
  ImportAssignment,
  ImportDiagnostic,
  ImportFirstPassResult,
  ImportResultFile,
  ImportSecondPassResult,
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
    return runSecondPass(command.sharedMetadata, requireInitializedState())
  }

  return runFirstPass(command.assignments, requireInitializedState())
}

async function runSecondPass(
  sharedMetadata: SharedValidationSnapshot,
  state: InitializedImportWorkerState
): Promise<ImportSecondPassResult> {
  const diagnostics: ImportDiagnostic[] = []
  const warnings: ImportDiagnostic[] = []
  const files: ImportResultFile[] = []
  const ownerMetadataCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: state.tempDir,
    snapshot: sharedMetadata,
  })

  for (const [id, prepared] of preparedModels) {
    try {
      files.push(...(await writePreparedYamlToTemp(prepared, ownerMetadataCache, state, warnings)))
      files.push(
        ...prepared.assignment.externalFiles.map((file) => ({
          sourceKind: "xml" as const,
          sourcePath: file.sourcePath,
          targetProjectPath: file.targetProjectPath,
        }))
      )
    } catch (caught) {
      diagnostics.push(importAssignmentDiagnostic(prepared.assignment, caught, "xml_import_yaml_failed"))
    } finally {
      preparedModels.delete(id)
    }
  }

  return { kind: "secondPassResult", diagnostics, warnings, files }
}

async function writePreparedYamlToTemp(
  prepared: PreparedImportModel,
  ownerMetadataCache: OwnerMetadataCache,
  state: InitializedImportWorkerState,
  warnings: ImportDiagnostic[]
): Promise<ImportResultFile[]> {
  const externalFilesCollector: ExternalFileEntry[] = []
  const context = secondPassExportContext({
    context: state.context,
    ownerMetadataCache,
    targetProjectPath: prepared.targetProjectPath,
    externalFilesCollector,
    warnings,
  })
  const contextWithOwners = withExportMetadataTargetOwners(context, prepared.ownerContext)
  const exported = exportPreparedYaml(prepared, contextWithOwners)
  const yamlSourcePath = join(state.tempDir, prepared.targetProjectPath)
  await fs.promises.mkdir(dirname(yamlSourcePath), { recursive: true })
  await fs.promises.writeFile(yamlSourcePath, exported.yaml, "utf-8")

  const files: ImportResultFile[] = [
    {
      sourceKind: "worker",
      sourcePath: yamlSourcePath,
      targetProjectPath: prepared.targetProjectPath,
    },
  ]
  for (const externalFile of [...prepared.generatedFiles, ...exported.externalFiles]) {
    const targetProjectPath = posix.join(posix.dirname(prepared.targetProjectPath), externalFile.relativePath)
    const sourcePath = join(state.tempDir, targetProjectPath)
    await fs.promises.mkdir(dirname(sourcePath), { recursive: true })
    await fs.promises.writeFile(sourcePath, externalFile.content, "utf-8")
    files.push({ sourceKind: "worker", sourcePath, targetProjectPath })
  }
  return files
}

function exportPreparedYaml(
  prepared: PreparedImportModel,
  context: ConfigurationContext
): { yaml: string; externalFiles: ExternalFileEntry[] } {
  if (prepared.localDataPathIndex !== undefined) {
    const result = exportClientApplicationFormToYAML(context, prepared.model as ClientApplicationForm)
    return { yaml: result.yaml === undefined ? "" : exportToYAML(result.yaml), externalFiles: result.externalFiles }
  }

  const yaml = exportMetadataItemToYAML({ context, data: prepared.model, rule: prepared.rule })
  return {
    yaml: yaml === undefined ? "" : exportToYAML(yaml),
    externalFiles: context.exportToYAML?.externalFilesCollector ?? [],
  }
}

function secondPassExportContext(params: {
  context: ConfigurationContextFromXML
  ownerMetadataCache: OwnerMetadataCache
  targetProjectPath: string
  externalFilesCollector: ExternalFileEntry[]
  warnings: ImportDiagnostic[]
}): ConfigurationContext {
  const { projectDir: _projectDir, ...baseExportContext } = params.context.exportToYAML ?? { toTyped: false }
  return {
    ...params.context,
    exportToYAML: {
      ...baseExportContext,
      ownerMetadataCache: params.ownerMetadataCache,
      externalFilesCollector: params.externalFilesCollector,
      dataPathDiagnosticSink: {
        targetProjectPath: params.targetProjectPath,
        append(diagnostic) {
          const duplicate = params.warnings.some(
            (warning) =>
              warning.code === diagnostic.code &&
              warning.targetProjectPath === diagnostic.targetProjectPath &&
              warning.value === diagnostic.value
          )
          if (!duplicate) params.warnings.push(diagnostic)
        },
      },
    },
  }
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

function importAssignmentDiagnostic(
  assignment: ImportAssignment,
  caught: unknown,
  code = "xml_import_assignment_failed"
): ImportDiagnostic {
  const sourcePath =
    caught instanceof ImportXmlInputError
      ? caught.sourcePath
      : (assignment.xmlFiles.find((input) => input.role === "metadata") ?? assignment.xmlFiles[0])?.sourcePath
  return {
    severity: "error",
    code,
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
