import { move, transferableSymbol, valueSymbol } from "piscina"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { join, posix } from "node:path"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import {
  createLocalConfigurationIndexReader,
  hashFileBytes,
  rehydrateConfigurationContext,
  restoreXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
  type XmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { openConfigurationIndexStore } from "@nkdk/runtime/configuration-index-store"
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
import {
  createValidationProjectAssignmentFileProjector,
  resolveValidationProjectFile,
  type ValidationProjectFile,
} from "../validation/projectFiles"
import {
  validationProjectComponentFromAddress,
  type ValidationProjectComponent,
} from "../validation/projectComponents"
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
  ImportControlCompositionEntry,
  ImportDiagnostic,
  ImportFirstPassResult,
  ImportIssueDecision,
  ImportProjectIssueDecision,
  ImportResultFile,
  ImportSecondPassResult,
  ImportWorkerCommand,
  ImportWorkerCommandResult,
} from "./types"
import { importControlCompositionEntry } from "./types"
import { importControlComposition } from "./controlComposition"
import {
  serializeImportYaml,
  writeGeneratedImportFiles,
  writeMainImportYaml,
  xmlExternalImportFiles,
  type SerializedImportYaml,
  type WritableSerializedImportYaml,
} from "./writeOutput"
import { createImportBinaryResult } from "./binaryResult"
import type { PreparedImportBinaryRecord } from "./types"
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
import { executeImportControlExport } from "./controlExport"
import type { XmlAnomalyProofAudit } from "./anomalyProof"
import type { MetadataXmlPrepareComposition } from "../resourceTopology/adapters/capabilities"
import type { BaseFormSourceResult } from "../fullSyncToXml/baseFormSource"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { classifyImportedIssues } from "./classifyImportedIssues"
import { applyImportedIssueDecisions } from "./applyImportedIssueDecisions"
import type { ValidationIssue, ValidationIssueTarget } from "@nkdk/runtime"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { traverseMetadataRuleYaml } from "../validation/metadataRuleYamlTraversal"
import {
  createPreparedImportRecordSource,
  encodePreparedImportRecord,
  restorePreparedImportRecord,
} from "./preparedRecord"
import {
  openPreparedImportStore,
  type PreparedImportStore,
} from "../projectState/preparedImportStore"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"

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
  validationComponent: ValidationProjectComponent
  projectFileProjector: ReturnType<typeof createValidationProjectAssignmentFileProjector>
  schemaCache: ValidationSchemaCache
  rulesSnapshot: ValidationRulesSnapshot
  preparedStoreDescriptor?: import("../projectState/preparedImportStore").PreparedImportStoreDescriptor
  configurationIndexDescriptor?: import("@nkdk/runtime").ConfigurationIndexStoreDescriptor
  baseConfigurationIndexDescriptor?: import("@nkdk/runtime").ConfigurationIndexStoreDescriptor
}

interface DeferredImportYaml {
  diagnosticAssignment: Pick<ImportAssignment, "targetProjectPath" | "xmlFiles">
  assignment: ImportAssignment
  targetProjectPath: string
  logicalAddress: string
  yaml: unknown
  annotations: XmlAnomalyAnnotations
  proofAudit?: XmlAnomalyProofAudit
  rule: PreparedImportYaml["rule"]
  ownerContext: PreparedImportYaml["ownerContext"]
  formDataPathIndex: PreparedImportYaml["localIndexes"]["metadata"]["formDataPathIndex"]
  deferred: PreparedImportYaml["deferred"]
  dependentDeferred: PreparedImportYaml["dependentDeferred"]
  dependentOwner: PreparedImportYaml["dependentOwner"]
  validationFile: ValidationProjectFile
  configurationFragment?: ConfigurationIndexBlockFragment
  baseFormCandidate?: NonNullable<PreparedImportYaml["baseFormCandidate"]>
  output?: PreparedImportOutput
}

interface PreparedImportOutput {
  main: PreparedSerializedYaml
  base?: PreparedSerializedYaml
  configurationFragments: ConfigurationIndexBlockFragment[]
}

interface PreparedSerializedYaml {
  serialized: WritableSerializedImportYaml
  index: ProjectStateImportIndexContribution
  final: ProjectStateImportFinalFileStateBatch
}

interface ActiveSecondPass {
  readonly readSession: ReturnType<typeof openProjectStateReadSession>
  readonly ownerMetadataCache: OwnerMetadataCache
  readonly preparedStore?: PreparedImportStore
  readonly configurationStore?: ReturnType<typeof openConfigurationIndexStore>
  readonly baseConfigurationStore?: ReturnType<typeof openConfigurationIndexStore>
  readonly composition: MetadataXmlPrepareComposition
  readonly issueDecisionsByProjectPath: ReadonlyMap<string, readonly ImportIssueDecision[]>
  readonly exportProfile?: XmlComponentExportProfile
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
    retainedProofAuditIds: string[]
  }
  readonly resetForTests: () => void
  readonly setSchemaCacheForTests: (schemaCache: ValidationSchemaCache | undefined) => void
  readonly setControlExportForTests: (controlExport: typeof executeImportControlExport | undefined) => void
}

export function shouldReadCurrentConfigurationYaml(params: {
  readonly componentPath: string
  readonly rule: PreparedImportYaml["rule"]
  readonly hasBaseFormCandidate: boolean
}): boolean {
  return params.componentPath.startsWith("cfe/") && (
    params.hasBaseFormCandidate || supportsMetadataItemImportedYamlFinalization(params.rule)
  )
}

export function createImportWorkerCommandRunner(): ImportWorkerCommandRunner {
  let initializedState: InitializedImportWorkerState | undefined
  let schemaCacheForTests: ValidationSchemaCache | undefined
  let controlExportForTests: typeof executeImportControlExport | undefined
  const preparedYaml = new Map<string, DeferredImportYaml>()
  const assignedImportIds = new Set<string>()
  const assignedImports = new Map<string, ImportAssignment>()
  const legacyPreparedRecords = new Map<string, Uint8Array>()
  let activeSecondPass: ActiveSecondPass | undefined
  let firstPassAccumulator: FirstPassAccumulator | undefined
  let secondPassAccumulator: SecondPassAccumulator | undefined

interface FirstPassAccumulator {
  readonly diagnostics: ImportDiagnostic[]
  readonly files: ImportResultFile[]
  readonly configurationFragments: ConfigurationIndexBlockFragment[]
  readonly fragmentWriter: ReturnType<typeof createProjectStateFragmentWriter>
  readonly profiler: ValidationProfiler
  readonly preparedRecords: PreparedImportBinaryRecord[]
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
    await endSecondPass()
    preparedYaml.clear()
    assignedImportIds.clear()
    assignedImports.clear()
    legacyPreparedRecords.clear()
    firstPassAccumulator?.fragmentWriter.discard()
    const projectDir = command.projectDir ?? command.outputDir
    const componentPath = command.componentPath ?? "cf"
    const context = rehydrateConfigurationContext(command.context)
    const validationComponent = validationProjectComponentFromAddress(projectDir, {
      componentPath,
      componentDir: command.outputDir,
    })
    initializedState = {
      operationId: command.operationId,
      workerIndex: command.workerIndex,
      context,
      outputDir: command.outputDir,
      projectDir,
      componentPath,
      topology: validationComponent.topology,
      validationComponent,
      projectFileProjector: createValidationProjectAssignmentFileProjector(projectDir, validationComponent),
      schemaCache: options.persistentValidationState?.schemaCache
        ?? schemaCacheForTests
        ?? createValidationSchemaCache(context),
      rulesSnapshot: options.persistentValidationState?.rulesSnapshot
        ?? createValidationRulesSnapshot(context, validationComponent.topology),
      ...(command.preparedStore === undefined ? {} : { preparedStoreDescriptor: command.preparedStore }),
      ...(command.configurationIndex === undefined ? {} : { configurationIndexDescriptor: command.configurationIndex }),
      ...(command.baseConfigurationIndex === undefined
        ? {}
        : { baseConfigurationIndexDescriptor: command.baseConfigurationIndex }),
    }
    firstPassAccumulator = createFirstPassAccumulator(command.workerIndex)
    return undefined
  }

  if (command.kind === "dispose") {
    await disposeWorkerState()
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
      preparedRecords: result.preparedRecords,
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
    beginSecondPass(
      command.readToken,
      requireInitializedState(),
      command.composition,
      command.exportProfile,
    )
    secondPassAccumulator?.fragmentWriter.discard()
    secondPassAccumulator = createSecondPassAccumulator(requireInitializedState().workerIndex)
    return undefined
  }

  if (command.kind === "secondPassBatch") {
    const state = requireInitializedState()
    const accumulator = requireSecondPassAccumulator()
    for (const assignmentId of command.assignmentIds) {
      await processSecondPass(
        assignmentId,
        state,
        accumulator,
        controlExportForTests ?? executeImportControlExport,
      )
    }
    return finishImportWorkerBatch(accumulator, state.workerIndex)
  }

  if (command.kind === "finishSecondPass") {
    const accumulator = requireSecondPassAccumulator()
    accumulator.fragmentWriter.discard()
    accumulator.profiler.flush()
    secondPassAccumulator = undefined
    await endSecondPass()
    const unfinished = [...preparedYaml.values()].filter(({ output }) => output === undefined)
    if (unfinished.length > 0) {
      throw new Error(`Второй проход XML-import не обработал ${unfinished.length} отложенных YAML`)
    }
    return undefined
  }

  if (command.kind === "beginThirdPass") {
    beginSecondPass(command.readToken, requireInitializedState(), undefined, undefined, command.issueDecisions)
    secondPassAccumulator?.fragmentWriter.discard()
    secondPassAccumulator = createSecondPassAccumulator(requireInitializedState().workerIndex)
    return undefined
  }

  if (command.kind === "thirdPassBatch") {
    requireInitializedState()
    const accumulator = requireSecondPassAccumulator()
    for (const assignmentId of command.assignmentIds) {
      await processThirdPass(assignmentId, requireInitializedState(), accumulator)
    }
    return finishImportWorkerBatch(accumulator, requireInitializedState().workerIndex)
  }

  if (command.kind === "finishThirdPass") {
    const accumulator = requireSecondPassAccumulator()
    accumulator.fragmentWriter.discard()
    accumulator.profiler.flush()
    secondPassAccumulator = undefined
    await endSecondPass()
    if (preparedYaml.size > 0) {
      throw new Error(`Третий проход XML-import не записал ${preparedYaml.size} подготовленных YAML`)
    }
    return undefined
  }

  if (command.kind === "endSecondPass") {
    secondPassAccumulator?.fragmentWriter.discard()
    secondPassAccumulator = undefined
    await endSecondPass()
    return undefined
  }

  if (command.kind === "secondPass") {
    const accumulator = createSecondPassAccumulator(requireInitializedState().workerIndex)
    await processSecondPass(
      command.assignmentId,
      requireInitializedState(),
      accumulator,
      controlExportForTests ?? executeImportControlExport,
    )
    await processThirdPass(command.assignmentId, requireInitializedState(), accumulator)
    return finishSecondPass(accumulator)
  }

  const accumulator = createFirstPassAccumulator(requireInitializedState().workerIndex)
  await processFirstPass(command.assignments, requireInitializedState(), accumulator)
  const result = finishFirstPass(accumulator)
  for (const { locator, bytes } of result.preparedRecords) legacyPreparedRecords.set(locator.assignmentId, bytes)
  return result
}

async function processSecondPass(
  assignmentId: string,
  state: InitializedImportWorkerState,
  accumulator: SecondPassAccumulator,
  controlExport: typeof executeImportControlExport,
): Promise<void> {
  const profiler = accumulator.profiler
  profiler.record("Подготовка импорта конфигурации", "Задания второго прохода", {
    items: 1,
    timeMs: 0,
  })
  const secondPass = activeSecondPass
  if (secondPass === undefined) throw new Error("Второй проход XML-import worker не начат")
  if (secondPass.preparedStore === undefined && !assignedImports.has(assignmentId)) {
    throw new Error(`Задание ${assignmentId} не принадлежит этой линии import`)
  }
  let prepared = preparedYaml.get(assignmentId)
  const storedBytes = prepared === undefined
    ? secondPass.preparedStore === undefined
      ? legacyPreparedRecords.get(assignmentId)
      : await secondPass.preparedStore.read(assignmentId)
    : undefined
  if (prepared === undefined && storedBytes !== undefined) {
    legacyPreparedRecords.delete(assignmentId)
    const restored = restorePreparedImportRecord(storedBytes)
    const validationFile = state.projectFileProjector({
      projectPath: restored.record.assignment.targetProjectPath,
      topologyAddress: restored.record.assignment.topologyAddress,
    })
    if (validationFile === undefined) {
      throw new Error(`Не найден узел topology XML-import: ${restored.record.assignment.topologyAddress.nodeId}`)
    }
    prepared = {
      diagnosticAssignment: {
        targetProjectPath: restored.record.assignment.targetProjectPath,
        xmlFiles: restored.record.assignment.xmlFiles,
      },
      assignment: restored.record.assignment,
      targetProjectPath: restored.record.targetProjectPath,
      logicalAddress: restored.record.logicalAddress,
      yaml: restored.yaml,
      annotations: restored.annotations,
      proofAudit: restored.record.proofAudit,
      rule: restored.rule,
      ownerContext: restored.record.ownerContext,
      formDataPathIndex: restored.formDataPathIndex,
      deferred: restored.deferred,
      dependentDeferred: restored.record.dependentDeferred,
      dependentOwner: restored.record.dependentOwner,
      validationFile,
      ...(restored.record.configurationFragment === undefined
        ? {}
        : { configurationFragment: restored.record.configurationFragment }),
      ...(restored.baseFormCandidate === undefined
        ? {}
        : {
            baseFormCandidate: {
              ...restored.baseFormCandidate,
              localIndexes: {
                metadata: {
                  events: [],
                  ...(restored.baseFormCandidate.formDataPathIndex === undefined
                    ? {}
                    : { formDataPathIndex: restored.baseFormCandidate.formDataPathIndex }),
                },
              },
            },
          }),
    }
    preparedYaml.set(assignmentId, prepared)
    assignedImportIds.add(assignmentId)
  }
  if (prepared === undefined) throw new Error(`Не найдена подготовленная запись XML-import: ${assignmentId}`)
  if (prepared !== undefined) {
    try {
      const configurationIndex = secondPass.configurationStore === undefined
        ? createLocalConfigurationIndexReader(new Map(
            prepared.configurationFragment === undefined
              ? []
              : [[prepared.targetProjectPath, prepared.configurationFragment]],
          ))
        : createLocalConfigurationIndexReader(secondPass.configurationStore.getBlocks([
            prepared.targetProjectPath,
            ...(prepared.baseFormCandidate === undefined ? [] : [prepared.baseFormCandidate.targetProjectPath]),
          ]))
      const baseConfigurationIndex = secondPass.baseConfigurationStore === undefined
        || prepared.baseFormCandidate === undefined
        ? undefined
        : createLocalConfigurationIndexReader(secondPass.baseConfigurationStore.getBlocks([
            prepared.baseFormCandidate.baseProjectPath,
            prepared.baseFormCandidate.targetProjectPath,
          ]))
      const output = await prepareYamlForFinalPass(
        prepared,
        secondPass.ownerMetadataCache,
        secondPass.readSession,
        state,
        accumulator.warnings,
        profiler,
        controlExport,
        configurationIndex,
        baseConfigurationIndex,
      )
      prepared.proofAudit = undefined
      prepared.output = output
      accumulator.fragmentWriter.appendImportIndex(output.main.index)
      accumulator.fragmentWriter.appendImportFinal(output.main.final)
      if (output.base !== undefined) accumulator.fragmentWriter.appendImportIndex(output.base.index)
      if (output.base !== undefined) accumulator.fragmentWriter.appendImportFinal(output.base.final)
      accumulator.configurationFragments.push(...output.configurationFragments)
      accumulator.stateEntries += output.base === undefined ? 1 : 2
    } catch (caught) {
      accumulator.diagnostics.push(
        importAssignmentDiagnostic(prepared.diagnosticAssignment, caught, "xml_import_yaml_failed"),
      )
      preparedYaml.delete(assignmentId)
    }
  }

  profiler.record("Подготовка импорта конфигурации", "Формирование worker списка файлов результата импорта", {
    items: prepared === undefined ? 0 : 1,
    timeMs: 0,
  })
}

async function processThirdPass(
  assignmentId: string,
  state: InitializedImportWorkerState,
  accumulator: SecondPassAccumulator,
): Promise<void> {
  if (!assignedImportIds.has(assignmentId)) {
    throw new Error(`Задание ${assignmentId} не принадлежит этой линии import`)
  }
  const prepared = preparedYaml.get(assignmentId)
  if (prepared === undefined) return
  try {
    let output = prepared.output
    if (output === undefined) {
      throw new Error(`Задание ${assignmentId} не подготовлено вторым проходом XML-import`)
    }
    const decisions = (activeSecondPass?.issueDecisionsByProjectPath.get(prepared.targetProjectPath) ?? [])
      .map((decision) => requiresImportantForImportedTarget(prepared, decision.target)
        ? { ...decision, kind: "important" as const }
        : decision)
    if (decisions.length > 0) {
      applyImportedIssueDecisions({
        data: prepared.yaml,
        annotations: prepared.annotations,
        decisions,
      })
      const serialized = serializePreparedYaml(
        prepared.targetProjectPath,
        prepared.yaml,
        state,
        accumulator.profiler,
        prepared.annotations,
      )
      output = {
        ...output,
        main: {
          serialized: retainWritableYaml(serialized),
          index: output.main.index,
          final: applyImportedDecisionsToFinalState(output.main.final, decisions, serialized.localHash),
        },
      }
      prepared.output = output
    }
    const main = await writeMainImportYaml({ serialized: output.main.serialized, profiler: accumulator.profiler })
    accumulator.files.push(main.file)
    accumulator.fragmentWriter.appendImportIndex(output.main.index)
    accumulator.fragmentWriter.appendImportFinal(output.main.final)
    accumulator.stateEntries += 1
    if (output.base !== undefined) {
      const base = await writeMainImportYaml({ serialized: output.base.serialized, profiler: accumulator.profiler })
      accumulator.files.push(base.file)
      accumulator.fragmentWriter.appendImportIndex(output.base.index)
      accumulator.fragmentWriter.appendImportFinal(output.base.final)
      accumulator.stateEntries += 1
    }
  } catch (caught) {
    accumulator.diagnostics.push(
      importAssignmentDiagnostic(prepared.diagnosticAssignment, caught, "xml_import_yaml_failed"),
    )
  } finally {
    preparedYaml.delete(assignmentId)
  }
  accumulator.profiler.record(
    "Подготовка импорта конфигурации",
    "Формирование worker списка файлов результата импорта",
    { items: 1, timeMs: 0 },
  )
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

function finishImportWorkerBatch(accumulator: SecondPassAccumulator, workerIndex: number) {
  const result = finishSecondPass(accumulator, false)
  secondPassAccumulator = createSecondPassAccumulator(workerIndex, accumulator.profiler)
  return encodeImportBinaryResult(accumulator.profiler, {
    diagnostics: result.diagnostics,
    warnings: result.warnings,
    files: result.files,
    configurationFragments: result.configurationFragments,
    ...(result.stateFragment === undefined ? {} : { stateFragment: result.stateFragment }),
  })
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
  controlComposition?: readonly ImportControlCompositionEntry[],
  exportProfile?: XmlComponentExportProfile,
  issueDecisions: readonly ImportProjectIssueDecision[] = [],
): void {
  if (activeSecondPass !== undefined) throw new Error("Второй проход XML-import worker уже начат")
  const readSession = openProjectStateReadSession(readToken)
  const preparedStore = state.preparedStoreDescriptor === undefined
    ? undefined
    : openPreparedImportStore(state.preparedStoreDescriptor, "readOnly")
  const configurationStore = state.configurationIndexDescriptor === undefined
    ? undefined
    : openConfigurationIndexStore(state.configurationIndexDescriptor, "readOnly")
  const baseConfigurationStore = state.baseConfigurationIndexDescriptor === undefined
    ? undefined
    : openConfigurationIndexStore(state.baseConfigurationIndexDescriptor, "readOnly")
  activeSecondPass = {
    readSession,
    ownerMetadataCache: createProjectStateOwnerMetadataCache({
      projectDir: state.projectDir,
      componentPath: state.componentPath,
      queryPort: readSession,
    }),
    ...(preparedStore === undefined ? {} : { preparedStore }),
    ...(configurationStore === undefined ? {} : { configurationStore }),
    ...(baseConfigurationStore === undefined ? {} : { baseConfigurationStore }),
    composition: importControlComposition(
      controlComposition ?? [...assignedImports.values()].map(importControlCompositionEntry),
    ),
    issueDecisionsByProjectPath: groupIssueDecisionsByProjectPath(issueDecisions),
    ...(exportProfile === undefined ? {} : { exportProfile }),
  }
}

function groupIssueDecisionsByProjectPath(
  entries: readonly ImportProjectIssueDecision[],
): ReadonlyMap<string, readonly ImportIssueDecision[]> {
  const result = new Map<string, ImportIssueDecision[]>()
  for (const { targetProjectPath, decision } of entries) {
    const decisions = result.get(targetProjectPath) ?? []
    decisions.push(decision)
    result.set(targetProjectPath, decisions)
  }
  return result
}

function requiresImportantForImportedTarget(
  prepared: Pick<DeferredImportYaml, "yaml" | "rule">,
  target: ValidationIssueTarget,
): boolean {
  const propertyKey = target.path.at(-1)
  if (typeof propertyKey !== "string") return false
  const parentPath = target.path.slice(0, -1)
  let location: { itemType: string; propertyKey: string; propertyType: string } | undefined
  traverseMetadataRuleYaml({
    yaml: prepared.yaml,
    rule: prepared.rule,
    initialState: undefined,
    onObject({ rule, yamlPath }) {
      if (!sameYamlPath(yamlPath, parentPath)) return
      const property = Object.entries(rule.properties).find(([, candidate]) => candidate.yaml === propertyKey)
      if (property === undefined) return
      location = {
        itemType: rule.itemType,
        propertyKey: property[0],
        propertyType: property[1].type,
      }
    },
  })
  if (location === undefined) return false
  return currentRuleRegistrySet<{
    xmlAnomalies: { requiresImportant(value: typeof location): boolean }
  }>()?.xmlAnomalies.requiresImportant(location) ?? false
}

function sameYamlPath(left: readonly (string | number)[], right: readonly (string | number)[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function applyImportedDecisionsToFinalState(
  final: ProjectStateImportFinalFileStateBatch,
  decisions: readonly ImportIssueDecision[],
  hash: bigint,
): ProjectStateImportFinalFileStateBatch {
  if (final.updates.length !== 1) {
    throw new Error("Окончательное состояние одного YAML должно содержать ровно одно обновление")
  }
  const taggedPaths = decisions
    .filter(({ target }) => target.kind !== "occurrence")
    .map(({ target }) => target.path)
  const updates = final.updates.map((update) => {
    if (update.kind !== "yaml") return update
    return {
      ...update,
      pendingReferences: update.pendingReferences.map((reference) =>
        taggedPaths.some((path) => sameYamlPath(path, reference.yamlPath))
          ? { ...reference, xmlAnomaly: "accepted" as const }
          : reference),
      pendingChecks: update.pendingChecks.map((check) =>
        (check.kind === "dataPath" || check.kind === "fillValue")
          && taggedPaths.some((path) => sameYamlPath(path, check.yamlPath))
          ? { ...check, xmlAnomaly: "accepted" as const }
          : check),
    }
  })
  const hashBytes = new Uint8Array(8)
  new DataView(hashBytes.buffer).setBigUint64(0, hash, false)
  return { updates, hashBytes }
}

async function endSecondPass(): Promise<void> {
  activeSecondPass?.readSession.close()
  await activeSecondPass?.preparedStore?.close()
  await activeSecondPass?.configurationStore?.close()
  await activeSecondPass?.baseConfigurationStore?.close()
  activeSecondPass = undefined
}

async function prepareYamlForFinalPass(
  prepared: DeferredImportYaml,
  ownerMetadataCache: OwnerMetadataCache,
  readSession: ActiveSecondPass["readSession"],
  state: InitializedImportWorkerState,
  warnings: ImportDiagnostic[],
  profiler: ValidationProfiler,
  controlExport: typeof executeImportControlExport,
  configurationIndex: ReturnType<typeof createLocalConfigurationIndexReader>,
  baseConfigurationIndex?: ReturnType<typeof createLocalConfigurationIndexReader>,
): Promise<{
  main: PreparedSerializedYaml
  base?: PreparedSerializedYaml
  configurationFragments: ConfigurationIndexBlockFragment[]
}> {
  const proofAudit = prepared.proofAudit
  if (proofAudit === undefined) {
    throw new Error(`Карта исходного XML уже освобождена: ${prepared.targetProjectPath}`)
  }
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
  const currentConfigurationYAML = shouldReadCurrentConfigurationYaml({
    componentPath: state.componentPath,
    rule: prepared.rule,
    hasBaseFormCandidate: prepared.baseFormCandidate !== undefined,
  })
    ? await readCurrentConfigurationFormYaml({
        logicalAddress: prepared.logicalAddress,
        fallbackProjectPath: prepared.baseFormCandidate?.baseProjectPath ?? prepared.targetProjectPath,
        role: prepared.assignment.role === "fileItem" ? "form" : "properties",
        rule: prepared.rule,
        owner: prepared.dependentOwner,
        state,
      })
    : undefined
  const currentConfigurationData = currentConfigurationYAML?.data
  const preparedBaseFormCandidate = prepared.baseFormCandidate === undefined
    ? undefined
    : prepareBaseFormCandidate({
        candidate: prepared.baseFormCandidate,
        ownerRule: prepared.rule,
        extensionYaml: prepared.yaml,
        currentConfigurationYAML: currentConfigurationData,
        contextWithOwners: withoutDataPathDiagnosticSink(contextWithOwners),
        ownerMetadataCache,
      })
  const controlBaseFormSource = createControlBaseFormSource({
    importedBaseForm: prepared.baseFormCandidate,
    savedBaseForm: preparedBaseFormCandidate,
    currentConfigurationYAML,
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
    () => {
      finalizeMetadataItemImportedYaml({
        yaml: prepared.yaml,
        rule: prepared.rule,
        ownerMetadataCache,
        ...(currentConfigurationData === undefined ? {} : { currentConfigurationYAML: currentConfigurationData }),
        ...(preparedBaseFormCandidate === undefined
          ? {}
          : { savedBaseYAML: preparedBaseFormCandidate.yaml }),
      })
    }
  )
  const proof = await profiler.measureAsync(
    "Подготовка импорта конфигурации",
    "Контрольный экспорт XML",
    { items: 1 },
    () => controlExport({
      assignment: prepared.assignment,
      data: prepared.yaml,
      annotations: snapshotXmlAnomalyAnnotations(prepared.yaml, prepared.annotations),
      audit: proofAudit,
      rule: prepared.rule,
      topology: state.topology,
      context: { ...contextWithOwners, fromXML: state.context.fromXML },
      exportProfile: requireSecondPassExportProfile(),
      index: configurationIndex,
      ...(baseConfigurationIndex === undefined ? {} : { baseConfigurationIndex }),
      ...(controlBaseFormSource === undefined ? {} : { baseFormSource: controlBaseFormSource }),
      composition: activeSecondPass?.composition ?? { children: () => [] },
      readSource: async (sourcePath) => readFile(sourcePath, "utf8"),
      profile(event) {
        profiler.record(
          "Подготовка импорта конфигурации",
          event.mode === "direct"
            ? "Контрольный XML без сериализации"
            : "Контрольный XML с сериализацией",
          { items: 1, timeMs: 0 },
        )
        if (event.detailedRereads > 0) {
          profiler.record("Подготовка импорта конфигурации", "Подробный повторный импорт XML", {
            items: event.detailedRereads,
            timeMs: 0,
          })
        }
      },
      loadDetailedImport: async () => {
        const detailed = await prepareImportYaml({
          assignment: prepared.assignment,
          context: state.context,
          collector: createConfigurationIndexCollector(),
          profiler,
          topology: state.topology,
          proofDetail: "full",
        })
        finalizeMetadataItemImportedYaml({
          yaml: detailed.yaml,
          rule: detailed.rule,
          ownerMetadataCache,
          ...(currentConfigurationData === undefined ? {} : { currentConfigurationYAML: currentConfigurationData }),
          ...(preparedBaseFormCandidate === undefined
            ? {}
            : { savedBaseYAML: preparedBaseFormCandidate.yaml }),
        })
        return {
          data: detailed.yaml,
          annotations: snapshotXmlAnomalyAnnotations(detailed.yaml, detailed.annotations),
          audit: detailed.proofAudit,
        }
      },
    }),
  )
  prepared.yaml = proof.data
  prepared.annotations = restoreXmlAnomalyAnnotations(proof.data, proof.annotations)
  for (const warning of proof.warnings) {
    warnings.push({
      severity: "warning",
      code: "xml_raw_scope_too_broad",
      message: "Непредметное XML-отличие сохранено на более широкой границе",
      targetProjectPath: prepared.targetProjectPath,
      sourcePath: warning.sourcePath,
      value: JSON.stringify({
        xmlPath: warning.xmlPath,
        yamlPath: warning.yamlPath,
        ...(warning.nearestYamlPath === undefined
          ? {}
          : { nearestYamlPath: warning.nearestYamlPath }),
        reason: warning.reason,
        rawBytes: warning.rawBytes,
      }),
    })
  }
  let serialized = serializePreparedYaml(
    prepared.targetProjectPath,
    prepared.yaml,
    state,
    profiler,
    prepared.annotations,
  )
  let validated = measureSerializedImportYamlValidation(prepared, serialized, state, profiler)
  const classified = classifyImportedIssues({
    issues: validated.issues,
    requiresImportant: (target) => requiresImportantForImportedTarget(prepared, target),
  })
  if (classified.fatal.length > 0) {
    throw new Error(`Валидация импортированного YAML завершилась внутренней ошибкой: ${classified.fatal
      .map(({ code }) => code).join(", ")}`)
  }
  if (classified.decisions.length > 0) {
    applyImportedIssueDecisions({
      data: prepared.yaml,
      annotations: prepared.annotations,
      decisions: classified.decisions,
    })
    serialized = serializePreparedYaml(
      prepared.targetProjectPath,
      prepared.yaml,
      state,
      profiler,
      prepared.annotations,
    )
    validated = measureSerializedImportYamlValidation(prepared, serialized, state, profiler)
  }
  const baseForm = preparedBaseFormCandidate === undefined
    ? undefined
    : prepareSerializedBaseFormCandidate({
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
    main: {
      serialized: retainWritableYaml(serialized),
      index: validated.index,
      final: validated.final,
    },
    ...(baseForm === undefined ? {} : { base: baseForm }),
    configurationFragments:
      baseFormConfigurationFragment === undefined ? [] : [baseFormConfigurationFragment],
  }
}

function requireSecondPassExportProfile(): XmlComponentExportProfile {
  const exportProfile = activeSecondPass?.exportProfile
  if (exportProfile === undefined) {
    throw new Error("Второй проход XML-import не получил профиль восстановления XML")
  }
  return exportProfile
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

function createControlBaseFormSource(params: {
  readonly importedBaseForm: DeferredImportYaml["baseFormCandidate"]
  readonly savedBaseForm: DeferredImportYaml["baseFormCandidate"]
  readonly currentConfigurationYAML: PreparedYamlFile | undefined
}): BaseFormSourceResult | undefined {
  if (params.importedBaseForm === undefined || params.currentConfigurationYAML === undefined) return undefined
  const currentConfigurationForm = {
    projectPath: params.importedBaseForm.baseProjectPath,
    prepared: params.currentConfigurationYAML,
  }
  if (params.savedBaseForm === undefined) {
    return {
      kind: "projected",
      baseForm: currentConfigurationForm,
      currentConfigurationForm,
    }
  }
  return {
    kind: "saved",
    baseForm: {
      projectPath: params.savedBaseForm.targetProjectPath,
      prepared: controlBaseFormPreparedYaml({
        projectPath: params.savedBaseForm.targetProjectPath,
        data: params.savedBaseForm.yaml,
        annotations: params.savedBaseForm.annotations,
        owner: params.savedBaseForm.owner,
      }),
    },
    currentConfigurationForm,
  }
}

function controlBaseFormPreparedYaml(params: {
  readonly projectPath: string
  readonly data: unknown
  readonly annotations: XmlAnomalyAnnotations
  readonly owner: { readonly dir: string; readonly name: string }
}): PreparedYamlFile {
  return {
    projectPath: params.projectPath,
    filePath: params.projectPath,
    role: "form",
    owner: params.owner,
    data: params.data,
    annotations: params.annotations,
    syntaxDiagnostics: [],
  }
}

function prepareBaseFormCandidate(params: {
  candidate: NonNullable<DeferredImportYaml["baseFormCandidate"]>
  ownerRule: DeferredImportYaml["rule"]
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
  const currentForm = importedClientApplicationForm({
    yaml: params.currentConfigurationYAML,
    rule: params.ownerRule,
  })
  const extensionForm = importedClientApplicationForm({
    yaml: params.extensionYaml,
    rule: params.ownerRule,
  })
  if (currentForm === undefined || extensionForm === undefined) {
    throw new Error(`Не найдены данные формы для ${params.candidate.baseProjectPath}`)
  }
  const projection = projectClientApplicationBaseForm({
    baseYaml: clientApplicationFormYaml(currentForm.yaml, params.candidate.baseProjectPath),
    extensionYaml: clientApplicationFormYaml(extensionForm.yaml, params.candidate.targetProjectPath),
    rule: params.candidate.rule,
  })
  return equalBaseFormYaml(params.candidate.yaml, projection.yaml) ? undefined : params.candidate
}

function prepareSerializedBaseFormCandidate(params: {
  candidate: NonNullable<DeferredImportYaml["baseFormCandidate"]>
  state: InitializedImportWorkerState
  profiler: ValidationProfiler
}): PreparedSerializedYaml {
  const serialized = serializePreparedYaml(
    params.candidate.targetProjectPath,
    params.candidate.yaml,
    params.state,
    params.profiler,
    params.candidate.annotations,
  )
  const validationFile = resolveValidationProjectFile(
    params.state.projectDir,
    params.candidate.targetProjectPath,
    params.state.validationComponent,
  )
  if (validationFile === undefined) {
    throw new Error(`Не удалось подготовить описание YAML import: ${params.candidate.targetProjectPath}`)
  }
  const validated = measureSerializedImportYamlValidation(
    { targetProjectPath: params.candidate.targetProjectPath, validationFile },
    serialized,
    params.state,
    params.profiler,
    "isolated",
  )
  return {
    serialized: retainWritableYaml(serialized),
    index: validated.index,
    final: validated.final,
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
  fallbackProjectPath: string
  role: "form" | "properties"
  rule: PreparedImportYaml["rule"]
  owner: DeferredImportYaml["dependentOwner"]
  state: InitializedImportWorkerState
}): Promise<PreparedYamlFile | undefined> {
  const readSession = activeSecondPass?.readSession
  if (readSession === undefined) throw new Error("Не начат второй проход XML-import worker")
  const entries = readSession.readStructuredDocumentEntries({
    componentPath: "cf",
    logicalAddress: params.logicalAddress,
  })
  const projectPaths = new Set(
    entries
      .filter(({ representation, componentKind }) =>
        representation === "working" && componentKind === "document"
      )
      .map(({ workingProjectPath }) => workingProjectPath)
  )
  if (projectPaths.size > 1) {
    throw new Error(`Для текущей формы cf найдено несколько YAML: ${[...projectPaths].join(", ")}`)
  }
  const projectPath = [...projectPaths][0] ?? params.fallbackProjectPath
  const filePath = join(params.state.projectDir, "cf", ...projectPath.split("/"))
  if (!existsSync(filePath)) return undefined
  const prepared = prepareYamlFiles({
    files: [{
      projectPath,
      filePath,
      role: params.role,
      owner: params.owner,
      itemType: params.rule.itemType,
    }],
    itemTypeByYamlDir: {},
  })
  const yaml = prepared.yamlFiles[0]
  if (prepared.diagnostics.length > 0 || yaml === undefined || yaml.syntaxDiagnostics.length > 0) {
    throw new Error(`Не удалось подготовить текущую форму cf: ${projectPath}`)
  }
  return yaml
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
    importFromYAML: {
      ...params.context.importFromYAML,
      ownerMetadataCache: params.ownerMetadataCache,
    },
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
    assignedImports.set(assignment.id, assignment)
    const collector = createConfigurationIndexCollector()
    try {
      const prepared = await prepareImportYaml({
        assignment,
        context: state.context,
        collector,
        profiler,
        topology: state.topology,
        proofDetail: "roots",
      })
      const fragment = profiler.measure(
        "Подготовка импорта конфигурации",
        "Извлечение данных для индекса конфигурации",
        { items: 1 },
        () => collector.fragment(assignment.targetProjectPath)
      )
      const validationFile = profiler.measure(
        "Подготовка импорта конфигурации",
        "Подготовка описания файла проекта",
        { items: 1 },
        () => state.projectFileProjector({
          projectPath: assignment.targetProjectPath,
          topologyAddress: assignment.topologyAddress,
        }),
      )
      if (validationFile === undefined) {
        throw new Error(`Не найден узел topology XML-import: ${assignment.topologyAddress.nodeId}`)
      }
      const validationContribution = profiler.measure(
        "Подготовка импорта конфигурации",
        "Формирование вклада файла в общий индекс",
        { items: 1 },
        () => extractImportValidationContribution({
          prepared,
          projectDir: state.outputDir,
          file: validationFile,
          measure: (step, action) => profiler.measure(
            "Подготовка импорта конфигурации",
            step,
            { items: 1 },
            action,
          ),
        })
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
        const bytes = encodePreparedImportRecord(createPreparedImportRecordSource(prepared, fragment))
        accumulator.preparedRecords.push({
          locator: { assignmentId: assignment.id, weight: bytes.byteLength },
          bytes,
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
    preparedRecords: [],
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
    preparedRecords: accumulator.preparedRecords,
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
  annotations?: XmlAnomalyAnnotations,
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
      ...(annotations === undefined ? {} : { annotations }),
    }),
  )
}

function retainWritableYaml(serialized: SerializedImportYaml): WritableSerializedImportYaml {
  return {
    file: serialized.file,
    bytes: serialized.bytes,
    localHash: serialized.localHash,
  }
}

function validateSerializedImportYaml(
  prepared: Pick<DeferredImportYaml, "targetProjectPath" | "validationFile">,
  serialized: SerializedImportYaml,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
  indexContribution: "shared" | "isolated" = "shared",
): {
  index: ProjectStateImportIndexContribution
  final: ProjectStateImportFinalFileStateBatch
  issues: readonly ValidationIssue[]
} {
  const file = prepared.validationFile
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
  return { ...splitImportYamlUpdate(full, serialized.localHash), issues: first.issues }
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
  prepared: Pick<DeferredImportYaml, "targetProjectPath" | "validationFile">,
  serialized: SerializedImportYaml,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
  indexContribution: "shared" | "isolated" = "shared",
): {
  index: ProjectStateImportIndexContribution
  final: ProjectStateImportFinalFileStateBatch
  issues: readonly ValidationIssue[]
} {
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
  return move(createImportFirstPassTransferable(result)) as unknown as ImportFirstPassResult
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

async function disposeWorkerState(): Promise<void> {
  await endSecondPass()
  clearWorkerState()
}

function clearWorkerState(): void {
  firstPassAccumulator?.fragmentWriter.discard()
  firstPassAccumulator = undefined
  secondPassAccumulator?.fragmentWriter.discard()
  secondPassAccumulator = undefined
  preparedYaml.clear()
  assignedImportIds.clear()
  assignedImports.clear()
  legacyPreparedRecords.clear()
  initializedState = undefined
}

function workerStateForTests(): {
  initialized: boolean
  operationId?: string
  workerIndex?: number
  outputDir?: string
  preparedYamlIds: string[]
  retainedProofAuditIds: string[]
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
    preparedYamlIds: [...new Set([...preparedYaml.keys(), ...legacyPreparedRecords.keys()])],
    retainedProofAuditIds: [...new Set([
      ...legacyPreparedRecords.keys(),
      ...[...preparedYaml]
      .filter(([, prepared]) => prepared.proofAudit !== undefined)
      .map(([assignmentId]) => assignmentId),
    ])],
  }
}

function resetImportWorkerStateForTests(): void {
  const secondPass = activeSecondPass
  activeSecondPass = undefined
  secondPass?.readSession.close()
  void secondPass?.preparedStore?.close()
  void secondPass?.configurationStore?.close()
  void secondPass?.baseConfigurationStore?.close()
  clearWorkerState()
}

function setImportWorkerSchemaCacheForTests(schemaCache: ValidationSchemaCache | undefined): void {
  schemaCacheForTests = schemaCache
}

function setImportWorkerControlExportForTests(
  controlExport: typeof executeImportControlExport | undefined,
): void {
  controlExportForTests = controlExport
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
  setControlExportForTests: setImportWorkerControlExportForTests,
}
}

export function createImportFirstPassTransferable(result: ImportFirstPassResult) {
  return {
    get [transferableSymbol]() {
      return [
        ...Object.values(result.stateFragment?.buffers ?? {}),
        ...result.preparedRecords.map(({ bytes }) => bytes.buffer as ArrayBuffer),
      ]
    },
    get [valueSymbol]() {
      return result
    },
  }
}
