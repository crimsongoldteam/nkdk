import { move, transferableSymbol, valueSymbol } from "piscina"
import { posix } from "node:path"
import { encodeConfigurationIndexFragments } from "../configurationIndex/fragment"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContext, XmlImportConfigurationContext } from "../context/types"
import type { ConfigurationSnapshotFragment } from "../configurationIndex/types"
import { withExportMetadataTargetOwners } from "../orchestration/appliedObject/metadataItemOwnerContext"
import { finalizeImportedYamlValues } from "../orchestration/property/finalizeImportedYAML"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { createOperationProfiler, type ValidationProfiler } from "../validation/profile"
import { type LayeredImportReferenceSnapshot } from "./componentReferenceIndex"
import { createLayeredOwnerMetadataCache } from "../project/componentState/indexes"
import { extractImportOwnerFacts } from "./ownerFacts"
import {
  extractImportValidationContribution,
  mergeImportValidationContributions,
  type ImportValidationContribution,
} from "./validationContribution"
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
import { writeGeneratedImportFiles, writeMainImportYaml, xmlExternalImportFiles } from "./writeOutput"

interface InitializedImportWorkerState {
  operationId: string
  workerIndex: number
  context: XmlImportConfigurationContext
  outputDir: string
}

interface DeferredImportYaml {
  diagnosticAssignment: Pick<ImportAssignment, "targetProjectPath" | "xmlFiles">
  targetProjectPath: string
  yaml: unknown
  rule: PreparedImportYaml["rule"]
  ownerContext: PreparedImportYaml["ownerContext"]
  formDataPathIndex: PreparedImportYaml["localIndexes"]["metadata"]["formDataPathIndex"]
  deferred: PreparedImportYaml["deferred"]
}

let initializedState: InitializedImportWorkerState | undefined
const preparedYaml = new Map<string, DeferredImportYaml>()

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
    return runSecondPass(command.referenceSnapshots, requireInitializedState())
  }

  return runFirstPass(command.assignments, requireInitializedState())
}

async function runSecondPass(
  referenceSnapshots: LayeredImportReferenceSnapshot,
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
  const ownerMetadataCache = createLayeredOwnerMetadataCache({
    localProjectDir: state.outputDir,
    baseProjectDir: state.outputDir,
    snapshots: referenceSnapshots,
  })

  for (const [id, prepared] of preparedYaml) {
    try {
      files.push(...(await writePreparedYamlToOutput(prepared, ownerMetadataCache, state, warnings, profiler)))
    } catch (caught) {
      diagnostics.push(importAssignmentDiagnostic(prepared.diagnosticAssignment, caught, "xml_import_yaml_failed"))
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
  prepared: DeferredImportYaml,
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
        formDataPathIndex: prepared.formDataPathIndex,
      })
  )
  const main = await writeMainImportYaml({
    outputDir: state.outputDir,
    targetProjectPath: prepared.targetProjectPath,
    yaml: prepared.yaml,
    profiler,
  })
  return [main.file]
}

function secondPassExportContext(params: {
  context: XmlImportConfigurationContext
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
  const files: ImportResultFile[] = []
  const ownerFacts: ValidationOwnerFacts[] = []
  const fragments: ConfigurationSnapshotFragment[] = []
  const validationContributions: ImportValidationContribution[] = []
  let earlyYamlCount = 0
  let earlyYamlBytes = 0
  let retainedYamlCount = 0
  let deferredValueCount = 0
  for (const assignment of assignments) {
    const collector = createConfigurationIndexCollector()
    try {
      const prepared = await prepareImportYaml({
        assignment,
        context: state.context,
        collector,
        profiler,
      })
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
      const validationContribution = profiler.measure(
        "Подготовка импорта конфигурации",
        "Извлечение validation contribution",
        { items: 1 },
        () => extractImportValidationContribution({ prepared, projectDir: state.outputDir })
      )
      try {
        const externalFiles = xmlExternalImportFiles(assignment)
        const externalTargets = new Set(externalFiles.map((file) => file.targetProjectPath))
        const assignmentFiles = await writeGeneratedImportFiles({
          outputDir: state.outputDir,
          targetProjectPath: prepared.targetProjectPath,
          generatedFiles: prepared.generatedFiles.filter(
            (file) =>
              !externalTargets.has(posix.join(posix.dirname(prepared.targetProjectPath), file.relativePath))
          ),
          profiler,
        })
        assignmentFiles.push(...externalFiles)
        if (prepared.deferred.length === 0) {
          const main = await writeMainImportYaml({
            outputDir: state.outputDir,
            targetProjectPath: prepared.targetProjectPath,
            yaml: prepared.yaml,
            profiler,
          })
          assignmentFiles.push(main.file)
          earlyYamlCount += 1
          earlyYamlBytes += main.bytes
        } else {
          preparedYaml.set(assignment.id, {
            diagnosticAssignment: {
              targetProjectPath: assignment.targetProjectPath,
              xmlFiles: assignment.xmlFiles,
            },
            targetProjectPath: prepared.targetProjectPath,
            yaml: prepared.yaml,
            rule: prepared.rule,
            ownerContext: prepared.ownerContext,
            formDataPathIndex: prepared.localIndexes.metadata.formDataPathIndex,
            deferred: prepared.deferred,
          })
          retainedYamlCount += 1
          deferredValueCount += prepared.deferred.length
        }
        files.push(...assignmentFiles)
      } catch (caught) {
        preparedYaml.delete(assignment.id)
        diagnostics.push(importAssignmentDiagnostic(assignment, caught, "xml_import_yaml_failed"))
        continue
      }
      ownerFacts.push(...preparedOwnerFacts)
      fragments.push(fragment)
      validationContributions.push(validationContribution)
    } catch (caught) {
      preparedYaml.delete(assignment.id)
      diagnostics.push(importAssignmentDiagnostic(assignment, caught))
    } finally {
      // Полные XML-данные принадлежат prepareImportYaml и к этому моменту уже вышли из области видимости.
    }
  }

  profiler.record("Подготовка импорта конфигурации", "Досрочно записанные YAML", {
    items: earlyYamlCount,
    bytes: earlyYamlBytes,
    timeMs: 0,
  })
  profiler.record("Подготовка импорта конфигурации", "YAML, оставленные до второго прохода", {
    items: retainedYamlCount,
    timeMs: 0,
  })
  profiler.record("Подготовка импорта конфигурации", "Отложенные значения YAML", {
    items: deferredValueCount,
    timeMs: 0,
  })
  profiler.flush()
  const validation = mergeImportValidationContributions(validationContributions)
  return {
    kind: "firstPassResult",
    ownerFacts,
    validationContribution: {
      ...validation.validationContribution,
      localDependencies: [...validation.validationContribution.localDependencies, ...validation.localDependencies],
    },
    diagnostics,
    files,
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
  assignment: Pick<ImportAssignment, "targetProjectPath" | "xmlFiles">,
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
