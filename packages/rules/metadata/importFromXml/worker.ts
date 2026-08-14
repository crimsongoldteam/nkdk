import { move, transferableSymbol, valueSymbol } from "piscina"
import { join, posix } from "node:path"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import { hashFileBytes } from "@nkdk/runtime"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import type { ConfigurationContext, XmlImportConfigurationContext } from "@nkdk/runtime"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import { withExportMetadataTargetOwners } from "../ruleRuntime/appliedObject/metadataItemOwnerContext"
import { finalizeImportedYamlValues } from "../ruleRuntime/property/finalizeImportedYAML"
import {
  finalizeMetadataItemImportedYaml,
  supportsMetadataItemImportedYamlFinalization,
} from "../ruleRuntime/metadataItem/importedYamlFinalizerRegistry"
import type { OwnerMetadataCache } from "../validation/dataPath/ownerCache"
import { createOperationProfiler, type ValidationProfiler } from "../validation/profile"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { validationProjectComponentFromAddress } from "../validation/projectComponents"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import {
  createValidationSchemaCache,
  type ValidationSchemaCache,
} from "../validation/projectValidationPasses"
import { validateSerializedProjectYaml } from "./serializedYamlValidation"
import type { ValidationRulesSnapshot } from "../validation/rulesSnapshot"
import {
  createProjectStateFileUpdateBatch,
  projectStateFieldEntries,
  projectStateOwnerFacts,
  projectStateTargetEntry,
  type ProjectStateYamlFileUpdate,
} from "../projectState/fileUpdate"
import { createProjectStateOwnerMetadataCache } from "../validation/projectStateDependencyValidation"
import { openProjectStateReadSession } from "../composition/projectState"
import { resolveProjectPath } from "../projectDefinition/path"
import { classifyMetadataProjectPath, projectStateFileBackedTargets } from "../projectDefinition/resources"
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
import { createImportBinaryResult } from "./binaryResult"
import type { MetadataWorkerOperationRegistry } from "../workerPool/operationRegistry"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { projectClientApplicationBaseForm } from "../forms/clientApplicationForm/baseFormProjection"
import { equalBaseFormYaml } from "../forms/clientApplicationForm/baseFormYaml"
import type { ClientApplicationFormYAML } from "../forms/clientApplicationForm/types"
import { normalizeImportedDependentItems } from "./dependentItems"
import { collectFormDataPathOccurrencesFromYAML } from "../validation/dataPath/formYamlTraversal"
import { finalizeImportedFormDataPathCompatibility } from "../forms/clientApplicationForm/importDataPathCompatibility"
import { buildProjectStateYamlFileUpdate } from "../project/projectStateYamlUpdate"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import { importedClientApplicationForm } from "../forms/clientApplicationForm/formDataPathMetadata"
import { getProjectReferenceValueContributor } from "../validation/projectReferenceIndexRegistry"
import { resolveImportedMetadataTargetStatus } from "./metadataTargetLookup"

declare module "../workerPool/types" {
  interface MetadataWorkerOperationTypeMap {
    import: {
      command: { readonly kind: "import"; readonly command: ImportWorkerCommand }
      result: { readonly kind: "importResult"; readonly result: ImportWorkerCommandResult }
    }
  }
}

export function registerImportWorkerOperation(
  registry: MetadataWorkerOperationRegistry,
): void {
  const runner = createImportWorkerCommandRunner()
  registry.register(
    "import",
    async (operation, state) => ({
      kind: "importResult",
      result: await runner.run(operation.command, {
        persistentValidationState: { schemaCache: state.schemaCache, rulesSnapshot: state.rulesSnapshot },
      }),
    }),
    async () => { await runner.run({ kind: "dispose" }) },
  )
}

interface InitializedImportWorkerState {
  operationId: string
  workerIndex: number
  context: XmlImportConfigurationContext
  outputDir: string
  projectDir: string
  componentPath: string
  topology: CompiledMetadataResourceTopology
  schemaCache: ValidationSchemaCache
  rulesSnapshot: ValidationRulesSnapshot
}

interface DeferredImportYaml {
  diagnosticAssignment: Pick<ImportAssignment, "targetProjectPath" | "xmlFiles">
  targetProjectPath: string
  logicalAddress: string
  yaml: unknown
  rule: PreparedImportYaml["rule"]
  ownerContext: PreparedImportYaml["ownerContext"]
  formDataPathIndex: PreparedImportYaml["localIndexes"]["metadata"]["formDataPathIndex"]
  deferred: PreparedImportYaml["deferred"]
  dependentDeferred: PreparedImportYaml["dependentDeferred"]
  dependentOwner: PreparedImportYaml["dependentOwner"]
  indexContribution: ProjectStateImportIndexContribution
  baseFormCandidate?: NonNullable<PreparedImportYaml["baseFormCandidate"]>
}

interface ActiveSecondPass {
  readonly readSession: ReturnType<typeof openProjectStateReadSession>
  readonly ownerMetadataCache: OwnerMetadataCache
}

export interface ImportWorkerCommandRunner {
  readonly run: (
    command: ImportWorkerCommand,
    options?: {
      persistentValidationState?: {
        schemaCache: ValidationSchemaCache
        rulesSnapshot: ValidationRulesSnapshot
      }
    },
  ) => Promise<ImportWorkerCommandResult>
  readonly entryPoint: (command: ImportWorkerCommand) => Promise<ImportWorkerCommandResult>
  readonly stateForTests: () => {
    initialized: boolean
    operationId?: string
    workerIndex?: number
    outputDir?: string
    preparedYamlIds: string[]
  }
  readonly resetForTests: () => void
  readonly setSchemaCacheForTests: (schemaCache: ValidationSchemaCache | undefined) => void
}

export function createImportWorkerCommandRunner(): ImportWorkerCommandRunner {
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
  readonly configurationFragments: ConfigurationIndexBlockFragment[]
  readonly fragmentWriter: ReturnType<typeof createProjectStateFragmentWriter>
  readonly profiler: ValidationProfiler
  stateEntries: number
}

interface SecondPassAccumulator {
  readonly diagnostics: ImportDiagnostic[]
  readonly warnings: ImportDiagnostic[]
  readonly files: ImportResultFile[]
  readonly configurationFragments: ConfigurationIndexBlockFragment[]
  readonly fragmentWriter: ReturnType<typeof createProjectStateFragmentWriter>
  readonly profiler: ValidationProfiler
  stateEntries: number
}

async function runImportWorkerCommand(
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
    const projectDir = command.projectDir ?? command.outputDir
    const componentPath = command.componentPath ?? "cf"
    const validationComponent = validationProjectComponentFromAddress(projectDir, {
      componentPath,
      componentDir: command.outputDir,
    })
    initializedState = {
      operationId: command.operationId,
      workerIndex: command.workerIndex,
      context: command.context,
      outputDir: command.outputDir,
      projectDir,
      componentPath,
      topology: validationComponent.topology,
      schemaCache: options.persistentValidationState?.schemaCache
        ?? schemaCacheForTests
        ?? createValidationSchemaCache(command.context),
      rulesSnapshot: options.persistentValidationState?.rulesSnapshot
        ?? createValidationRulesSnapshot(command.context, validationComponent.topology),
    }
    firstPassAccumulator = createFirstPassAccumulator(command.workerIndex)
    return undefined
  }

  if (command.kind === "dispose") {
    disposeWorkerState()
    return undefined
  }

  if (command.kind === "firstPassBatch") {
    const accumulator = requireFirstPassAccumulator()
    const startedAt = performance.now()
    await processFirstPass(command.assignments, requireInitializedState(), accumulator)
    const result = accumulator.profiler.measure(
      "Подготовка импорта конфигурации",
      "Упаковка состояния пачки первого прохода",
      { items: command.assignments.length },
      () => finishFirstPass(accumulator, false),
    )
    firstPassAccumulator = createFirstPassAccumulator(requireInitializedState().workerIndex, accumulator.profiler)
    const encoded = encodeImportBinaryResult(accumulator.profiler, {
      diagnostics: result.diagnostics,
      files: result.files,
      configurationFragments: result.configurationFragments,
      ...(result.stateFragment === undefined ? {} : { stateFragment: result.stateFragment }),
    })
    accumulator.profiler.record(
      "Подготовка импорта конфигурации",
      "Полная обработка пачки первого прохода",
      { items: command.assignments.length, timeMs: performance.now() - startedAt },
    )
    return encoded
  }

  if (command.kind === "finishFirstPass") {
    const accumulator = requireFirstPassAccumulator()
    accumulator.fragmentWriter.discard()
    accumulator.profiler.flush()
    firstPassAccumulator = undefined
    return undefined
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
    const result = finishSecondPass(accumulator, false)
    secondPassAccumulator = createSecondPassAccumulator(state.workerIndex, accumulator.profiler)
    return encodeImportBinaryResult(accumulator.profiler, {
      diagnostics: result.diagnostics,
      warnings: result.warnings,
      files: result.files,
      configurationFragments: result.configurationFragments,
      ...(result.stateFragment === undefined ? {} : { stateFragment: result.stateFragment }),
    })
  }

  if (command.kind === "finishSecondPass") {
    const accumulator = requireSecondPassAccumulator()
    accumulator.fragmentWriter.discard()
    accumulator.profiler.flush()
    secondPassAccumulator = undefined
    endSecondPass()
    if (preparedYaml.size > 0) {
      throw new Error(`Второй проход XML-import не обработал ${preparedYaml.size} отложенных YAML`)
    }
    return undefined
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
        secondPass.readSession,
        state,
        accumulator.warnings,
        profiler,
      )
      accumulator.files.push(...written.files)
      for (const index of written.indexContributions) accumulator.fragmentWriter.appendImportIndex(index)
      for (const final of written.finalStates) accumulator.fragmentWriter.appendImportFinal(final)
      accumulator.configurationFragments.push(...written.configurationFragments)
      accumulator.stateEntries += written.indexContributions.length + written.finalStates.length
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

function createSecondPassAccumulator(workerIndex: number, profiler = createImportWorkerProfiler(workerIndex)): SecondPassAccumulator {
  return {
    diagnostics: [],
    warnings: [],
    files: [],
    configurationFragments: [],
    fragmentWriter: createProjectStateFragmentWriter(),
    profiler,
    stateEntries: 0,
  }
}

function finishSecondPass(accumulator: SecondPassAccumulator, flushProfile = true): ImportSecondPassResult {
  return {
    kind: "secondPassResult",
    warnings: accumulator.warnings,
    ...finishImportPass(accumulator, flushProfile),
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
  readSession: ActiveSecondPass["readSession"],
  state: InitializedImportWorkerState,
  warnings: ImportDiagnostic[],
  profiler: ValidationProfiler
): Promise<{
  files: ImportResultFile[]
  indexContributions: ProjectStateImportIndexContribution[]
  finalStates: ProjectStateImportFinalFileStateBatch[]
  configurationFragments: ConfigurationIndexBlockFragment[]
}> {
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
  const originalFormDataPaths = collectImportedFormDataPaths(prepared.yaml, prepared.rule)
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
  finalizeImportedFormDataPaths({
    yaml: prepared.yaml,
    rule: prepared.rule,
    originalOccurrences: originalFormDataPaths,
    formDataPathIndex: prepared.formDataPathIndex,
    ownerMetadataCache,
  })
  const currentConfigurationYAML = state.componentPath.startsWith("cfe/") &&
    supportsMetadataItemImportedYamlFinalization(prepared.rule)
    ? await readCurrentConfigurationFormYaml({
        logicalAddress: prepared.logicalAddress,
        rule: prepared.rule,
        owner: prepared.dependentOwner,
        state,
      })
    : undefined
  const preparedBaseFormCandidate = prepared.baseFormCandidate === undefined
    ? undefined
    : prepareBaseFormCandidate({
        candidate: prepared.baseFormCandidate,
        extensionYaml: prepared.yaml,
        currentConfigurationYAML,
        contextWithOwners: withoutDataPathDiagnosticSink(contextWithOwners),
        ownerMetadataCache,
      })
  profiler.measure(
    "Подготовка импорта конфигурации",
    "Уточнение отложенных зависимых значений YAML",
    { items: prepared.dependentDeferred.length },
    () => normalizeImportedDependentItems({
      yaml: prepared.yaml,
      rule: prepared.rule,
      candidates: prepared.dependentDeferred,
      owner: prepared.dependentOwner,
      definedTypeLookup: (name) => {
        const result = ownerMetadataCache.get({ kind: "ОпределяемыйТип", name })
        if (result.status === "ok") return { status: "ok", type: result.owner.facts.type }
        const reason = result.diagnostics.map(({ message }) => message).join("; ")
        return { status: "unresolved", reason: reason || `не найден определяемый тип ${name}` }
      },
      metadataTargetLookup: (canonical) => resolveImportedMetadataTargetStatus({
        canonical,
        componentPath: state.componentPath,
        projectDir: state.projectDir,
        queryPort: readSession,
        getContributor: getProjectReferenceValueContributor,
      }),
      preserveRawXML: false,
    })
  )
  profiler.measure(
    "Подготовка импорта конфигурации",
    "Уточнение импортированного metadata-item",
    { items: 1 },
    () => finalizeMetadataItemImportedYaml({
      yaml: prepared.yaml,
      rule: prepared.rule,
      ownerMetadataCache,
      ...(currentConfigurationYAML === undefined ? {} : { currentConfigurationYAML }),
      ...(preparedBaseFormCandidate === undefined
        ? {}
        : { savedBaseYAML: preparedBaseFormCandidate.yaml }),
    })
  )
  const serialized = serializePreparedYaml(prepared.targetProjectPath, prepared.yaml, state, profiler)
  const validated = measureSerializedImportYamlValidation(prepared, serialized, state, profiler)
  const main = await writeMainImportYaml({ serialized, profiler })
  const baseForm = preparedBaseFormCandidate === undefined
    ? undefined
    : await writePreparedBaseFormCandidate({
        candidate: preparedBaseFormCandidate,
        state,
        profiler,
      })
  const baseFormConfigurationFragment = prepared.baseFormCandidate === undefined
    ? undefined
    : preparedBaseFormCandidate === undefined
      ? retargetConfigurationFragment(
          prepared.baseFormCandidate.configurationFragment,
          prepared.targetProjectPath,
        )
      : prepared.baseFormCandidate.configurationFragment
  return {
    files: [main.file, ...(baseForm === undefined ? [] : [baseForm.file])],
    indexContributions: [validated.index, ...(baseForm === undefined ? [] : [baseForm.indexContribution])],
    finalStates: [validated.final, ...(baseForm === undefined ? [] : [baseForm.finalState])],
    configurationFragments:
      baseFormConfigurationFragment === undefined ? [] : [baseFormConfigurationFragment],
  }
}

function retargetConfigurationFragment(
  fragment: ConfigurationIndexBlockFragment,
  targetProjectPath: string,
): ConfigurationIndexBlockFragment {
  return {
    ...fragment,
    targetProjectPath,
  }
}

function prepareBaseFormCandidate(params: {
  candidate: NonNullable<DeferredImportYaml["baseFormCandidate"]>
  extensionYaml: unknown
  currentConfigurationYAML: unknown
  contextWithOwners: ConfigurationContext
  ownerMetadataCache: OwnerMetadataCache
}): NonNullable<DeferredImportYaml["baseFormCandidate"]> | undefined {
  if (params.currentConfigurationYAML === undefined) {
    throw new Error(`Не найдена текущая форма cf для ${params.candidate.baseProjectPath}`)
  }
  const originalFormDataPaths = collectImportedFormDataPaths(params.candidate.yaml, params.candidate.rule)
  finalizeImportedYamlValues({
    yaml: params.candidate.yaml,
    rootRule: params.candidate.rule,
    deferred: params.candidate.deferred,
    context: params.contextWithOwners,
    formDataPathIndex: params.candidate.localIndexes.metadata.formDataPathIndex,
  })
  finalizeImportedFormDataPaths({
    yaml: params.candidate.yaml,
    rule: params.candidate.rule,
    originalOccurrences: originalFormDataPaths,
    formDataPathIndex: params.candidate.localIndexes.metadata.formDataPathIndex,
    ownerMetadataCache: params.ownerMetadataCache,
  })
  const projection = projectClientApplicationBaseForm({
    baseYaml: clientApplicationFormYaml(params.currentConfigurationYAML, params.candidate.baseProjectPath),
    extensionYaml: clientApplicationFormYaml(params.extensionYaml, params.candidate.targetProjectPath),
    rule: params.candidate.rule,
  })
  return equalBaseFormYaml(params.candidate.yaml, projection.yaml) ? undefined : params.candidate
}

async function writePreparedBaseFormCandidate(params: {
  candidate: NonNullable<DeferredImportYaml["baseFormCandidate"]>
  state: InitializedImportWorkerState
  profiler: ValidationProfiler
}): Promise<{
  file: ImportResultFile
  indexContribution: ProjectStateImportIndexContribution
  finalState: ProjectStateImportFinalFileStateBatch
  configurationFragment: ConfigurationIndexBlockFragment
} | undefined> {
  const serialized = serializePreparedYaml(
    params.candidate.targetProjectPath,
    params.candidate.yaml,
    params.state,
    params.profiler,
  )
  const validated = measureSerializedImportYamlValidation(
    { targetProjectPath: params.candidate.targetProjectPath },
    serialized,
    params.state,
    params.profiler,
    "isolated",
  )
  const written = await writeMainImportYaml({ serialized, profiler: params.profiler })
  return {
    file: written.file,
    indexContribution: validated.index,
    finalState: validated.final,
    configurationFragment: params.candidate.configurationFragment,
  }
}

function collectImportedFormDataPaths(yaml: unknown, rule: PreparedImportYaml["rule"]) {
  const form = importedClientApplicationForm({ yaml, rule })
  return form === undefined
    ? []
    : collectFormDataPathOccurrencesFromYAML(form)
}

function finalizeImportedFormDataPaths(params: {
  yaml: unknown
  rule: PreparedImportYaml["rule"]
  originalOccurrences: ReturnType<typeof collectImportedFormDataPaths>
  formDataPathIndex: DeferredImportYaml["formDataPathIndex"]
  ownerMetadataCache: OwnerMetadataCache
}): void {
  const form = importedClientApplicationForm({ yaml: params.yaml, rule: params.rule })
  if (form === undefined || params.formDataPathIndex === undefined || params.originalOccurrences.length === 0) return
  finalizeImportedFormDataPathCompatibility({
    yaml: form.yaml,
    originalOccurrences: params.originalOccurrences,
    index: params.formDataPathIndex,
    ownerCache: params.ownerMetadataCache,
  })
}

function withoutDataPathDiagnosticSink(context: ConfigurationContext): ConfigurationContext {
  if (context.exportToYAML === undefined) return context
  const { dataPathDiagnosticSink: _sink, ...exportToYAML } = context.exportToYAML
  return { ...context, exportToYAML }
}

function clientApplicationFormYaml(value: unknown, projectPath: string): ClientApplicationFormYAML {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`YAML формы не является объектом: ${projectPath}`)
  }
  return value as ClientApplicationFormYAML
}

async function readCurrentConfigurationFormYaml(params: {
  logicalAddress: string
  rule: PreparedImportYaml["rule"]
  owner: DeferredImportYaml["dependentOwner"]
  state: InitializedImportWorkerState
}): Promise<unknown | undefined> {
  const readSession = activeSecondPass?.readSession
  if (readSession === undefined) throw new Error("Не начат второй проход XML-import worker")
  const projectPaths = new Set(
    readSession.readStructuredDocumentEntries({
      componentPath: "cf",
      logicalAddress: params.logicalAddress,
    })
      .filter(({ representation, componentKind }) =>
        representation === "working" && componentKind === "document"
      )
      .map(({ workingProjectPath }) => workingProjectPath)
  )
  if (projectPaths.size === 0) return undefined
  if (projectPaths.size > 1) {
    throw new Error(`Для текущей формы cf найдено несколько YAML: ${[...projectPaths].join(", ")}`)
  }
  const projectPath = [...projectPaths][0]
  if (projectPath === undefined) return undefined
  const filePath = join(params.state.projectDir, "cf", ...projectPath.split("/"))
  const prepared = prepareYamlFiles({
    files: [{
      projectPath,
      filePath,
      role: "form",
      owner: params.owner,
      itemType: params.rule.itemType,
    }],
    itemTypeByYamlDir: {},
  })
  const yaml = prepared.yamlFiles[0]
  if (prepared.diagnostics.length > 0 || yaml === undefined || yaml.syntaxDiagnostics.length > 0) {
    throw new Error(`Не удалось подготовить текущую форму cf: ${projectPath}`)
  }
  return yaml.data
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

async function importWorkerEntryPoint(command: ImportWorkerCommand): Promise<ImportWorkerCommandResult> {
  const result = await runImportWorkerCommand(command)
  return result?.kind === "binaryResult"
    ? createMovableBinaryResult(result)
    : result?.kind === "firstPassResult"
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
        topology: state.topology,
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
        const externalFiles = xmlExternalImportFiles(assignment)
        const externalTargets = new Set(externalFiles.map((file) => file.targetProjectPath))
        const generatedFiles = prepared.generatedFiles.filter(
          (file) =>
            !externalTargets.has(posix.join(posix.dirname(prepared.targetProjectPath), file.relativePath))
        )
        const assignmentFiles = await writeGeneratedImportFiles({
          outputDir: state.outputDir,
          targetProjectPath: prepared.targetProjectPath,
          generatedFiles,
          profiler,
        })
        const generatedStateEntries = assignmentFiles.map((file, index) => ({
          update: {
            kind: "resource" as const,
            projectPath: `${state.componentPath}/${file.targetProjectPath}`,
            componentPath: state.componentPath,
            resourceKind: "resource" as const,
            targets: importFileBackedTargets(state, file.targetProjectPath),
          },
          hash: hashGeneratedContent(generatedFiles[index]?.content ?? ""),
        }))
        if (generatedStateEntries.length > 0) {
          const batch = createProjectStateFileUpdateBatch(generatedStateEntries)
          accumulator.fragmentWriter.appendImportFinal({
            updates: generatedStateEntries.map(({ update }) => update),
            hashBytes: batch.hashBytes,
          })
          accumulator.stateEntries += generatedStateEntries.length
        }
        assignmentFiles.push(...externalFiles)
        const indexContribution = importIndexContribution(prepared, validationContribution, state)
        accumulator.fragmentWriter.appendImportIndex(indexContribution)
        accumulator.stateEntries += 1
        preparedYaml.set(assignment.id, {
          diagnosticAssignment: {
            targetProjectPath: assignment.targetProjectPath,
            xmlFiles: assignment.xmlFiles,
          },
          targetProjectPath: prepared.targetProjectPath,
          logicalAddress: assignment.logicalAddress,
          yaml: prepared.yaml,
          rule: prepared.rule,
          ownerContext: prepared.ownerContext,
          formDataPathIndex: prepared.localIndexes.metadata.formDataPathIndex,
          deferred: prepared.deferred,
          dependentDeferred: prepared.dependentDeferred,
          dependentOwner: prepared.dependentOwner,
          indexContribution,
          ...(prepared.baseFormCandidate === undefined
            ? {}
            : { baseFormCandidate: prepared.baseFormCandidate }),
        })
        retainedYamlCount += 1
        deferredValueCount += prepared.deferred.length + prepared.dependentDeferred.length
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

  profiler.record("Подготовка импорта конфигурации", "YAML, ожидающие второго прохода", {
    items: retainedYamlCount,
    timeMs: 0,
  })
  profiler.record("Подготовка импорта конфигурации", "Отложенные значения YAML", {
    items: deferredValueCount,
    timeMs: 0,
  })
}

function createFirstPassAccumulator(workerIndex: number, profiler = createImportWorkerProfiler(workerIndex)): FirstPassAccumulator {
  return {
    diagnostics: [],
    files: [],
    configurationFragments: [],
    fragmentWriter: createProjectStateFragmentWriter(),
    profiler,
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

function finishFirstPass(accumulator: FirstPassAccumulator, flushProfile = true): ImportFirstPassResult {
  return {
    kind: "firstPassResult",
    ...finishImportPass(accumulator, flushProfile),
  }
}

function finishImportPass(
  accumulator: FirstPassAccumulator | SecondPassAccumulator,
  flushProfile: boolean,
) {
  if (flushProfile) accumulator.profiler.flush()
  return {
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

function encodeImportBinaryResult(
  profiler: ValidationProfiler,
  params: Parameters<typeof createImportBinaryResult>[0],
) {
  const startedAt = performance.now()
  const result = createImportBinaryResult(params)
  profiler.record("Подготовка импорта конфигурации", "Двоичное кодирование результата", {
    items: params.files.length,
    bytes: result.buffers.reduce((total, { buffer }) => total + buffer.byteLength, 0),
    timeMs: performance.now() - startedAt,
  })
  return result
}

function createFirstPassTransferable(result: ImportFirstPassResult) {
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

function createSecondPassTransferable(result: ImportSecondPassResult) {
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
        sourcePath: resolveProjectPath(state.outputDir, targetProjectPath),
        targetProjectPath,
      },
      yaml,
    }),
  )
}

function validateSerializedImportYaml(
  prepared: Pick<DeferredImportYaml, "targetProjectPath">,
  serialized: SerializedImportYaml,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
  indexContribution: "shared" | "isolated" = "shared",
): { index: ProjectStateImportIndexContribution; final: ProjectStateImportFinalFileStateBatch } {
  const component = validationProjectComponentFromAddress(state.projectDir, {
    componentPath: state.componentPath,
    componentDir: state.outputDir,
  })
  const file = resolveValidationProjectFile(state.projectDir, prepared.targetProjectPath, component)
  if (file === undefined) throw new Error(`Не удалось классифицировать YAML import: ${prepared.targetProjectPath}`)
  const first = profiler.measure(
    "Локальная валидация готового YAML",
    "Подготовка снимка и локальная проверка",
    { items: 1 },
    () => validateSerializedProjectYaml({
      projectDir: state.projectDir,
      file,
      document: serialized,
      context: state.context,
      schemaCache: state.schemaCache,
      rulesSnapshot: state.rulesSnapshot,
    }),
  )
  if (first.profile !== undefined) {
    profiler.record("Локальная валидация готового YAML", "Ядро локальной проверки", {
      items: 1,
      timeMs: first.profile.totalMs,
    })
    profiler.record("Ядро локальной проверки", "Проверка JSON Schema", {
      items: 1,
      timeMs: first.profile.schemaMs,
    })
    profiler.record("Ядро локальной проверки", "Дополнительные валидаторы", {
      items: 1,
      timeMs: first.profile.validatorsMs,
    })
    profiler.record("Ядро локальной проверки", "Проверка equal-name", {
      items: 1,
      timeMs: first.profile.equalNameMs,
    })
    profiler.record("Ядро локальной проверки", "Извлечение YAML-фактов", {
      items: 1,
      timeMs: first.profile.yamlFactsMs,
    })
    profiler.record("Ядро локальной проверки", "Построение индексов", {
      items: 1,
      timeMs: first.profile.fieldIndexMs
        + first.profile.objectIndexMs
        + first.profile.memberIndexMs
        + first.profile.valueIndexMs,
    })
    for (const [substep, value] of Object.entries(first.profile.localValueValidationProfile)) {
      profiler.record("Ядро локальной проверки", substep, value)
    }
  }
  const full = profiler.measure(
    "Локальная валидация готового YAML",
    "Преобразование результата в состояние проекта",
    { items: 1 },
    () => buildProjectStateYamlFileUpdate({
      projectDir: state.projectDir,
      descriptor: {
        componentPath: file.componentPath,
        componentDir: file.componentDir,
        rootProjectPath: file.rootProjectPath,
        projectPath: file.projectPath,
        role: file.kind,
        ...(indexContribution === "isolated" ? { indexContribution: "isolated" as const } : {}),
      },
      firstPass: first,
      fileBackedTargets: importFileBackedTargets(state, prepared.targetProjectPath),
    }),
  )
  return splitImportYamlUpdate(full, serialized.localHash)
}

function importFileBackedTargets(
  state: InitializedImportWorkerState,
  targetProjectPath: string,
) {
  const component = validationProjectComponentFromAddress(state.projectDir, {
    componentPath: state.componentPath,
    componentDir: state.outputDir,
  })
  const resource = classifyMetadataProjectPath(targetProjectPath, component)
  if (resource === undefined) return []
  return projectStateFileBackedTargets(state.componentPath, resource.fileBackedTargets)
}

function measureSerializedImportYamlValidation(
  prepared: Pick<DeferredImportYaml, "targetProjectPath">,
  serialized: SerializedImportYaml,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
  indexContribution: "shared" | "isolated" = "shared",
): { index: ProjectStateImportIndexContribution; final: ProjectStateImportFinalFileStateBatch } {
  return profiler.measure(
    "Подготовка импорта конфигурации",
    "Локальная валидация готового YAML",
    { items: 1 },
    () => validateSerializedImportYaml(prepared, serialized, state, profiler, indexContribution),
  )
}

function splitImportYamlUpdate(
  update: ProjectStateYamlFileUpdate,
  hash: bigint,
): { index: ProjectStateImportIndexContribution; final: ProjectStateImportFinalFileStateBatch } {
  if (update.resourceKind !== "yaml" || update.yamlRole === undefined) {
    throw new Error("Import validation вернула не YAML identity")
  }
  const identity = {
    projectPath: update.projectPath,
    componentPath: update.componentPath,
    resourceKind: "yaml" as const,
    yamlRole: update.yamlRole,
  }
  const {
    targets,
    owners,
    fields,
    forms,
    structuredDocuments,
    pendingReferences,
    pendingChecks,
    dependencies,
    localValidation,
  } = update
  const batch = createProjectStateFileUpdateBatch([{ update, hash }])
  return {
    index: {
      ...identity,
      targets,
      owners,
      fields,
      forms,
      ...(structuredDocuments === undefined ? {} : { structuredDocuments }),
    },
    final: {
      updates: [{ ...identity, kind: "yaml", localValidation, pendingReferences, pendingChecks, dependencies }],
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
    targets: [
      ...validation.objectIndexEntries.map((entry) => projectStateTargetEntry("object", entry)),
      ...validation.memberIndexEntries.map((entry) => projectStateTargetEntry("member", entry)),
      ...validation.valueIndexEntries.map((entry) => projectStateTargetEntry("value", entry)),
      ...validation.logicalAddresses
        .filter(({ logicalAddress }) => ![
          ...validation.objectIndexEntries,
          ...validation.memberIndexEntries,
          ...validation.valueIndexEntries,
        ].some(({ canonical }) => canonical === logicalAddress))
        .map(({ logicalAddress }) => ({ kind: "object" as const, canonical: logicalAddress })),
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

function workerStateForTests(): {
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

function resetImportWorkerStateForTests(): void {
  disposeWorkerState()
}

function setImportWorkerSchemaCacheForTests(schemaCache: ValidationSchemaCache | undefined): void {
  schemaCacheForTests = schemaCache
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

return {
  run: runImportWorkerCommand,
  entryPoint: importWorkerEntryPoint,
  stateForTests: workerStateForTests,
  resetForTests: resetImportWorkerStateForTests,
  setSchemaCacheForTests: setImportWorkerSchemaCacheForTests,
}
}

export function createImportFirstPassTransferable(result: ImportFirstPassResult) {
  return {
    get [transferableSymbol]() {
      return [...Object.values(result.stateFragment?.buffers ?? {})]
    },
    get [valueSymbol]() {
      return result
    },
  }
}
