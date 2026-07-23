import fs from "node:fs"
import { dirname, join, posix } from "node:path"
import { move, transferableSymbol, valueSymbol } from "piscina"
import { exportToYAML } from "../../yaml/export"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContext, ConfigurationContextFromXML } from "../context/types"
import type { ConfigurationIndexFragment } from "../configurationIndex/types"
import { withExportMetadataTargetOwners } from "../orchestration/appliedObject/metadataItemOwnerContext"
import { finalizeImportedYamlValues } from "../orchestration/property/finalizeImportedYAML"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "../validation/dataPath/sharedOwnerCache"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import { createOperationProfiler, type ValidationProfiler } from "../validation/profile"
import { extractImportOwnerFacts } from "./ownerFacts"
import { ImportXmlInputError, prepareImportYaml, type PreparedImportYaml } from "./prepareYaml"
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
  outputDir: string
}

let initializedState: InitializedImportWorkerState | undefined
const preparedYaml = new Map<string, PreparedImportYaml>()

export async function runImportWorkerCommand(command: ImportWorkerCommand): Promise<ImportWorkerCommandResult> {
  if (command.kind === "initialize") {
    preparedYaml.clear()
    initializedState = {
      operationId: command.operationId,
      workerIndex: command.workerIndex,
      context: command.context,
      outputDir: command.outputDir,
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
  const profiler = createOperationProfiler({
    operation: "import-from-xml",
    scope: { scope: "worker", workerIndex: state.workerIndex },
    aggregate: true,
  })
  const diagnostics: ImportDiagnostic[] = []
  const warnings: ImportDiagnostic[] = []
  const files: ImportResultFile[] = []
  const ownerMetadataCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: state.outputDir,
    snapshot: sharedMetadata,
  })

  for (const [id, prepared] of preparedYaml) {
    try {
      files.push(
        ...(await writePreparedYamlToOutput(prepared, ownerMetadataCache, state, warnings, profiler))
      )
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
      preparedYaml.delete(id)
    }
  }

  profiler.record("Подготовка импорта конфигурации", "Формирование worker списка файлов результата импорта", {
    items: files.length,
    timeMs: 0,
  })
  profiler.flush()
  return { kind: "secondPassResult", diagnostics, warnings, files }
}

async function writePreparedYamlToOutput(
  prepared: PreparedImportYaml,
  ownerMetadataCache: OwnerMetadataCache,
  state: InitializedImportWorkerState,
  warnings: ImportDiagnostic[],
  profiler: ValidationProfiler
): Promise<ImportResultFile[]> {
  const contextWithOwners = profiler.measure(
    "Подготовка импорта конфигурации",
    "Подготовка контекста YAML",
    { items: 1 },
    () => {
      const context = secondPassExportContext({
        context: state.context,
        ownerMetadataCache,
        targetProjectPath: prepared.targetProjectPath,
        warnings,
      })
      return withExportMetadataTargetOwners(context, prepared.ownerContext)
    }
  )
  profiler.measure(
    "Подготовка импорта конфигурации",
    "Уточнение отложенных значений YAML",
    { items: prepared.deferred.length },
    () =>
      finalizeImportedYamlValues({
        yaml: prepared.yaml,
        rootRule: prepared.rule,
        deferred: prepared.deferred,
        context: contextWithOwners,
        formDataPathIndex: prepared.localIndexes.metadata.formDataPathIndex,
      })
  )
  const exported = profiler.measure("Подготовка импорта конфигурации", "Сериализация YAML", { items: 1 }, () =>
    prepared.yaml === undefined ? "" : exportToYAML(prepared.yaml)
  )
  const yamlSourcePath = join(state.outputDir, prepared.targetProjectPath)
  await profiler.measureAsync("Подготовка импорта конфигурации", "Запись основного YAML-файла", { items: 1 }, async () => {
    await fs.promises.mkdir(dirname(yamlSourcePath), { recursive: true })
    await fs.promises.writeFile(yamlSourcePath, exported, "utf-8")
  })

  const files: ImportResultFile[] = [
    {
      sourceKind: "worker",
      sourcePath: yamlSourcePath,
      targetProjectPath: prepared.targetProjectPath,
    },
  ]
  for (const externalFile of prepared.generatedFiles) {
    const targetProjectPath = posix.join(posix.dirname(prepared.targetProjectPath), externalFile.relativePath)
    const sourcePath = join(state.outputDir, targetProjectPath)
    await profiler.measureAsync(
      "Подготовка импорта конфигурации",
      "Запись связанного файла",
      { items: 1, bytes: Buffer.byteLength(externalFile.content, "utf-8") },
      async () => {
        await fs.promises.mkdir(dirname(sourcePath), { recursive: true })
        await fs.promises.writeFile(sourcePath, externalFile.content, "utf-8")
      }
    )
    files.push({ sourceKind: "worker", sourcePath, targetProjectPath })
  }
  return files
}

function secondPassExportContext(params: {
  context: ConfigurationContextFromXML
  ownerMetadataCache: OwnerMetadataCache
  targetProjectPath: string
  warnings: ImportDiagnostic[]
}): ConfigurationContext {
  const { projectDir: _projectDir, ...baseExportContext } = params.context.exportToYAML ?? { toTyped: false }
  return {
    ...params.context,
    exportToYAML: {
      ...baseExportContext,
      ownerMetadataCache: params.ownerMetadataCache,
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
  preparedYaml.clear()
  const profiler = createOperationProfiler({
    operation: "import-from-xml",
    scope: { scope: "worker", workerIndex: state.workerIndex },
    aggregate: true,
  })
  const diagnostics: ImportDiagnostic[] = []
  const ownerFacts: ValidationOwnerFacts[] = []
  const fragments: ConfigurationIndexFragment[] = []

  for (const assignment of assignments) {
    const collector = createConfigurationIndexCollector()
    try {
      const prepared = await prepareImportYaml({ assignment, context: state.context, collector, profiler })
      const preparedOwnerFacts = profiler.measure(
        "Подготовка импорта конфигурации",
        "Извлечение локального индекса метаданных",
        { items: 1 },
        () => extractImportOwnerFacts(prepared)
      )
      const fragment = profiler.measure(
        "Подготовка импорта конфигурации",
        "Извлечение данных для индекса конфигурации",
        { items: 1 },
        () => collector.fragment(assignment.targetProjectPath)
      )
      preparedYaml.set(assignment.id, prepared)
      ownerFacts.push(...preparedOwnerFacts)
      fragments.push(fragment)
    } catch (caught) {
      preparedYaml.delete(assignment.id)
      diagnostics.push(importAssignmentDiagnostic(assignment, caught))
    } finally {
      // Полные XML-данные принадлежат prepareImportYaml и к этому моменту уже вышли из области видимости.
    }
  }

  profiler.flush()
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
  preparedYaml.clear()
  initializedState = undefined
}

export function workerStateForTests(): {
  initialized: boolean
  operationId?: string
  workerIndex?: number
  outputDir?: string
  preparedYamlIds: string[]
} {
  return {
    initialized: initializedState !== undefined,
    ...(initializedState === undefined
      ? {}
      : {
          operationId: initializedState.operationId,
          workerIndex: initializedState.workerIndex,
          outputDir: initializedState.outputDir,
        }),
    preparedYamlIds: [...preparedYaml.keys()],
  }
}

export function resetImportWorkerStateForTests(): void {
  disposeWorkerState()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
