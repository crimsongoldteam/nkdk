import { move, transferableSymbol, valueSymbol } from "piscina"
import { hashFileBytes } from "../configurationIndex/hash"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContext, XmlImportConfigurationContext } from "../context/types"
import type { ConfigurationSnapshotFragment } from "../configurationIndex/types"
import { withExportMetadataTargetOwners } from "../orchestration/appliedObject/metadataItemOwnerContext"
import { finalizeImportedYamlValues } from "../orchestration/property/finalizeImportedYAML"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { createOperationProfiler, type ValidationProfiler } from "../validation/profile"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { createProjectYamlCacheFromEntries } from "../validation/projectYamlCache"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { validationProjectComponentFromAddress } from "../validation/projectComponents"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import {
  createValidationSchemaCache,
  validateProjectFileFirstPass,
  type ValidationSchemaCache,
} from "../validation/projectValidationPasses"
import {
  createProjectStateFileUpdateBatch,
  projectStateFieldEntries,
  projectStateOwnerFacts,
  projectStateReferenceEntry,
  toProjectStateFileUpdate,
  type ProjectStateYamlFileUpdate,
} from "../projectState/fileUpdate"
import { createProjectStateOwnerMetadataCache } from "../projectState/dependencyValidation"
import { openProjectStateReadSession } from "../projectState/service"
import type { ProjectStateImportFinalFileStateBatch, ProjectStateImportIndexContribution } from "../projectState/importSession"
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
import {
  serializeImportYaml,
  writeGeneratedImportFiles,
  writeMainImportYaml,
  xmlExternalImportFiles,
  type SerializedImportYaml,
} from "./writeOutput"

interface InitializedImportWorkerState {
  operationId: string
  workerIndex: number
  context: XmlImportConfigurationContext
  outputDir: string
  projectDir: string
  componentPath: string
  schemaCache: ValidationSchemaCache
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

interface ActiveSecondPass {
  readonly readSession: ReturnType<typeof openProjectStateReadSession>
  readonly ownerMetadataCache: OwnerMetadataCache
}

let initializedState: InitializedImportWorkerState | undefined
let schemaCacheForTests: ValidationSchemaCache | undefined
const preparedYaml = new Map<string, DeferredImportYaml>()
let activeSecondPass: ActiveSecondPass | undefined

export async function runImportWorkerCommand(command: ImportWorkerCommand): Promise<ImportWorkerCommandResult> {
  if (command.kind === "initialize") {
    endSecondPass()
    preparedYaml.clear()
    initializedState = {
      operationId: command.operationId,
      workerIndex: command.workerIndex,
      context: command.context,
      outputDir: command.outputDir,
      projectDir: command.projectDir ?? command.outputDir,
      componentPath: command.componentPath ?? "cf",
      schemaCache: schemaCacheForTests ?? createValidationSchemaCache(command.context),
    }
    return undefined
  }

  if (command.kind === "dispose") {
    disposeWorkerState()
    return undefined
  }

  if (command.kind === "beginSecondPass") {
    beginSecondPass(command.readToken, requireInitializedState())
    return undefined
  }

  if (command.kind === "endSecondPass") {
    endSecondPass()
    return undefined
  }

  if (command.kind === "secondPass") {
    return runSecondPass(command.assignmentId, requireInitializedState())
  }

  return runFirstPass(command.assignments, requireInitializedState())
}

async function runSecondPass(
  assignmentId: string,
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
  const finalFileStateBatches: ProjectStateImportFinalFileStateBatch[] = []
  const secondPass = activeSecondPass
  if (secondPass === undefined) throw new Error("Второй проход XML-import worker не начат")
  const prepared = preparedYaml.get(assignmentId)
  if (prepared !== undefined) {
    try {
      const written = await writePreparedYamlToOutput(
        prepared,
        secondPass.ownerMetadataCache,
        state,
        warnings,
        profiler,
      )
      files.push(written.file)
      finalFileStateBatches.push(written.finalState)
    } catch (caught) {
      diagnostics.push(importAssignmentDiagnostic(prepared.diagnosticAssignment, caught, "xml_import_yaml_failed"))
    } finally {
      preparedYaml.delete(assignmentId)
    }
  }

  profiler.record("Подготовка импорта конфигурации", "Формирование worker списка файлов результата импорта", {
    items: files.length,
    timeMs: 0,
  })
  profiler.flush()
  return { kind: "secondPassResult", diagnostics, warnings, files, finalFileStateBatches }
}

function beginSecondPass(
  readToken: import("../projectState/contracts").ProjectStateReadToken,
  state: InitializedImportWorkerState,
): void {
  if (activeSecondPass !== undefined) throw new Error("Второй проход XML-import worker уже начат")
  const readSession = openProjectStateReadSession(readToken)
  activeSecondPass = {
    readSession,
    ownerMetadataCache: createProjectStateOwnerMetadataCache({
      projectDir: state.projectDir,
      componentPath: state.componentPath,
      queryPort: readSession,
    }),
  }
}

function endSecondPass(): void {
  activeSecondPass?.readSession.close()
  activeSecondPass = undefined
}

async function writePreparedYamlToOutput(
  prepared: DeferredImportYaml,
  ownerMetadataCache: OwnerMetadataCache,
  state: InitializedImportWorkerState,
  warnings: ImportDiagnostic[],
  profiler: ValidationProfiler
): Promise<{ file: ImportResultFile; finalState: ProjectStateImportFinalFileStateBatch }> {
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
  const serialized = serializePreparedYaml(prepared.targetProjectPath, prepared.yaml, state, profiler)
  const main = await writeMainImportYaml({ serialized, profiler })
  return { file: main.file, finalState: validateSerializedImportYaml(prepared, serialized, state).final }
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
  return result?.kind === "firstPassResult"
    ? movableFirstPassResult(result)
    : result?.kind === "secondPassResult"
      ? movableSecondPassResult(result)
      : result
}

async function runFirstPass(
  assignments: readonly ImportAssignment[],
  state: InitializedImportWorkerState,
): Promise<ImportFirstPassResult> {
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
  const indexContributions: ProjectStateImportIndexContribution[] = []
  const finalFileStateBatches: ProjectStateImportFinalFileStateBatch[] = []
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
        const assignmentFiles = await writeGeneratedImportFiles({
          outputDir: state.outputDir,
          targetProjectPath: prepared.targetProjectPath,
          generatedFiles: prepared.generatedFiles,
          profiler,
        })
        const generatedStateEntries = assignmentFiles.map((file, index) => ({
          update: {
            kind: "resource" as const,
            projectPath: `${state.componentPath}/${file.targetProjectPath}`,
            componentPath: state.componentPath,
            resourceKind: "resource" as const,
          },
          hash: hashGeneratedContent(prepared.generatedFiles[index]?.content ?? ""),
        }))
        if (generatedStateEntries.length > 0) {
          const batch = createProjectStateFileUpdateBatch(generatedStateEntries)
          finalFileStateBatches.push({
            updates: generatedStateEntries.map(({ update }) => update),
            hashBytes: batch.hashBytes,
          })
        }
        assignmentFiles.push(...xmlExternalImportFiles(assignment))
        if (prepared.deferred.length === 0) {
          const serialized = serializePreparedYaml(prepared.targetProjectPath, prepared.yaml, state, profiler)
          const main = await writeMainImportYaml({ serialized, profiler })
          const validated = validateSerializedImportYaml(prepared, serialized, state)
          assignmentFiles.push(main.file)
          finalFileStateBatches.push(validated.final)
          indexContributions.push(importIndexContribution(prepared, validationContribution, state))
          earlyYamlCount += 1
          earlyYamlBytes += main.bytes
        } else {
          indexContributions.push(importIndexContribution(prepared, validationContribution, state))
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
    configurationFragments: fragments,
    indexContributions,
    finalFileStateBatches,
  }
}

export function createFirstPassTransferable(result: ImportFirstPassResult) {
  return {
    get [transferableSymbol]() {
      return [
        ...result.finalFileStateBatches.map(({ hashBytes }) => hashBytes.buffer as ArrayBuffer),
      ]
    },
    get [valueSymbol]() {
      return result
    },
  }
}

export function createSecondPassTransferable(result: ImportSecondPassResult) {
  return {
    get [transferableSymbol]() {
      return result.finalFileStateBatches.map(({ hashBytes }) => hashBytes.buffer as ArrayBuffer)
    },
    get [valueSymbol]() {
      return result
    },
  }
}

function movableSecondPassResult(result: ImportSecondPassResult): ImportSecondPassResult {
  return move(createSecondPassTransferable(result)) as unknown as ImportSecondPassResult
}

function serializePreparedYaml(
  targetProjectPath: string,
  yaml: unknown,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
): SerializedImportYaml {
  return profiler.measure(
    "Подготовка импорта конфигурации",
    "Сериализация YAML",
    { items: 1 },
    () => serializeImportYaml({
      output: {
        sourceKind: "worker",
        sourcePath: `${state.outputDir}/${targetProjectPath}`,
        targetProjectPath,
      },
      yaml,
    }),
  )
}

function validateSerializedImportYaml(
  prepared: Pick<DeferredImportYaml, "targetProjectPath" | "yaml">,
  serialized: SerializedImportYaml,
  state: InitializedImportWorkerState,
): { index: ProjectStateImportIndexContribution; final: ProjectStateImportFinalFileStateBatch } {
  const component = validationProjectComponentFromAddress(state.projectDir, {
    componentPath: state.componentPath,
    componentDir: state.outputDir,
  })
  const file = resolveValidationProjectFile(state.projectDir, prepared.targetProjectPath, component)
  if (file === undefined) throw new Error(`Не удалось классифицировать YAML import: ${prepared.targetProjectPath}`)
  const text = new TextDecoder().decode(serialized.bytes)
  const entry = { filePath: file.absolutePath, text, parsed: parseMetadataYaml(text) }
  const first = validateProjectFileFirstPass({
    projectDir: state.projectDir,
    file,
    cache: createProjectYamlCacheFromEntries([entry]),
    context: state.context,
    schemaCache: state.schemaCache,
    rulesSnapshot: createValidationRulesSnapshot(state.context),
  })
  const full = toProjectStateFileUpdate(first, importFileIdentity(state, prepared.targetProjectPath, file.kind))
  return splitImportYamlUpdate(full, serialized.localHash)
}

function splitImportYamlUpdate(
  update: ProjectStateYamlFileUpdate,
  hash: bigint,
): { index: ProjectStateImportIndexContribution; final: ProjectStateImportFinalFileStateBatch } {
  if (update.resourceKind !== "yaml" || update.yamlRole === undefined) {
    throw new Error("Import validation вернула не YAML identity")
  }
  const identity = {
    kind: "yaml" as const,
    projectPath: update.projectPath,
    componentPath: update.componentPath,
    resourceKind: "yaml" as const,
    yamlRole: update.yamlRole,
  }
  const { references, owners, fields, forms, pendingReferences, pendingChecks, dependencies, localValidation } = update
  const batch = createProjectStateFileUpdateBatch([{ update, hash }])
  return {
    index: { ...identity, references, owners, fields, forms },
    final: {
      updates: [{ ...identity, localValidation, pendingReferences, pendingChecks, dependencies }],
      hashBytes: batch.hashBytes,
    },
  }
}

function importIndexContribution(
  prepared: PreparedImportYaml,
  contribution: ImportValidationContribution,
  state: InitializedImportWorkerState,
): ProjectStateImportIndexContribution {
  const identity = importFileIdentity(
    state,
    prepared.targetProjectPath,
    prepared.assignment.role === "fileItem" ? "form" : "properties",
  )
  const validation = contribution.validationContribution
  return {
    ...identity,
    references: [
      ...validation.objectIndexEntries.map((entry) => projectStateReferenceEntry("object", entry)),
      ...validation.memberIndexEntries.map((entry) => projectStateReferenceEntry("member", entry)),
      ...validation.valueIndexEntries.map((entry) => projectStateReferenceEntry("value", entry)),
    ],
    owners: validation.objectRecords.flatMap(projectStateOwnerFacts),
    fields: validation.objectRecords.flatMap(projectStateFieldEntries),
    forms: [],
  }
}

function importFileIdentity(
  state: InitializedImportWorkerState,
  targetProjectPath: string,
  kind: "configuration" | "form" | "properties",
): {
  readonly projectPath: string
  readonly componentPath: string
  readonly resourceKind: "yaml"
  readonly yamlRole: "configuration" | "properties" | "form"
} {
  return {
    projectPath: `${state.componentPath}/${targetProjectPath}`,
    componentPath: state.componentPath,
    resourceKind: "yaml",
    yamlRole: targetProjectPath === "Конфигурация.yaml" ? "configuration" : kind,
  }
}

function hashGeneratedContent(content: string): bigint {
  return hashFileBytes(new TextEncoder().encode(content))
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
  endSecondPass()
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

export function setImportWorkerSchemaCacheForTests(schemaCache: ValidationSchemaCache | undefined): void {
  schemaCacheForTests = schemaCache
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
