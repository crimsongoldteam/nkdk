import { move, transferableSymbol, valueSymbol } from "piscina"
import { existsSync } from "node:fs"
import { join, posix } from "node:path"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import {
  createLocalConfigurationIndexReader,
  hashFileBytes,
  rehydrateConfigurationContext,
  restoreXmlAnomalyAnnotations,
  snapshotXmlAnomalyAnnotations,
  validationIssuePathFromPointer,
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
import { sameValidationOwnerRef } from "../validation/dataPath/validationOwnerRef"
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
  projectStateFormEntries,
  projectStateOwnerFacts,
  projectStatePendingCheck,
  projectStateTargetEntry,
  type ProjectStateYamlFileUpdate,
} from "../projectState/fileUpdate"
import { createProjectStateOwnerMetadataCache } from "../validation/projectStateDependencyValidation"
import {
  createComposedProjectStateDependencyValidator,
  openProjectStateReadSession,
} from "../composition/projectState"
import { resolveProjectPath } from "../projectDefinition/path"
import { classifyMetadataProjectPath, projectStateFileBackedTargets } from "../projectDefinition/resources"
import type { ProjectStateImportFinalFileStateBatch, ProjectStateImportIndexContribution } from "../projectState/importSession"
import type { ProjectStateQueryPort } from "../projectState/contracts"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import {
  extractImportValidationContributionFromFacts,
  type ImportValidationContribution,
} from "./validationContribution"
import {
  ImportXmlInputError,
  prepareImportYamlFromDocuments,
  readImportXmlDocuments,
  type PreparedImportYaml,
} from "./prepareYaml"
import { prepareImportFacts, type PreparedImportFacts } from "./prepareFacts"
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
import type { MetadataWorkerOperationRegistry } from "../workerPool/operationRegistry"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import { isRedundantClientApplicationBaseForm } from "../forms/clientApplicationForm/baseFormNecessity"
import type { ClientApplicationFormYAML } from "../forms/clientApplicationForm/types"
import { normalizeImportedDependentItems } from "./dependentItems"
import { collectFormDataPathOccurrencesFromYAML } from "../validation/dataPath/formYamlTraversal"
import { validatePendingChecks, type ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
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
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"
import { createPackedXmlAssignmentStore } from "./packedXmlAssignment"

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
  let packedProfiler: ValidationProfiler | undefined
  const packedStore = createPackedXmlAssignmentStore({ profiler: {
    measure: (step, substep, params, action) => packedProfiler?.measure(step, substep, params, action) ?? action(),
    measureAsync: (step, substep, params, action) => packedProfiler?.measureAsync(step, substep, params, action) ?? action(),
    record: (step, substep, params) => packedProfiler?.record(step, substep, params),
    checkpoint: (step, substep, params) => {
      if (isImportMemoryProfilingEnabled()) packedProfiler?.checkpoint(step, substep, params)
    },
    records: () => packedProfiler?.records() ?? [],
    flush: () => packedProfiler?.flush(),
  } })
  const pendingAssignmentIds = new Set<string>()
  const assignedImports = new Map<string, ImportAssignment>()
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
    await endSecondPass()
    preparedYaml.clear()
    packedStore.clear()
    pendingAssignmentIds.clear()
    assignedImports.clear()
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
      command.issueDecisions,
    )
    secondPassAccumulator?.fragmentWriter.discard()
    secondPassAccumulator = createSecondPassAccumulator(requireInitializedState().workerIndex)
    return undefined
  }

  if (command.kind === "secondPassBatch") {
    const state = requireInitializedState()
    const accumulator = requireSecondPassAccumulator()
    for (const assignmentId of command.assignmentIds) {
      if (isImportMemoryProfilingEnabled()) {
        accumulator.profiler.checkpoint(
          "Подготовка импорта конфигурации",
          `Начало задания второго прохода: ${assignmentId}`,
          { items: packedStore.stats().assignments, bytes: packedStore.stats().bytes },
        )
      }
      await processSecondPass(
        assignmentId,
        state,
        accumulator,
        controlExportForTests ?? executeImportControlExport,
      )
    }
    checkpointRetainedSecondPass(accumulator.profiler)
    return finishImportWorkerBatch(accumulator, state.workerIndex)
  }

  if (command.kind === "finishSecondPass") {
    const accumulator = requireSecondPassAccumulator()
    accumulator.fragmentWriter.discard()
    accumulator.profiler.flush()
    secondPassAccumulator = undefined
    await endSecondPass()
    const unfinished = pendingAssignmentIds.size
    if (unfinished > 0) {
      throw new Error(`Второй проход XML-import не обработал ${unfinished} packed XML-заданий`)
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
  controlExport: typeof executeImportControlExport,
): Promise<void> {
  const profiler = accumulator.profiler
  packedProfiler = profiler
  profiler.record("Подготовка импорта конфигурации", "Задания второго прохода", {
    items: 1,
    timeMs: 0,
  })
  const secondPass = activeSecondPass
  if (secondPass === undefined) throw new Error("Второй проход XML-import worker не начат")
  const assignment = assignedImports.get(assignmentId)
  if (assignment === undefined) {
    throw new Error(`Задание ${assignmentId} не принадлежит этой линии import`)
  }
  let prepared: DeferredImportYaml | undefined
  try {
    const inputs = shouldRereadXmlOnSecondPass()
      ? await readImportXmlDocuments({ assignment, profiler, profilePass: "second" })
      : packedStore.take(assignmentId)
    pendingAssignmentIds.delete(assignmentId)
    const collector = createConfigurationIndexCollector()
    const imported = await prepareImportYamlFromDocuments({
      assignment,
      context: state.context,
      collector,
      inputs,
      profiler,
      topology: state.topology,
    })
    const validationFile = state.projectFileProjector({
      projectPath: assignment.targetProjectPath,
      topologyAddress: assignment.topologyAddress,
    })
    if (validationFile === undefined) {
      throw new Error(`Не найден узел topology XML-import: ${assignment.topologyAddress.nodeId}`)
    }
    prepared = {
      diagnosticAssignment: {
        targetProjectPath: assignment.targetProjectPath,
        xmlFiles: assignment.xmlFiles,
      },
      assignment,
      targetProjectPath: imported.targetProjectPath,
      logicalAddress: assignment.logicalAddress,
      yaml: imported.yaml,
      annotations: imported.annotations,
      proofAudit: imported.proofAudit,
      rule: imported.rule,
      ownerContext: imported.ownerContext,
      formDataPathIndex: imported.localIndexes.metadata.formDataPathIndex,
      deferred: imported.deferred,
      dependentDeferred: imported.dependentDeferred,
      dependentOwner: imported.dependentOwner,
      validationFile,
      configurationFragment: collector.fragment(assignment.targetProjectPath),
      ...(imported.baseFormCandidate === undefined ? {} : { baseFormCandidate: imported.baseFormCandidate }),
    }
    preparedYaml.set(assignmentId, prepared)
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
      const main = await writeMainImportYaml({ serialized: output.main.serialized, profiler })
      accumulator.files.push(main.file)
      if (output.base !== undefined) {
        const base = await writeMainImportYaml({ serialized: output.base.serialized, profiler })
        accumulator.files.push(base.file)
      }
      accumulator.fragmentWriter.appendImportIndex(output.main.index)
      accumulator.fragmentWriter.appendImportFinal(output.main.final)
      if (output.base !== undefined) accumulator.fragmentWriter.appendImportIndex(output.base.index)
      if (output.base !== undefined) accumulator.fragmentWriter.appendImportFinal(output.base.final)
      accumulator.configurationFragments.push(...output.configurationFragments)
      accumulator.stateEntries += output.base === undefined ? 1 : 2
  } catch (caught) {
    accumulator.diagnostics.push(
      importAssignmentDiagnostic(prepared?.diagnosticAssignment ?? assignment, caught, "xml_import_yaml_failed"),
    )
  } finally {
    preparedYaml.delete(assignmentId)
    packedStore.release(assignmentId)
    pendingAssignmentIds.delete(assignmentId)
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

function checkpointRetainedSecondPass(profiler: ValidationProfiler): void {
  if (!isImportMemoryProfilingEnabled()) return
  const retained = packedStore.stats()
  profiler.checkpoint(
    "Подготовка импорта конфигурации",
    "Удерживаемый packed XML",
    {
      items: retained.assignments,
      bytes: retained.bytes,
    },
  )
}

function isImportMemoryProfilingEnabled(): boolean {
  return process.env["NKDK_PROFILE_MEMORY"] === "1"
}

function shouldRereadXmlOnSecondPass(): boolean {
  return process.env["NKDK_IMPORT_XML_STRATEGY"] === "reread"
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
      profilePropertyTypes: process.env["NKDK_PROFILE"] === "1",
      profile(event) {
        profiler.record(
          "Подготовка импорта конфигурации",
          event.mode === "direct"
            ? "Контрольный XML без сериализации"
            : "Контрольный XML с сериализацией",
          { items: 1, timeMs: 0 },
        )
        profiler.record("Подготовка импорта конфигурации", "toXML: построение объекта", {
          items: 1,
          timeMs: event.toXmlObjectMs,
        })
        profiler.record("Подготовка импорта конфигурации", "toXML: финализация deferred", {
          items: 1,
          timeMs: event.toXmlFinalizeMs,
        })
        profiler.record("Подготовка импорта конфигурации", "Контрольный XML: прямой hash", {
          items: 1,
          timeMs: event.directHashMs,
        })
        profiler.record("Подготовка импорта конфигурации", "Контрольный XML: дерево расхождения", {
          items: 1,
          timeMs: event.mismatchDocumentMs,
        })
        profiler.record("Подготовка импорта конфигурации", "Доказательство XML-аномалий", {
          items: 1,
          timeMs: event.anomalyProofMs,
        })
        for (const propertyType of event.propertyTypes) {
          profiler.record("toXML PropertyRule exclusive", propertyType.propertyType, {
            items: propertyType.propertyCount,
            timeMs: propertyType.exclusiveMs,
          })
          profiler.record("toXML PropertyRule inclusive", propertyType.propertyType, {
            items: propertyType.propertyCount,
            timeMs: propertyType.inclusiveMs,
          })
        }
        for (const propertyType of event.fusedAtomicTypes) {
          profiler.record("toXML fused atomic", propertyType.propertyType, {
            items: propertyType.count,
            timeMs: propertyType.timeMs,
          })
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
  const semanticIssues = validateFinalImportSemantics({
    index: validated.index,
    final: validated.final,
    projectDir: state.projectDir,
    readSession,
    pendingChecks: validated.pendingChecks,
  })
  const classified = classifyImportedIssues({
    issues: [...validated.issues, ...semanticIssues],
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
      ? retargetNonEmptyConfigurationFragment(
          prepared.baseFormCandidate.configurationFragment,
          prepared.targetProjectPath,
        )
      : prepared.baseFormCandidate.configurationFragment
  return {
    main: {
      serialized: retainWritableYaml(serialized),
      index: withPreparedFormIndexFallback(prepared, validated.index),
      final: semanticIssues.length === 0
        ? validated.final
        : applyImportedDecisionsToFinalState(validated.final, classified.decisions, serialized.localHash),
    },
    ...(baseForm === undefined ? {} : { base: baseForm }),
    configurationFragments:
      baseFormConfigurationFragment === undefined ? [] : [baseFormConfigurationFragment],
  }
}

function withPreparedFormIndexFallback(
  prepared: Pick<DeferredImportYaml, "dependentOwner" | "formDataPathIndex">,
  index: ProjectStateImportIndexContribution,
): ProjectStateImportIndexContribution {
  if (index.forms.length > 0 || prepared.formDataPathIndex === undefined) return index
  return {
    ...index,
    forms: projectStateFormEntries({
      owner: { kind: prepared.dependentOwner.dir, name: prepared.dependentOwner.name },
      index: prepared.formDataPathIndex,
    }),
  }
}

function requireSecondPassExportProfile(): XmlComponentExportProfile {
  const exportProfile = activeSecondPass?.exportProfile
  if (exportProfile === undefined) {
    throw new Error("Второй проход XML-import не получил профиль восстановления XML")
  }
  return exportProfile
}

function retargetNonEmptyConfigurationFragment(
  fragment: ConfigurationIndexBlockFragment,
  targetProjectPath: string,
): ConfigurationIndexBlockFragment | undefined {
  if (fragment.entities.length === 0) return undefined
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
  return isRedundantClientApplicationBaseForm({
    currentConfigurationYaml: clientApplicationFormYaml(currentForm.yaml, params.candidate.baseProjectPath),
    extensionYaml: clientApplicationFormYaml(extensionForm.yaml, params.candidate.targetProjectPath),
    savedBaseYaml: clientApplicationFormYaml(params.candidate.yaml, params.candidate.targetProjectPath),
    rule: params.candidate.rule,
  })
    ? undefined
    : params.candidate
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
  packedProfiler = profiler
  for (const assignment of assignments) {
    assignedImports.set(assignment.id, assignment)
    const collector = createConfigurationIndexCollector()
    let packed = false
    try {
      const inputs = await readImportXmlDocuments({ assignment, profiler, profilePass: "first" })
      const prepared = await prepareImportFacts({
        assignment,
        context: state.context,
        collector,
        inputs,
        profiler,
        topology: state.topology,
      })
      const fragment = prepared.configurationFragment
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
        () => extractImportValidationContributionFromFacts({
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
        accumulator.fragmentWriter.appendImportFinal(
          provisionalImportFinalContribution(prepared, validationContribution, state),
        )
        if (!shouldRereadXmlOnSecondPass()) packedStore.put(assignment.id, inputs)
        pendingAssignmentIds.add(assignment.id)
        packed = true
        accumulator.files.push(...assignmentFiles)
      } catch (caught) {
        accumulator.diagnostics.push(importAssignmentDiagnostic(assignment, caught, "xml_import_yaml_failed"))
        continue
      }
      accumulator.configurationFragments.push(fragment)
    } catch (caught) {
      accumulator.diagnostics.push(importAssignmentDiagnostic(assignment, caught))
    } finally {
      if (!packed) {
        packedStore.release(assignment.id)
        pendingAssignmentIds.delete(assignment.id)
      }
    }
  }

  const retained = packedStore.stats()
  profiler.record("Подготовка импорта конфигурации", "XML-задания, ожидающие второго прохода", {
    items: pendingAssignmentIds.size,
    bytes: retained.bytes,
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

interface SerializedImportYamlValidation {
  readonly index: ProjectStateImportIndexContribution
  readonly final: ProjectStateImportFinalFileStateBatch
  readonly issues: readonly ValidationIssue[]
  readonly pendingChecks: readonly ValidationPendingCheck[]
}

function validateSerializedImportYaml(
  prepared: Pick<DeferredImportYaml, "targetProjectPath" | "validationFile">,
  serialized: SerializedImportYaml,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
  indexContribution: "shared" | "isolated" = "shared",
): SerializedImportYamlValidation {
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
  return {
    ...splitImportYamlUpdate(full, serialized.localHash),
    issues: first.issues,
    pendingChecks: first.state.kind === "form" || first.state.kind === "properties"
      ? first.state.pendingChecks
      : [],
  }
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

function validateFinalImportSemantics(params: {
  readonly index: ProjectStateImportIndexContribution
  readonly final: ProjectStateImportFinalFileStateBatch
  readonly projectDir: string
  readonly readSession: ActiveSecondPass["readSession"]
  readonly pendingChecks: readonly ValidationPendingCheck[]
}): ValidationIssue[] {
  if (params.final.updates.length !== 1) {
    throw new Error("Окончательное состояние одного YAML должно содержать ровно одно обновление")
  }
  const update = params.final.updates[0]!
  if (update.kind !== "yaml") return []
  const validator = createComposedProjectStateDependencyValidator()
  const componentPath = update.componentPath
  const projectPath = update.projectPath
  const queryPort = withCurrentImportIndex(params.readSession, params.index)
  const ownerMetadataCache = createProjectStateOwnerMetadataCache({
    projectDir: params.projectDir,
    componentPath,
    queryPort,
  })
  const references = update.pendingReferences.map((reference, index) => ({
    requestId: `import-reference:${index}`,
    componentPath,
    reference: { ...reference, filePath: projectPath },
  }))
  const dependencies = update.pendingChecks.flatMap((check, index) =>
    check.kind === "addressableRequired" || check.kind === "referenceCoverage" || check.kind === "dataPath"
      ? []
      : [{ requestId: `import-dependency:${index}`, componentPath, projectPath, check }]
  )
  const addressableRequired = update.pendingChecks.flatMap((check, index) =>
    check.kind === "addressableRequired"
      ? [{ requestId: `import-required:${index}`, componentPath, projectPath, check }]
      : []
  )
  const referenceCoverage = update.pendingChecks.flatMap((check, index) =>
    check.kind === "referenceCoverage"
      ? [{ requestId: `import-coverage:${index}`, componentPath, projectPath, check }]
      : []
  )
  const dataPathChecks = params.pendingChecks.filter(
    (check): check is Extract<ValidationPendingCheck, { kind: "dataPath" }> => check.kind === "dataPath",
  )
  const owners = dataPathChecks.map((check, index) => ({
    requestId: `owner:import-data-path:${index}`,
    componentPath,
    owner: check.owner,
  }))
  const dataPathValidation = validatePendingChecks({
    ownerCache: ownerMetadataCache,
    checks: dataPathChecks,
  })
  const diagnostics = [
    ...dataPathValidation.diagnostics,
    ...validator.validateReferences({
      checks: references,
      projectDir: params.projectDir,
      queryPort,
    }).diagnostics,
    ...validator.validateOwners({
      checks: owners,
      projectDir: params.projectDir,
      queryPort,
    }),
    ...validator.validateDependencies({
      checks: dependencies,
      projectDir: params.projectDir,
      queryPort,
    }).diagnostics,
    ...validator.validateAddressableRequired({
      checks: addressableRequired,
      projectDir: params.projectDir,
      queryPort,
    }),
    ...validator.validateReferenceCoverage({
      checks: referenceCoverage,
      projectDir: params.projectDir,
      queryPort,
    }),
    ...validator.validateStructuredDocuments({
      facts: (params.index.structuredDocuments ?? []).map((entry) => ({ componentPath, projectPath, entry })),
      projectDir: params.projectDir,
      queryPort,
    }),
  ]
  return diagnostics
    .filter(({ severity }) => severity === "error")
    .map((diagnostic) => ({
      code: importDiagnosticCode(diagnostic),
      kind: importDiagnosticKind(diagnostic.source),
      target: importDiagnosticTarget(diagnostic.path),
      params: { message: diagnostic.message },
    }))
}

function importDiagnosticCode(diagnostic: { readonly source: string; readonly code?: unknown }): string {
  return typeof diagnostic.code === "string" ? diagnostic.code : `diagnostic.${diagnostic.source}`
}

function importDiagnosticKind(source: string): ValidationIssue["kind"] {
  return source === "syntax" || source === "external-file" ? "infrastructure" : "semantic"
}

function importDiagnosticTarget(path: string | undefined): ValidationIssue["target"] {
  return { kind: "path", path: validationIssuePathFromPointer(path ?? "") }
}

function withCurrentImportIndex(
  readSession: ActiveSecondPass["readSession"],
  index: ProjectStateImportIndexContribution,
): ProjectStateQueryPort {
  return {
    ...readSession,
    resolveTargets(requests) {
      const stored = readSession.resolveTargets(requests)
      return stored.map((result, requestIndex) => {
        if (result.status !== "missing") return result
        const request = requests[requestIndex]!
        const matches = index.targets.filter(({ canonical }) => canonical === request.canonicalTarget)
        if (matches.length === 0) return result
        if (matches.length > 1) return { requestId: request.requestId, status: "ambiguous" }
        return {
          requestId: request.requestId,
          status: "found",
          target: matches[0]!,
          source: { projectPath: index.projectPath, componentPath: index.componentPath },
        }
      })
    },
    readOwners(requests) {
      const stored = readSession.readOwners(requests)
      return stored.map((result, requestIndex) => {
        const request = requests[requestIndex]!
        const owners = index.owners.filter(({ owner }) => sameValidationOwnerRef(owner, request.owner))
        if (owners.length === 0) return result
        if (owners.length > 1) return { requestId: request.requestId, status: "ambiguous" }
        return { requestId: request.requestId, status: "found", facts: owners[0]!.facts }
      })
    },
    readDependencyInputs(requests) {
      const stored = readSession.readDependencyInputs(requests)
      return stored.map((result, requestIndex) => {
        const request = requests[requestIndex]!
        if (request.projectPath !== index.projectPath) return result
        if (result.status === "found") {
          return { ...result, input: { ...result.input, forms: index.forms } }
        }
        const check = request.check
        if (check.kind !== "dataPath") return result
        const owners = index.owners.filter(({ owner }) => sameValidationOwnerRef(owner, check.owner))
        if (owners.length === 0) return result
        return {
          requestId: request.requestId,
          status: "found",
          input: {
            owners,
            fields: index.fields.filter(({ owner }) => sameValidationOwnerRef(owner, check.owner)),
            forms: index.forms,
          },
        }
      })
    },
    readDependencyOwnerInputs(requests) {
      const stored = readSession.readDependencyOwnerInputs(requests)
      return stored.map((result, requestIndex) => {
        const request = requests[requestIndex]!
        const owner = index.owners.find((entry) => sameValidationOwnerRef(entry.owner, request.owner))
        if (owner === undefined) return result
        return {
          requestId: request.requestId,
          status: "found",
          input: {
            owner: owner.owner,
            facts: owner.facts,
            fields: index.fields.filter((entry) => sameValidationOwnerRef(entry.owner, request.owner)),
          },
        }
      })
    },
  }
}

function measureSerializedImportYamlValidation(
  prepared: Pick<DeferredImportYaml, "targetProjectPath" | "validationFile">,
  serialized: SerializedImportYaml,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
  indexContribution: "shared" | "isolated" = "shared",
): SerializedImportYamlValidation {
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
  prepared: PreparedImportYaml | PreparedImportFacts,
  contribution: ImportValidationContribution,
  state: InitializedImportWorkerState,
): ProjectStateImportIndexContribution {
  const identity = importFileIdentity(
    state,
    prepared.targetProjectPath,
    prepared.assignment.role === "fileItem" ? "form" : "properties",
  )
  const validation = contribution.validationContribution
  const formValidation = "formValidation" in prepared ? prepared.formValidation : undefined
  return {
    ...identity,
    targets: mergeImportTargetEntries([
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
      ...importFileBackedTargets(state, prepared.targetProjectPath),
    ]),
    owners: validation.objectRecords.flatMap(projectStateOwnerFacts),
    fields: validation.objectRecords.flatMap(projectStateFieldEntries),
    forms: formValidation === undefined
      ? []
      : projectStateFormEntries({
          owner: formValidation.owner,
          index: formValidation.index,
        }),
  }
}

function mergeImportTargetEntries(
  entries: ReadonlyArray<ProjectStateImportIndexContribution["targets"][number]>,
): ProjectStateImportIndexContribution["targets"] {
  const merged = new Map<string, ProjectStateImportIndexContribution["targets"][number]>()
  for (const entry of entries) {
    const previous = merged.get(entry.canonical)
    merged.set(entry.canonical, previous === undefined ? entry : { ...previous, ...entry })
  }
  return [...merged.values()]
}

function provisionalImportFinalContribution(
  prepared: PreparedImportFacts,
  contribution: ImportValidationContribution,
  state: InitializedImportWorkerState,
): ProjectStateImportFinalFileStateBatch {
  const identity = importFileIdentity(
    state,
    prepared.targetProjectPath,
    prepared.assignment.role === "fileItem" ? "form" : "properties",
  )
  return {
    updates: [{
      ...identity,
      kind: "yaml",
      localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
      pendingReferences: contribution.validationContribution.pendingReferences.map(
        ({ filePath: _filePath, ...reference }) => reference,
      ),
      pendingChecks: prepared.pendingChecks.map(projectStatePendingCheck),
      dependencies: [],
    }],
    hashBytes: new Uint8Array(8),
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
  packedStore.clear()
  pendingAssignmentIds.clear()
  preparedYaml.clear()
  assignedImports.clear()
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
    preparedYamlIds: [...new Set([...preparedYaml.keys(), ...pendingAssignmentIds])],
    retainedProofAuditIds: [...new Set([
      ...pendingAssignmentIds,
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
      return Object.values(result.stateFragment?.buffers ?? {})
    },
    get [valueSymbol]() {
      return result
    },
  }
}
