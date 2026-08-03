import { move, transferableSymbol, valueSymbol } from "piscina"
import { hashFileBytes } from "../configurationIndex/hash"
import { createConfigurationIndexCollector } from "../configurationIndex/collector/writer"
import type { ConfigurationContext, XmlImportConfigurationContext } from "../context/types"
import type { ConfigurationSnapshotFragment } from "../configurationIndex/types"
import { withExportMetadataTargetOwners } from "../orchestration/appliedObject/metadataItemOwnerContext"
import { finalizeImportedYamlValues } from "../orchestration/property/finalizeImportedYAML"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import { createOperationProfiler, type ValidationProfiler } from "../validation/profile"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { validationProjectComponentFromAddress } from "../validation/projectComponents"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import {
  createValidationSchemaCache,
  type ValidationSchemaCache,
} from "../validation/projectValidationPasses"
import { validateKnownProjectYaml } from "../validation/knownYamlValidation"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"
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
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import {
  extractImportValidationContribution,
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
  rulesSnapshot: ValidationRulesSnapshot
}

interface DeferredImportYaml {
  diagnosticAssignment: Pick<ImportAssignment, "targetProjectPath" | "xmlFiles">
  targetProjectPath: string
  yaml: unknown
  rule: PreparedImportYaml["rule"]
  ownerContext: PreparedImportYaml["ownerContext"]
  formDataPathIndex: PreparedImportYaml["localIndexes"]["metadata"]["formDataPathIndex"]
  deferred: PreparedImportYaml["deferred"]
  indexContribution: ProjectStateImportIndexContribution
}

interface ActiveSecondPass {
  readonly readSession: ReturnType<typeof openProjectStateReadSession>
  readonly ownerMetadataCache: OwnerMetadataCache
}

let initializedState: InitializedImportWorkerState | undefined
let schemaCacheForTests: ValidationSchemaCache | undefined
const preparedYaml = new Map<string, DeferredImportYaml>()
const assignedImportIds = new Set<string>()
let activeSecondPass: ActiveSecondPass | undefined
let firstPassAccumulator: FirstPassAccumulator | undefined
let secondPassAccumulator: SecondPassAccumulator | undefined

interface FirstPassAccumulator {
  readonly diagnostics: ImportDiagnostic[]
  readonly files: ImportResultFile[]
  readonly configurationFragments: ConfigurationSnapshotFragment[]
  readonly fragmentWriter: ReturnType<typeof createProjectStateFragmentWriter>
  readonly profiler: ValidationProfiler
  stateEntries: number
}

interface SecondPassAccumulator {
  readonly diagnostics: ImportDiagnostic[]
  readonly warnings: ImportDiagnostic[]
  readonly files: ImportResultFile[]
  readonly fragmentWriter: ReturnType<typeof createProjectStateFragmentWriter>
  readonly profiler: ValidationProfiler
  stateEntries: number
}

export async function runImportWorkerCommand(
  command: ImportWorkerCommand,
  options: {
    persistentValidationState?: {
      schemaCache: ValidationSchemaCache
      rulesSnapshot: ValidationRulesSnapshot
    }
  } = {},
): Promise<ImportWorkerCommandResult> {
  if (command.kind === "initialize") {
    endSecondPass()
    preparedYaml.clear()
    assignedImportIds.clear()
    firstPassAccumulator?.fragmentWriter.discard()
    initializedState = {
      operationId: command.operationId,
      workerIndex: command.workerIndex,
      context: command.context,
      outputDir: command.outputDir,
      projectDir: command.projectDir ?? command.outputDir,
      componentPath: command.componentPath ?? "cf",
      schemaCache: options.persistentValidationState?.schemaCache
        ?? schemaCacheForTests
        ?? createValidationSchemaCache(command.context),
      rulesSnapshot: options.persistentValidationState?.rulesSnapshot
        ?? createValidationRulesSnapshot(command.context),
    }
    firstPassAccumulator = createFirstPassAccumulator(command.workerIndex)
    return undefined
  }

  if (command.kind === "dispose") {
    disposeWorkerState()
    return undefined
  }

  if (command.kind === "firstPassBatch") {
    await processFirstPass(command.assignments, requireInitializedState(), requireFirstPassAccumulator())
    return undefined
  }

  if (command.kind === "finishFirstPass") {
    const result = finishFirstPass(requireFirstPassAccumulator())
    firstPassAccumulator = undefined
    return result
  }

  if (command.kind === "beginSecondPass") {
    beginSecondPass(command.readToken, requireInitializedState())
    secondPassAccumulator?.fragmentWriter.discard()
    secondPassAccumulator = createSecondPassAccumulator(requireInitializedState().workerIndex)
    return undefined
  }

  if (command.kind === "secondPassBatch") {
    const state = requireInitializedState()
    const accumulator = requireSecondPassAccumulator()
    for (const assignmentId of command.assignmentIds) {
      await processSecondPass(assignmentId, state, accumulator)
    }
    return undefined
  }

  if (command.kind === "finishSecondPass") {
    const result = finishSecondPass(requireSecondPassAccumulator())
    secondPassAccumulator = undefined
    endSecondPass()
    return result
  }

  if (command.kind === "endSecondPass") {
    secondPassAccumulator?.fragmentWriter.discard()
    secondPassAccumulator = undefined
    endSecondPass()
    return undefined
  }

  if (command.kind === "secondPass") {
    const accumulator = createSecondPassAccumulator(requireInitializedState().workerIndex)
    await processSecondPass(command.assignmentId, requireInitializedState(), accumulator)
    return finishSecondPass(accumulator)
  }

  const accumulator = createFirstPassAccumulator(requireInitializedState().workerIndex)
  await processFirstPass(command.assignments, requireInitializedState(), accumulator)
  return finishFirstPass(accumulator)
}

async function processSecondPass(
  assignmentId: string,
  state: InitializedImportWorkerState,
  accumulator: SecondPassAccumulator,
): Promise<void> {
  if (!assignedImportIds.has(assignmentId)) {
    throw new Error(`Задание ${assignmentId} не принадлежит этой линии import`)
  }
  const profiler = accumulator.profiler
  const secondPass = activeSecondPass
  if (secondPass === undefined) throw new Error("Второй проход XML-import worker не начат")
  const prepared = preparedYaml.get(assignmentId)
  if (prepared !== undefined) {
    try {
      const written = await writePreparedYamlToOutput(
        prepared,
        secondPass.ownerMetadataCache,
        state,
        accumulator.warnings,
        profiler,
      )
      accumulator.files.push(written.file)
      accumulator.fragmentWriter.appendImportIndex(prepared.indexContribution)
      accumulator.fragmentWriter.appendImportFinal(written.finalState)
      accumulator.stateEntries += 2
    } catch (caught) {
      accumulator.diagnostics.push(
        importAssignmentDiagnostic(prepared.diagnosticAssignment, caught, "xml_import_yaml_failed"),
      )
    } finally {
      preparedYaml.delete(assignmentId)
    }
  }

  profiler.record("Подготовка импорта конфигурации", "Формирование worker списка файлов результата импорта", {
    items: prepared === undefined ? 0 : 1,
    timeMs: 0,
  })
}

function createSecondPassAccumulator(workerIndex: number): SecondPassAccumulator {
  return {
    diagnostics: [],
    warnings: [],
    files: [],
    fragmentWriter: createProjectStateFragmentWriter(),
    profiler: createImportWorkerProfiler(workerIndex),
    stateEntries: 0,
  }
}

function finishSecondPass(accumulator: SecondPassAccumulator): ImportSecondPassResult {
  accumulator.profiler.flush()
  return {
    kind: "secondPassResult",
    diagnostics: accumulator.diagnostics,
    warnings: accumulator.warnings,
    files: accumulator.files,
    ...(accumulator.stateEntries === 0
      ? (accumulator.fragmentWriter.discard(), {})
      : { stateFragment: accumulator.fragmentWriter.finish() }),
  }
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

async function processFirstPass(
  assignments: readonly ImportAssignment[],
  state: InitializedImportWorkerState,
  accumulator: FirstPassAccumulator,
): Promise<void> {
  const profiler = accumulator.profiler
  let earlyYamlCount = 0
  let earlyYamlBytes = 0
  let retainedYamlCount = 0
  let deferredValueCount = 0
  for (const assignment of assignments) {
    assignedImportIds.add(assignment.id)
    const collector = createConfigurationIndexCollector()
    try {
      const prepared = await prepareImportYaml({
        assignment,
        context: state.context,
        collector,
        profiler,
      })
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
          accumulator.fragmentWriter.appendImportFinal({
            updates: generatedStateEntries.map(({ update }) => update),
            hashBytes: batch.hashBytes,
          })
          accumulator.stateEntries += generatedStateEntries.length
        }
        assignmentFiles.push(...xmlExternalImportFiles(assignment))
        if (prepared.deferred.length === 0) {
          const serialized = serializePreparedYaml(prepared.targetProjectPath, prepared.yaml, state, profiler)
          const main = await writeMainImportYaml({ serialized, profiler })
          const validated = validateSerializedImportYaml(prepared, serialized, state)
          assignmentFiles.push(main.file)
          const indexContribution = importIndexContribution(prepared, validationContribution, state)
          accumulator.fragmentWriter.appendImportIndex(indexContribution)
          accumulator.fragmentWriter.appendImportFinal(validated.final)
          accumulator.stateEntries += 2
          earlyYamlCount += 1
          earlyYamlBytes += main.bytes
        } else {
          const indexContribution = importIndexContribution(prepared, validationContribution, state)
          accumulator.fragmentWriter.appendImportIndex(indexContribution)
          accumulator.stateEntries += 1
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
            indexContribution,
          })
          retainedYamlCount += 1
          deferredValueCount += prepared.deferred.length
        }
        accumulator.files.push(...assignmentFiles)
      } catch (caught) {
        preparedYaml.delete(assignment.id)
        accumulator.diagnostics.push(importAssignmentDiagnostic(assignment, caught, "xml_import_yaml_failed"))
        continue
      }
      accumulator.configurationFragments.push(fragment)
    } catch (caught) {
      preparedYaml.delete(assignment.id)
      accumulator.diagnostics.push(importAssignmentDiagnostic(assignment, caught))
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
}

function createFirstPassAccumulator(workerIndex: number): FirstPassAccumulator {
  return {
    diagnostics: [],
    files: [],
    configurationFragments: [],
    fragmentWriter: createProjectStateFragmentWriter(),
    profiler: createImportWorkerProfiler(workerIndex),
    stateEntries: 0,
  }
}

function requireFirstPassAccumulator(): FirstPassAccumulator {
  if (firstPassAccumulator === undefined) throw new Error("Первый проход XML-import worker не инициализирован")
  return firstPassAccumulator
}

function requireSecondPassAccumulator(): SecondPassAccumulator {
  if (secondPassAccumulator === undefined) throw new Error("Второй проход XML-import worker не инициализирован")
  return secondPassAccumulator
}

function finishFirstPass(accumulator: FirstPassAccumulator): ImportFirstPassResult {
  accumulator.profiler.flush()
  return {
    kind: "firstPassResult",
    diagnostics: accumulator.diagnostics,
    files: accumulator.files,
    configurationFragments: accumulator.configurationFragments,
    ...(accumulator.stateEntries === 0
      ? (accumulator.fragmentWriter.discard(), {})
      : { stateFragment: accumulator.fragmentWriter.finish() }),
  }
}

function createImportWorkerProfiler(workerIndex: number): ValidationProfiler {
  return createOperationProfiler({
    operation: "import-from-xml",
    scope: { scope: "worker", workerIndex },
    aggregate: true,
  })
}

export function createFirstPassTransferable(result: ImportFirstPassResult) {
  return {
    get [transferableSymbol]() {
      return [
        ...Object.values(result.stateFragment?.buffers ?? {}),
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
      return Object.values(result.stateFragment?.buffers ?? {})
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
  const first = validateKnownProjectYaml({
    projectDir: state.projectDir,
    file,
    text: serialized.text,
    yaml: prepared.yaml,
    context: state.context,
    schemaCache: state.schemaCache,
    rulesSnapshot: state.rulesSnapshot,
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
  firstPassAccumulator?.fragmentWriter.discard()
  firstPassAccumulator = undefined
  secondPassAccumulator?.fragmentWriter.discard()
  secondPassAccumulator = undefined
  preparedYaml.clear()
  assignedImportIds.clear()
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
