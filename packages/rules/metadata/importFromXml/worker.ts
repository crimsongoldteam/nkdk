import { move, transferableSymbol, valueSymbol } from "piscina"
import { existsSync } from "node:fs"
import { join, posix } from "node:path"
import { isDeepStrictEqual } from "node:util"
import { createMovableBinaryResult } from "../workerPool/binaryResult"
import {
  createLocalConfigurationIndexReader,
  createConfigurationIndexExportRuntime,
  hashFileBytes,
  parsedYamlFromKnownData,
  appendXmlAnnotatedMappingEntry,
  rehydrateConfigurationContext,
  validationIssueTargetKey,
  validationIssuePathFromPointer,
  xmlElementChildren,
  yamlPathToPointer,
  type XmlAnomalyAnnotations,
  type XmlRawValue,
} from "@nkdk/runtime"
import { openConfigurationIndexStore } from "@nkdk/runtime/configuration-index-store"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import type { XmlImportConfigurationContext } from "@nkdk/runtime"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import {
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
import {
  isBorrowedExtensionFile,
} from "../validation/projectValidationPasses"
import { collectBoundaryReferenceFacts } from "./boundaryReferences"
import { createFinalBoundaryReferences } from "./finalBoundaryReferences"
import { buildFinalImportYamlUpdate } from "./finalYamlUpdate"
import { collectFinalOwnerFactValues } from "./ownerFacts"
import { buildValidationOwnerMetadata } from "../validation/projectValidationPasses"
import { objectTargetForProjectFile } from "../validation/addressableMetadataTargets"
import { validationOwnerRef } from "../validation/dataPath/validationOwnerRef"
import { currentValidationRegistrySet } from "../validation/validationExecutionContext"
import type { ValidationRegistrySet } from "../validation/validationRegistrySet"
import { analyzeDependentYamlItem } from "@nkdk/runtime/rule-kit"
import { dependentPendingReference } from "../validation/yamlFactExtractor"
import { yamlDiagnosticLocationAtPath } from "../validation/yamlLocations"
import { collectAddressableBoundaryRequiredCheck } from "../validation/addressableRequired"
import { toDataPathPolicyInput } from "../validation/dataPath/policies"
import { currentOperationRegistrySet } from "../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry } from "../ruleRuntime/definition"
import {
  createProjectStateFileUpdateBatch,
  projectStateFieldEntries,
  projectStateOwnerFacts,
  projectStatePendingCheck,
  projectStateTargetEntry,
  type ProjectStateYamlFileUpdate,
} from "../projectState/fileUpdate"
import { createProjectStateOwnerMetadataCache } from "../validation/projectStateDependencyValidation"
import { createComposedProjectStateDependencyValidator, openProjectStateReadSession } from "../composition/projectState"
import { resolveProjectPath } from "../projectDefinition/path"
import { classifyMetadataProjectPath, projectStateFileBackedTargets } from "../projectDefinition/resources"
import type { ProjectStateImportFinalFileStateBatch, ProjectStateImportIndexContribution } from "../projectState/importSession"
import { createProjectStateFragmentWriter } from "../projectState/binary/fragment"
import {
  extractImportValidationContributionFromFacts,
  type ImportValidationContribution,
} from "./validationContribution"
import {
  ImportXmlInputError,
  prepareImportYamlFromDocuments,
  readImportXmlDocuments,
  resolveAssignmentRule,
  type PreparedImportYaml,
} from "./prepareYaml"
import {
  finalizeDeferredPropertyFacts,
  prepareImportFacts,
  type PreparedImportFacts,
} from "./prepareFacts"
import {
  propertyFactsWithReconstructionValues,
  type DirectImportPropertyFact,
} from "./propertyFacts"
import { baseFormProjectionSourceFromFacts } from "./baseFormProjectionFacts"
import { applyPropertyFactChanges } from "./propertyFactChanges"
import {
  prepareImportDependencies,
  type ImportDependencyFacts,
} from "./preparedDependencies"
import type {
  ImportAssignment,
  ImportControlCompositionEntry,
  ImportDiagnostic,
  ImportFirstPassResult,
  ImportIssueDecision,
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
import { createImportReconstructionFactsWriter } from "../projectState/binary/reconstructionFacts"
import type { MetadataWorkerOperationRegistry } from "../workerPool/operationRegistry"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { ClientApplicationFormYAML } from "../forms/clientApplicationForm/types"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import { equalClientApplicationBaseFormSourceProjections, createClientApplicationBaseFormProjectionSource } from "../forms/clientApplicationForm/baseFormProjection"
import { yamlBaseFormProjectionSource } from "../forms/clientApplicationForm/baseFormProjectionSource"
import { validateClientApplicationBaseFormDataPathOccurrences } from "../forms/clientApplicationForm/borrowedFormValidation"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
import { validateLocalImportSemantics, validateImportPendingChecks, validationIssueFromDiagnostic } from "./localValidation"
import {
  importedFormDataPathCompatibilityChangesFromOccurrences,
} from "../forms/clientApplicationForm/importDataPathCompatibility"
import { readPrimaryDataPath } from "../validation/dataPath/formYamlTraversal"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import {
  importedClientApplicationForm,
  clientApplicationFormYamlPath,
} from "../forms/clientApplicationForm/formDataPathMetadata"
import { clientApplicationFormDataPathProjection, inferClientApplicationFormTableDataPaths } from "../forms/clientApplicationForm/formDataPathProjection"
import { createFormDataPathIndexFromYAML } from "../validation/dataPath/formYamlIndex"
import { collectBoundaryFormDataPaths, collectFormDataPathOccurrencesFromFacts } from "./formDataPathOccurrences"
import { collectFormDataPathPreparationFromFacts, selectFormDataPathPreparationFacts } from "./formDataPathPreparation"
import { collectImportedFormDataPathChanges, prepareFormDataPathExportValue, prepareFormDataPathContext, prepareStandaloneFormDataPaths } from "../forms/clientApplicationForm/formDataPathContext"
import { createImportExportContext } from "./importExportContext"
import {
  portableFirstPassIssueDecision,
  normalizeImportedIssueDecisionPath,
  selectImportedIssueDecisionsForBoundary,
  selectReadyImportedIssueDecisions,
} from "./semanticBoundary"
import type { MetadataXmlPrepareComposition } from "../resourceTopology/adapters/capabilities"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { classifyImportedIssues } from "./classifyImportedIssues"
import type { ValidationIssueTarget } from "@nkdk/runtime"
import { currentRuleRegistrySet, type RuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { traverseMetadataRuleYaml } from "../validation/metadataRuleYamlTraversal"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"
import { createRegisteredMetadataRuleValidator, type MetadataRuleValidator } from "../validation/metadataRuleValidator"

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
    async (operation) => ({
      kind: "importResult",
      result: await runner.run(operation.command),
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
  baseConfigurationIndexDescriptor?: import("@nkdk/runtime").ConfigurationIndexStoreDescriptor
}

interface DeferredImportYaml {
  diagnosticAssignment: Pick<ImportAssignment, "targetProjectPath" | "xmlFiles">
  assignment: ImportAssignment
  targetProjectPath: string
  logicalAddress: string
  yaml: unknown
  annotations: XmlAnomalyAnnotations
  rule: PreparedImportYaml["rule"]
  ownerContext: PreparedImportYaml["ownerContext"]
  deferred: PreparedImportYaml["deferred"]
  dependentDeferred: PreparedImportYaml["dependentDeferred"]
  dependentOwner: PreparedImportYaml["dependentOwner"]
  validationFile: ValidationProjectFile
  configurationFragment: ConfigurationIndexBlockFragment
  baseFormCandidate?: NonNullable<PreparedImportYaml["baseFormCandidate"]> & {
    finalState?: { readonly index: ProjectStateImportIndexContribution; readonly final: ProjectStateImportFinalFileStateBatch }
  }
  localProofCompleted?: true
  earlyIssueDecisions: readonly ImportIssueDecision[]
  finalState: {
    readonly index: ProjectStateImportIndexContribution
    readonly final: ProjectStateImportFinalFileStateBatch
  }
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
  readonly baseConfigurationStore?: ReturnType<typeof openConfigurationIndexStore>
  readonly composition: MetadataXmlPrepareComposition
  readonly exportProfile?: XmlComponentExportProfile
  readonly metadataRuleValidator: MetadataRuleValidator
}

export interface ImportWorkerCommandRunner {
  readonly run: (
    command: ImportWorkerCommand,
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
  const preparedYaml = new Map<string, DeferredImportYaml>()
  const pendingAssignmentIds = new Set<string>()
  const dependencyFacts = new Map<string, {
    readonly configurationFragment: ConfigurationIndexBlockFragment
    readonly properties: ImportDependencyFacts
    readonly uniqueNameIssues?: PreparedImportFacts["uniqueNameIssues"]
    readonly baseFormProperties?: ImportDependencyFacts
    readonly formDataPathIndex: PreparedImportFacts["localIndexes"]["metadata"]["formDataPathIndex"]
    readonly formSemanticFacts?: readonly DirectImportPropertyFact[]
    readonly baseFormSemanticFacts?: readonly DirectImportPropertyFact[]
    readonly baseFormDataPathIndex?: PreparedImportFacts["baseFormDataPathIndex"]
    readonly deferred: PreparedImportFacts["deferred"]
    readonly baseFormDeferred?: NonNullable<PreparedImportFacts["baseFormDeferred"]>
    readonly validation: {
      readonly final: ProjectStateImportFinalFileStateBatch
      readonly pendingChecks: readonly ValidationPendingCheck[]
      readonly structuredDocuments: ProjectStateImportIndexContribution["structuredDocuments"]
    }
  }>()
  const assignedImports = new Map<string, ImportAssignment>()
  let activeSecondPass: ActiveSecondPass | undefined
  let firstPassAccumulator: FirstPassAccumulator | undefined
  let secondPassAccumulator: SecondPassAccumulator | undefined

interface FirstPassAccumulator {
  readonly diagnostics: ImportDiagnostic[]
  readonly files: ImportResultFile[]
  readonly reconstructionFacts: ReturnType<typeof createImportReconstructionFactsWriter>
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
): Promise<ImportWorkerCommandResult> {
  if (command.kind === "initialize") {
    await endSecondPass()
    preparedYaml.clear()
    pendingAssignmentIds.clear()
    dependencyFacts.clear()
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
      reconstructionFactsBuffer: result.reconstructionFactsBuffer,
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
          { items: pendingAssignmentIds.size },
        )
      }
      await processSecondPass(
        assignmentId,
        state,
        accumulator,
      )
    }
    checkpointPendingSecondPass(accumulator.profiler)
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
      throw new Error(`Второй проход XML-import не обработал ${unfinished} XML-заданий`)
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
): Promise<void> {
  const profiler = accumulator.profiler
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
    const inputs = await readImportXmlDocuments({ assignment, profiler, profilePass: "second" })
    pendingAssignmentIds.delete(assignmentId)
    const collector = createConfigurationIndexCollector()
    const ready = dependencyFacts.get(assignmentId)
    if (ready === undefined) throw new Error(`Не подготовлены зависимости задания ${assignmentId}`)
    const localValidation = profiler.measure(
      "Подготовка импорта конфигурации",
      "Локальная проверка зависимостей первого прохода",
      { items: 1 },
      () => classifyImportedIssues({
        issues: validateLocalImportSemantics({
          validator: createComposedProjectStateDependencyValidator(),
          ...ready.validation,
          pendingChecks: ready.validation.pendingChecks.filter(check => check.kind !== "dataPath"),
          projectDir: state.projectDir,
          queryPort: secondPass.readSession,
        }),
        requiresImportant: () => false,
      }),
    )
    if (localValidation.fatal.length > 0) {
      throw new Error(`Локальная проверка импорта завершилась внутренней ошибкой: ${localValidation.fatal.map(({ code }) => code).join(", ")}`)
    }
    const firstPassDecisions = localValidation.decisions
    const uniqueNameDecisions = classifyImportedIssues({
      issues: ready.uniqueNameIssues ?? [],
      requiresImportant: () => false,
    }).decisions
    const propertyStates = currentOperationRegistrySet<{ readonly propertyStates: PropertyStateCapabilityRegistry }>()?.propertyStates
    const importContext = secondPassExportContext({
      context: state.context,
      ownerMetadataCache: secondPass.ownerMetadataCache,
      targetProjectPath: assignment.targetProjectPath,
      warnings: accumulator.warnings,
    })
    if (ready.formDataPathIndex !== undefined) {
      importContext.importFromYAML = {
        ...importContext.importFromYAML,
        formDataPathIndex: ready.formDataPathIndex,
      }
    }
    const initialConfigurationBlocks = new Map([[assignment.targetProjectPath, ready.configurationFragment]])
    const initialConfigurationIndex = createLocalConfigurationIndexReader(initialConfigurationBlocks)
    const proofIndexCollector = createConfigurationIndexCollector()
    const controlContext = createImportExportContext(importContext, requireSecondPassExportProfile())
    const localRoundTripContext = {
      ...controlContext,
      exportToXML: {
        ...controlContext.exportToXML,
        configurationIndex: createConfigurationIndexExportRuntime({
          source: initialConfigurationIndex,
          collector: proofIndexCollector,
          targetProjectPath: assignment.targetProjectPath,
          logicalAddress: assignment.logicalAddress,
          ...(importContext.importFromYAML?.referenceRemap === undefined ? {} : {
            referencePathByCurrentPath: importContext.importFromYAML.referenceRemap.referencePathByCurrentPath,
          }),
        }),
      },
    }
    const execution = currentRuleRegistrySet<{ execution: import("@nkdk/runtime/rule-kit").CompiledPropertyRuleExecution }>()?.execution
    if (execution === undefined) throw new Error("Не задан общий исполнитель rules для локального proof")
    const assignmentRule = resolveAssignmentRule(
      assignment,
      state.context.fromXML.componentKind,
      state.topology,
    )
    const hasBaseFormCandidate = containsBaseFormCandidate(inputs)
    const currentConfigurationYAMLBeforeProof = shouldReadCurrentConfigurationYaml({
      componentPath: state.componentPath,
      rule: assignmentRule,
      hasBaseFormCandidate,
    })
      ? await readCurrentConfigurationFormYaml({
          logicalAddress: assignment.logicalAddress,
          fallbackProjectPath: assignment.targetProjectPath,
          role: assignment.role === "fileItem" ? "form" : "properties",
          rule: assignmentRule,
          owner: {
            dir: assignment.targetProjectPath.split("/", 1)[0] ?? "",
            name: assignment.owner?.name ?? assignment.itemName,
          },
          state,
        })
      : undefined
    const currentConfigurationFormValue = currentConfigurationYAMLBeforeProof === undefined
      ? undefined
      : importedClientApplicationForm({
          yaml: currentConfigurationYAMLBeforeProof.data,
          rule: assignmentRule,
        })?.yaml
    const currentConfigurationFormYAML = currentConfigurationFormValue === undefined
      ? undefined
      : clientApplicationFormYaml(currentConfigurationFormValue, assignment.targetProjectPath)
    const currentConfigurationForm = currentConfigurationFormYAML === undefined
      ? undefined : prepareStandaloneFormDataPaths({
          yaml: currentConfigurationFormYAML, ownerCache: secondPass.ownerMetadataCache,
        })
    const finalizedFormFacts = ready.formSemanticFacts === undefined
      ? undefined
      : finalizeDeferredPropertyFacts({
          facts: ready.formSemanticFacts,
          deferred: ready.deferred,
          rootRule: assignmentRule,
          context: importContext,
          formDataPathIndex: ready.formDataPathIndex,
          execution,
        })
    const formYamlPath = clientApplicationFormYamlPath(assignmentRule)
    const directFormContext = formYamlPath !== undefined
      && (!hasBaseFormCandidate || currentConfigurationFormYAML === undefined)
      && ready.formDataPathIndex !== undefined
    const compatibleFormFacts = finalizedFormFacts !== undefined && ready.formSemanticFacts !== undefined
      && ready.formDataPathIndex !== undefined
      ? prepareCompatibleFormFacts({
          facts: finalizedFormFacts, original: propertyFactsWithReconstructionValues(ready.formSemanticFacts),
          index: ready.formDataPathIndex, ownerCache: secondPass.ownerMetadataCache,
        })
      : finalizedFormFacts
    const baseFormDataPathIndex = ready.baseFormDataPathIndex
    const baseFormAttributeNames = new Set(baseFormDataPathIndex?.roots.keys())
    const finalizedBaseFormFacts = ready.baseFormSemanticFacts === undefined
      ? undefined
      : finalizeDeferredPropertyFacts({
          facts: ready.baseFormSemanticFacts,
          deferred: ready.baseFormDeferred ?? [],
          rootRule: ClientApplicationFormRules,
          context: importContext,
          formDataPathIndex: baseFormDataPathIndex,
          execution,
        })
    const compatibleBaseFormFacts = finalizedBaseFormFacts === undefined
      || ready.baseFormSemanticFacts === undefined
      ? undefined
      : baseFormDataPathIndex === undefined ? finalizedBaseFormFacts : prepareCompatibleFormFacts({
          facts: finalizedBaseFormFacts, original: propertyFactsWithReconstructionValues(ready.baseFormSemanticFacts),
          index: baseFormDataPathIndex, ownerCache: secondPass.ownerMetadataCache,
        })
    const basePreparation = compatibleBaseFormFacts === undefined || baseFormDataPathIndex === undefined
      ? undefined : collectFormDataPathPreparationFromFacts({ facts: compatibleBaseFormFacts, index: baseFormDataPathIndex })
    const directFormProofDataPathContext = directFormContext && compatibleFormFacts !== undefined
      ? prepareFormDataPathContext({
          preparation: collectFormDataPathPreparationFromFacts({
            facts: compatibleFormFacts, index: ready.formDataPathIndex!, yamlPathPrefix: formYamlPath,
          }),
          currentConfigurationForm,
          savedBaseElementNames: basePreparation?.collected.elementsByName.keys(),
          ownerCache: secondPass.ownerMetadataCache,
        })
      : undefined
    const savedBaseSource = compatibleBaseFormFacts === undefined || currentConfigurationFormYAML === undefined ? undefined
      : baseFormProjectionSourceFromFacts(basePreparation === undefined ? compatibleBaseFormFacts : finalizeProjectionFormFacts({
          facts: compatibleBaseFormFacts, preparation: basePreparation,
          currentConfigurationForm, ownerCache: secondPass.ownerMetadataCache,
        }).facts)
    const projectedFormFacts = compatibleFormFacts === undefined || directFormProofDataPathContext !== undefined
      || ready.formDataPathIndex === undefined
      ? undefined
      : finalizeProjectionFormFacts({
          facts: compatibleFormFacts,
          preparation: collectFormDataPathPreparationFromFacts({
            facts: compatibleFormFacts, index: ready.formDataPathIndex, yamlPathPrefix: formYamlPath,
          }),
          yamlPathPrefix: formYamlPath, currentConfigurationForm,
          savedBaseElementNames: basePreparation?.collected.elementsByName.keys(),
          ownerCache: secondPass.ownerMetadataCache,
        })
    const formProofDataPathContext = directFormProofDataPathContext ?? projectedFormFacts?.context
    if (formProofDataPathContext !== undefined && supportsMetadataItemImportedYamlFinalization(assignmentRule)) {
      for (const change of collectImportedFormDataPathChanges(formProofDataPathContext)) {
        ready.properties.finalProperties.set(
          [...(formYamlPath ?? []), ...change.yamlPath.slice(0, -1)],
          "dataPath",
          { present: change.kind === "set", value: change.kind === "set" ? change.value : undefined,
            ...(change.kind === "set" ? { appendToYaml: true } : {}) },
        )
      }
    }
    for (const element of formProofDataPathContext?.elementsByName.values() ?? []) {
      const path = [...(formYamlPath ?? []), ...element.yamlPath]
      const final = ready.properties.finalProperties.get(path, "dataPath")
      const exported = prepareFormDataPathExportValue(final === undefined ? element : {
        ...element, present: final.present, value: final.value,
      })
      if (exported !== undefined) ready.properties.exportProperties?.set(path, "dataPath", exported)
    }
    const formSource = compatibleFormFacts === undefined || directFormProofDataPathContext !== undefined || formYamlPath === undefined
      ? undefined
      : baseFormProjectionSourceFromFacts(projectedFormFacts?.facts ?? compatibleFormFacts, formYamlPath)
    const currentSource = currentConfigurationFormYAML === undefined
      ? undefined : yamlBaseFormProjectionSource(currentConfigurationFormYAML)
    const baseFormSource = currentSource !== undefined
      && formSource !== undefined
      && savedBaseSource !== undefined
      && equalClientApplicationBaseFormSourceProjections({
        leftBase: currentSource,
        extension: formSource,
        rightBase: savedBaseSource,
        rule: ClientApplicationFormRules,
      })
      ? "projected" as const
      : "saved" as const
    const baseFormProofSource = baseFormSource === "projected"
      ? createClientApplicationBaseFormProjectionSource({
          baseYaml: currentSource!,
          extensionYaml: formSource!,
          rule: ClientApplicationFormRules,
        })
      : undefined
    let earlyIssueDecisions: readonly ImportIssueDecision[] = []
    const finalBoundaryReferences = createFinalBoundaryReferences()
    const baseBoundaryReferences = createFinalBoundaryReferences()
    const pendingFirstPassDecisions = new Set(
      [
        ...firstPassDecisions.flatMap((decision) => portableFirstPassIssueDecision(decision) ?? []),
        ...uniqueNameDecisions,
      ],
    )
    const validationFile = state.projectFileProjector({
      projectPath: assignment.targetProjectPath,
      topologyAddress: assignment.topologyAddress,
    })
    if (validationFile === undefined) {
      throw new Error(`Не найден узел topology XML-import: ${assignment.topologyAddress.nodeId}`)
    }
    const borrowedExtensionFile = isBorrowedExtensionFile(validationFile)
    const imported = await prepareImportYamlFromDocuments({
      assignment,
      context: importContext,
      dependencies: prepareImportDependencies(ready.properties, {
        definedTypeLookup: (name) => {
          const result = secondPass.ownerMetadataCache.get({ kind: "ОпределяемыйТип", name })
          if (result.status === "ok") return { status: "ok", type: result.owner.facts.type }
          const reason = result.diagnostics.map(({ message }) => message).join("; ")
          return { status: "unresolved", reason: reason || `не найден определяемый тип ${name}` }
        },
      }, execution),
      ...(ready.baseFormProperties === undefined
        ? {}
        : { baseFormDependencies: prepareImportDependencies(ready.baseFormProperties, {}, execution) }),
      ...(formProofDataPathContext === undefined ? {} : { formProofDataPathContext }),
      ...(currentConfigurationFormYAML === undefined
        ? {}
        : { currentConfigurationFormYaml: currentConfigurationFormYAML }),
      baseFormSource,
      ...(baseFormProofSource === undefined ? {} : { baseFormProofSource }),
      collector,
      inputs,
      profiler,
      topology: state.topology,
      localRoundTrip: {
        attemptParticipant: finalBoundaryReferences,
        execution,
        context: localRoundTripContext,
        decisions: firstPassDecisions,
          placeCollectionItem: (parent, key, yamlPath, annotations, sourceYamlPath) => {
            finalBoundaryReferences.place(parent, key, sourceYamlPath)
            for (const decision of uniqueNameDecisions) {
              if (!sameYamlPath(decision.target.path, yamlPath)) continue
              annotations.set(parent, key, { kind: decision.kind, occurrence: 1, target: "value" })
              pendingFirstPassDecisions.delete(decision)
              earlyIssueDecisions = mergeImportedIssueDecisions([...earlyIssueDecisions, decision])
            }
          },
        baseFormAttemptParticipant: baseBoundaryReferences,
        placeBaseFormCollectionItem: (parent, key, _path, _annotations, sourceYamlPath) => baseBoundaryReferences.place(parent, key, sourceYamlPath),
        selectBaseFormDecisions: (yaml, rule, yamlPath, root, annotations, itemName, _context, namedYamlPath, _logicalAddress, namedCollectionItem) => {
          const localizedTextPaths: (readonly (string | number)[])[] = []
          const issues = secondPass.metadataRuleValidator.validateBoundary({
            name: itemName,
            yaml,
            rule,
            yamlPath,
            annotations,
            onLocalizedTextProperty: path => localizedTextPaths.push(path),
          })
          const formIndex = root ? createFormDataPathIndexFromYAML(yaml, clientApplicationFormDataPathProjection,
            baseBoundaryReferences.tabularElements(yaml, annotations)) : undefined
          const owner = { kind: validationFile.owner.dir, name: validationFile.owner.name }
          const checks = baseFormDataPathIndex === undefined ? [] : collectImportBoundaryFormChecks({
            execution, rule, yaml, yamlPath, annotations, owner,
            index: baseFormDataPathIndex, filePath: assignment.targetProjectPath,
          })
          baseBoundaryReferences.accept({ yaml, sourcePath: yamlPath, finalPath: namedYamlPath?.() ?? yamlPath,
            references: [], checks, localizedTextPaths,
            ...(formIndex === undefined ? {} : { formIndex, formOwner: owner }),
            ...(namedCollectionItem && itemName !== undefined && "enterpriseField" in rule && "enterpriseFieldType" in rule
              ? { formElement: { name: itemName, primaryDataPath: readPrimaryDataPath(yaml, rule) } } : {}),
            ...(clientApplicationFormDataPathProjection.tabularElementItemTypes.some(type => type === rule.itemType)
              && itemName !== undefined ? { table: { name: itemName, itemType: rule.itemType,
                primaryDataPath: { value: yaml["ПутьКДанным"] } },
                ...(typeof yaml["ПутьКДанным"] === "string" ? { tableDataPath: yaml["ПутьКДанным"] } : {}),
              } : {}),
          })
          const local = classifyImportedIssues({
            issues,
            requiresImportant: (target) => requiresImportantForImportedTarget(
              { yaml, rule },
              relativeValidationTarget(target, yamlPath),
            ),
          }).decisions.map((decision) => ({
            ...decision,
            target: relativeValidationTarget(decision.target, yamlPath),
          }))
          const baseDataPaths = classifyImportedIssues({
            issues: validateClientApplicationBaseFormDataPathOccurrences({
              attributes: baseFormAttributeNames,
              entries: checks.flatMap(check => check.kind === "dataPath"
                ? [{ componentKind: "dataPath", name: check.value, yamlPath: check.yamlPath }] : []),
              filePath: assignment.targetProjectPath,
            }).map(validationIssueFromDiagnostic),
            requiresImportant: target => requiresImportantForImportedTarget({ yaml, rule }, relativeValidationTarget(target, yamlPath)),
          }).decisions.map(decision => ({ ...decision, target: relativeValidationTarget(decision.target, yamlPath) }))
          return mergeImportedIssueDecisions([...local, ...baseDataPaths])
        },
        selectDecisions: (yaml, rule, yamlPath, root, annotations, itemName, boundaryContext, namedYamlPath, logicalAddressSegment, namedCollectionItem) => {
          const boundaryFirstPass = selectImportedIssueDecisionsForBoundary({
                data: yaml,
                yamlPath,
                decisions: [...pendingFirstPassDecisions]
                  .map((decision) => root ? normalizeImportedIssueDecisionPath(yaml, decision) : decision),
              })
          const localizedTextPaths: (readonly (string | number)[])[] = []
          const localIssues = secondPass.metadataRuleValidator.validateBoundary({
                deferRequired: borrowedExtensionFile && (root || rule.externalMetadata !== undefined),
                name: itemName,
                yaml,
                rule,
                yamlPath,
                annotations,
                onLocalizedTextProperty: path => localizedTextPaths.push(path),
              })
          const boundarySource = boundaryContext !== undefined && "fromXML" in boundaryContext
            ? boundaryContext.fromXML : importContext.fromXML
          const borrowedBoundary = typeof boundarySource === "object" && boundarySource !== null
            && "currentXMLDefaultVariant" in boundarySource && boundarySource.currentXMLDefaultVariant === "adopted"
          const referenceFacts = collectBoundaryReferenceFacts({
            context: boundaryContext ?? importContext, execution, rule, name: itemName,
            yaml, yamlPath, annotations, filePath: assignment.targetProjectPath,
            ...(borrowedBoundary ? { propertyStateCapability: propertyStates?.item(
              rule.itemType, importContext.fromXML.propertyStateCompatibilityMode,
            ) } : {}),
          })
          const dependentFacts = ready.properties.items.get(yamlPath, rule.itemType)
          const dependent = dependentFacts === undefined ? undefined : analyzeDependentYamlItem({
            itemType: rule.itemType, itemName, item: yaml, itemYamlPath: yamlPath,
            rootYaml: dependentFacts.root, rootRule: ready.properties.rule, owner: ready.properties.owner,
            filePath: assignment.targetProjectPath, parsed: parsedYamlFromKnownData("", yaml, annotations),
          })
          const references = [...referenceFacts.references, ...(dependent?.references ?? []).map(reference => ({
            ...dependentPendingReference(reference), filePath: assignment.targetProjectPath,
          }))]
          const addressSegment = root ? validationFile.metadataTarget?.canonical
            : rule.externalMetadata === undefined || itemName === undefined ? undefined
            : `${rule.externalMetadata.segment}.${itemName}`
          const required = !state.componentPath.startsWith("cfe/") || addressSegment === undefined ? undefined
            : collectAddressableBoundaryRequiredCheck({ yaml, rule, yamlPath, canonicalTarget: "",
              filePath: assignment.targetProjectPath, parsed: parsedYamlFromKnownData("", yaml, annotations) })
          const namedPath = namedYamlPath?.() ?? yamlPath
          const tables = root && validationFile.kind === "form" ? finalBoundaryReferences.tabularElements(yaml, annotations) : undefined
          if (tables !== undefined && validationFile.componentPath === "cf") inferClientApplicationFormTableDataPaths(yaml, tables)
          const formIndex = tables === undefined ? undefined : createFormDataPathIndexFromYAML(yaml, clientApplicationFormDataPathProjection, tables)
          const ownerFacts = root && validationFile.kind !== "form" ? collectFinalOwnerFactValues({ execution, rule, yaml, annotations }) : undefined
          const ownerMetadata = ownerFacts === undefined ? undefined : buildValidationOwnerMetadata({
            file: validationFile, facts: ownerFacts, runtime: currentValidationRegistrySet<ValidationRegistrySet>(),
            ref: validationOwnerRef({ fallback: { kind: validationFile.owner.dir, name: validationFile.owner.name },
              itemType: rule.itemType, objectTarget: objectTargetForProjectFile(validationFile),
            }),
          })
          const paths: ValidationPendingCheck[] = validationFile.kind !== "form" || ready.formDataPathIndex === undefined ? []
            : collectImportBoundaryFormChecks({ execution, rule, yaml, yamlPath, annotations,
              owner: { kind: validationFile.owner.dir, name: validationFile.owner.name },
              index: ready.formDataPathIndex, filePath: assignment.targetProjectPath,
            })
          const checks = [...paths, ...(required === undefined ? [] : [required]),
            ...(dependent?.projectChecks ?? []).map(check => ({ ...check, location: yamlDiagnosticLocationAtPath({
              filePath: assignment.targetProjectPath, parsed: parsedYamlFromKnownData("", yaml, annotations), path: check.yamlPath,
            }) }))]
          finalBoundaryReferences.accept({ yaml, sourcePath: yamlPath, finalPath: namedPath, references,
            addressSegment,
            ...(ownerFacts === undefined ? {} : { ownerFacts, ownerMetadata }),
            ...(formIndex === undefined ? {} : { formIndex, formOwner: { kind: validationFile.owner.dir, name: validationFile.owner.name } }),
            ...(validationFile.kind === "form" && namedCollectionItem && itemName !== undefined && "enterpriseField" in rule && "enterpriseFieldType" in rule
              ? { formElement: { name: itemName, primaryDataPath: readPrimaryDataPath(yaml, rule) } } : {}),
            localizedTextPaths,
            ...(validationFile.kind !== "form" && validationFile.kind !== "configuration"
              && validationFile.logicalAddress !== undefined && (root || logicalAddressSegment !== undefined)
              ? { logicalTarget: { segment: root ? validationFile.logicalAddress : logicalAddressSegment!, filePath: validationFile.projectPath } } : {}),
            ...(validationFile.kind !== "form" && validationFile.kind !== "configuration"
              && (root || rule.externalMetadata?.placement === "ownedEntry") && addressSegment !== undefined
              ? { objectTarget: { segment: addressSegment, filePath: validationFile.absolutePath,
                ...(typeof yaml["Тип"] === "string" ? { type: yaml["Тип"] } : {}),
              } } : {}),
            ...(clientApplicationFormDataPathProjection.tabularElementItemTypes.some(type => type === rule.itemType)
              && typeof yaml["ПутьКДанным"] === "string" ? { tableDataPath: yaml["ПутьКДанным"] } : {}),
            ...(clientApplicationFormDataPathProjection.tabularElementItemTypes.some(type => type === rule.itemType)
              && itemName !== undefined ? { table: { name: itemName, itemType: rule.itemType,
                primaryDataPath: { value: yaml["ПутьКДанным"] } } } : {}),
            checks,
          })
          const referenceIssues = [...referenceFacts.issues,
            ...validateImportPendingChecks(checks.map(check =>
              check.kind === "dataPath" && formProofDataPathContext !== undefined
                ? { ...check, index: formProofDataPathContext.localIndex } : check), secondPass.ownerMetadataCache)
              .filter(({ severity }) => severity === "error").map(validationIssueFromDiagnostic),
            ...(references.length === 0 ? [] :
            createComposedProjectStateDependencyValidator().validateReferences({
              checks: references.map((reference, index) => ({
                requestId: `local-boundary:${index}`, componentPath: state.componentPath, reference,
              })),
              projectDir: state.projectDir, queryPort: secondPass.readSession,
            }).diagnostics.filter(({ severity }) => severity === "error").map(validationIssueFromDiagnostic))]
          const referenceDecisions = classifyImportedIssues({
            issues: referenceIssues,
            requiresImportant: target => requiresImportantForImportedTarget({ yaml, rule }, relativeValidationTarget(target, yamlPath)),
          }).decisions
          const localGlobal = selectReadyImportedIssueDecisions({
            data: yaml,
            diagnostics: accumulator.warnings,
            confirmedDecisions: referenceDecisions,
            decisions: classifyImportedIssues({
              issues: [...localIssues, ...referenceIssues],
              requiresImportant: (target) => requiresImportantForImportedTarget(
                { yaml, rule },
                relativeValidationTarget(target, yamlPath),
              ),
            }).decisions,
          })
          const local = localGlobal.map((decision) => ({
            ...decision,
            target: relativeValidationTarget(decision.target, yamlPath),
          }))
          const readySources = new Set(selectReadyImportedIssueDecisions({
            data: yaml,
            decisions: boundaryFirstPass.map(({ local }) => local),
            diagnostics: accumulator.warnings,
            confirmedDecisions: referenceDecisions,
          }).map((decision) => validationIssueTargetKey(decision.target)))
          const selectedFirstPass = boundaryFirstPass.filter(({ local }) =>
            readySources.has(validationIssueTargetKey(local.target)))
          for (const { source } of selectedFirstPass) pendingFirstPassDecisions.delete(source)
          if (root) pendingFirstPassDecisions.clear()
          const firstPassDecisions = selectedFirstPass.map(({ local }) =>
            requiresImportantForImportedTarget({ yaml, rule }, local.target)
              ? { ...local, kind: "important" as const }
              : local)
          const readyDecisions = mergeImportedIssueDecisions([
            ...firstPassDecisions,
            ...local,
          ])
          earlyIssueDecisions = mergeImportedIssueDecisions([
            ...earlyIssueDecisions,
            ...selectedFirstPass.map(({ source }, index) => ({
              ...source,
              kind: firstPassDecisions[index]?.kind ?? source.kind,
            })),
            ...localGlobal,
          ])
          return readyDecisions
        },
        finalizeRootYaml: (yaml, _rule, annotations, _savedBaseYAML, importedBaseFormCandidate) => {
          if (baseFormSource === "projected" && importedBaseFormCandidate !== undefined) {
            const appended = appendProjectedBaseFormRawAnnotationsBeforeProof({
              candidate: importedBaseFormCandidate,
              yaml,
              annotations,
              currentYaml: currentConfigurationYAMLBeforeProof!.data,
              currentAnnotations: currentConfigurationYAMLBeforeProof!.annotations,
            })
            if (!appended) {
              throw new Error("Не удалось перенести локальные аномалии избыточной BaseForm")
            }
          }
          earlyIssueDecisions = mergeImportedIssueDecisions(
            earlyIssueDecisions.map((decision) => normalizeImportedIssueDecisionPath(yaml, decision)),
          )
        },
      },
    })
    const finalReferences = finalBoundaryReferences.finish(imported.yaml as Record<string, unknown>, imported.annotations)
    const finalState = splitImportYamlUpdate(buildFinalImportYamlUpdate({
        projectDir: state.projectDir, file: validationFile, context: state.context,
        yaml: imported.yaml, facts: finalReferences,
        localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
        fileBackedTargets: importFileBackedTargets(state, assignment.targetProjectPath),
      }), 0n)
    const finalBaseFormCandidate = imported.baseFormCandidate === undefined
      ? undefined
      : imported.baseFormCandidate.source === baseFormSource
        ? imported.baseFormCandidate
        : { ...imported.baseFormCandidate, source: baseFormSource }
    const baseFinalFacts = finalBaseFormCandidate === undefined ? undefined : baseBoundaryReferences.finish(
      finalBaseFormCandidate.yaml as Record<string, unknown>, finalBaseFormCandidate.annotations,
    )
    const baseValidationFile = finalBaseFormCandidate === undefined ? undefined : resolveValidationProjectFile(
      state.projectDir, finalBaseFormCandidate.targetProjectPath, state.validationComponent,
    )
    const baseFinalState = baseFinalFacts === undefined || baseValidationFile === undefined ? undefined
      : splitImportYamlUpdate(buildFinalImportYamlUpdate({
          projectDir: state.projectDir, file: baseValidationFile, context: state.context,
          yaml: finalBaseFormCandidate!.yaml, facts: baseFinalFacts, isolated: true,
          localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] }, fileBackedTargets: [],
        }), 0n)
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
      rule: imported.rule,
      ownerContext: imported.ownerContext,
      deferred: imported.deferred,
      dependentDeferred: imported.dependentDeferred,
      dependentOwner: imported.dependentOwner,
      earlyIssueDecisions,
      finalState,
      validationFile,
      configurationFragment: ready.configurationFragment,
      ...(finalBaseFormCandidate === undefined ? {} : { baseFormCandidate: { ...finalBaseFormCandidate, finalState: baseFinalState } }),
      ...(imported.localProofCompleted === true ? { localProofCompleted: true } : {}),
    }
    preparedYaml.set(assignmentId, prepared)
      const output = await prepareYamlForFinalPass(
        prepared,
        state,
        profiler,
      )
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
    pendingAssignmentIds.delete(assignmentId)
    dependencyFacts.delete(assignmentId)
  }

  profiler.record("Подготовка импорта конфигурации", "Формирование worker списка файлов результата импорта", {
    items: prepared === undefined ? 0 : 1,
    timeMs: 0,
  })
}

function appendProjectedBaseFormRawAnnotationsBeforeProof(params: {
  readonly candidate: NonNullable<PreparedImportYaml["baseFormCandidate"]>
  readonly yaml: unknown
  readonly annotations: import("@nkdk/runtime").XmlAnomalyAnnotationTable
  readonly currentYaml: unknown
  readonly currentAnnotations: XmlAnomalyAnnotations
}): boolean {
  if (!isYamlRecord(params.candidate.yaml) || !isYamlRecord(params.yaml) || !isYamlRecord(params.currentYaml)) {
    return false
  }
  const currentRoot = params.currentAnnotations.root()
  const candidateRoot = params.candidate.annotations.root()
  if (!isDeepStrictEqual(candidateRoot, currentRoot)) return false
  const basePaths = yamlObjectPaths(params.candidate.yaml)
  const entries = [...params.candidate.annotations.entries()]
  const portable = entries.filter(({ parent, key, annotation }) => {
    if (parent === undefined || key === undefined) return false
    const path = basePaths.get(parent)
    const currentParent = path === undefined ? undefined : yamlValueAtPath(params.currentYaml, path)
    const currentAnnotation = currentParent !== null && currentParent !== undefined && typeof currentParent === "object"
      ? annotation.target === "key" && typeof key === "string"
        ? params.currentAnnotations.keyAt(currentParent, key)
        : params.currentAnnotations.at(currentParent, key)
      : undefined
    return !isDeepStrictEqual(annotation, currentAnnotation)
  })
  if (portable.some(({ key, annotation }) =>
    typeof key !== "string"
    || annotation.kind !== "raw"
    || annotation.target !== "value"
    || annotation.xml === undefined
  )) return false

  const rawEntries: { path: string; xml: XmlRawValue }[] = []
  for (const { key, annotation } of portable) {
    if (typeof key !== "string" || annotation.xml === undefined) return false
    const annotatedKey = params.candidate.annotations.keyAt(params.candidate.yaml, key)?.logicalKey
    const logicalKey = typeof annotatedKey === "string" ? annotatedKey : key
    const relativePath = logicalKey === "@Form"
      ? ""
      : logicalKey.startsWith("@Form\\")
        ? logicalKey.slice("@Form\\".length)
        : logicalKey
    const path = relativePath.length === 0
      ? "@Form\\BaseForm"
      : `@Form\\BaseForm\\${relativePath}`
    rawEntries.push({ path, xml: structuredClone(annotation.xml) })
  }
  const coalesced = coalesceXmlRawPaths(rawEntries)
  if (coalesced === undefined) return false
  for (const { path, xml } of coalesced) {
    appendXmlAnnotatedMappingEntry<unknown>(params.yaml, params.annotations, {
      logicalKey: path,
      value: undefined,
      valueAnnotation: {
        kind: "raw",
        occurrence: 1,
        xml,
        hasSemanticValue: false,
      },
    })
  }
  return true
}

function coalesceXmlRawPaths(
  entries: readonly { readonly path: string; readonly xml: XmlRawValue }[],
): { path: string; xml: XmlRawValue }[] | undefined {
  const result: { path: string; xml: XmlRawValue }[] = []
  for (const entry of [...entries].sort((left, right) => rawPathDepth(left.path) - rawPathDepth(right.path))) {
    const ancestor = result
      .filter(({ path }) => entry.path.startsWith(`${path}\\`))
      .sort((left, right) => rawPathDepth(right.path) - rawPathDepth(left.path))[0]
    if (ancestor === undefined) {
      result.push({ ...entry })
      continue
    }
    const relative = entry.path.slice(ancestor.path.length + 1).split("\\")
    if (!mergeXmlRawDescendant(ancestor.xml, relative, entry.xml)) return undefined
  }
  return result
}

function rawPathDepth(path: string): number {
  return path.split("\\").length
}

function mergeXmlRawDescendant(
  root: XmlRawValue,
  path: readonly string[],
  value: XmlRawValue,
): boolean {
  if (!isYamlRecord(root) || path.length === 0) return false
  let parent: Record<string, unknown> = root
  for (const segment of path.slice(0, -1)) {
    const current = parent[segment]
    if (current === undefined) {
      const created: Record<string, unknown> = {}
      parent[segment] = created
      parent = created
    } else if (isYamlRecord(current)) {
      parent = current
    } else {
      return false
    }
  }
  const key = path.at(-1)!
  const current = parent[key]
  if (current !== undefined && !isDeepStrictEqual(current, value)) return false
  parent[key] = value
  return true
}

function isYamlRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function yamlObjectPaths(root: object): Map<object, readonly (string | number)[]> {
  const result = new Map<object, readonly (string | number)[]>()
  const visit = (value: unknown, path: readonly (string | number)[]): void => {
    if (value === null || typeof value !== "object" || result.has(value)) return
    result.set(value, path)
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, [...path, index]))
      return
    }
    for (const [key, child] of Object.entries(value)) visit(child, [...path, key])
  }
  visit(root, [])
  return result
}

function yamlValueAtPath(root: unknown, path: readonly (string | number)[]): unknown {
  let current = root
  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) return undefined
      current = current[segment]
      continue
    }
    if (!isYamlRecord(current)) return undefined
    current = current[segment]
  }
  return current
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

function checkpointPendingSecondPass(profiler: ValidationProfiler): void {
  if (!isImportMemoryProfilingEnabled()) return
  profiler.checkpoint(
    "Подготовка импорта конфигурации",
    "Задания, ожидающие второго прохода",
    { items: pendingAssignmentIds.size },
  )
}

function isImportMemoryProfilingEnabled(): boolean {
  return process.env["NKDK_PROFILE_MEMORY"] === "1"
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
    configurationFragments: accumulator.configurationFragments,
    ...finishImportPass(accumulator, flushProfile),
  }
}

function beginSecondPass(
  readToken: import("../projectState/contracts").ProjectStateReadToken,
  state: InitializedImportWorkerState,
  controlComposition?: readonly ImportControlCompositionEntry[],
  exportProfile?: XmlComponentExportProfile,
): void {
  if (activeSecondPass !== undefined) throw new Error("Второй проход XML-import worker уже начат")
  const readSession = openProjectStateReadSession(readToken)
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
    ...(baseConfigurationStore === undefined ? {} : { baseConfigurationStore }),
    composition: importControlComposition(
      controlComposition ?? [...assignedImports.values()].map(importControlCompositionEntry),
    ),
    metadataRuleValidator: createRegisteredMetadataRuleValidator({
      context: state.context,
      rules: requireCurrentRuleRegistrySet(),
    }),
    ...(exportProfile === undefined ? {} : { exportProfile }),
  }
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

function mergeImportedIssueDecisions(
  decisions: readonly ImportIssueDecision[],
): readonly ImportIssueDecision[] {
  const merged = new Map<string, { kind: ImportIssueDecision["kind"]; target: ValidationIssueTarget; codes: Set<string> }>()
  for (const decision of decisions) {
    const key = JSON.stringify(decision.target)
    const current = merged.get(key) ?? { kind: decision.kind, target: decision.target, codes: new Set<string>() }
    if (decision.kind === "important") current.kind = "important"
    for (const code of decision.issueCodes) current.codes.add(code)
    merged.set(key, current)
  }
  return [...merged.values()].map(({ kind, target, codes }) => ({
    kind,
    target,
    issueCodes: [...codes].sort(),
  }))
}

function sameYamlPath(left: readonly (string | number)[], right: readonly (string | number)[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function relativeValidationTarget(
  target: ValidationIssueTarget,
  prefix: readonly (string | number)[],
): ValidationIssueTarget {
  if (!sameYamlPath(target.path.slice(0, prefix.length), prefix)) {
    throw new Error(`Цель смысловой проверки находится вне текущей YAML-границы: ${validationIssueTargetKey(target)}`)
  }
  return { ...target, path: target.path.slice(prefix.length) }
}

function requireCurrentRuleRegistrySet(): RuleRegistrySet {
  const rules = currentRuleRegistrySet<RuleRegistrySet>()
  if (rules === undefined) throw new Error("Не задан execution context metadata rules")
  return rules
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
      localValidation: {
        ...update.localValidation,
        diagnostics: update.localValidation.diagnostics.filter((diagnostic) =>
          !taggedPaths.some((path) => sameYamlPath(
            path,
            validationIssuePathFromPointer(diagnostic.path ?? ""),
          )),
        ),
        schemaDiagnostics: update.localValidation.schemaDiagnostics.filter((diagnostic) =>
          !taggedPaths.some((path) => sameYamlPath(
            path,
            validationIssuePathFromPointer(diagnostic.path ?? ""),
          )),
        ),
      },
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
  return { updates, hashBytes: projectStateHashBytes(hash) }
}

async function endSecondPass(): Promise<void> {
  activeSecondPass?.readSession.close()
  await activeSecondPass?.baseConfigurationStore?.close()
  activeSecondPass = undefined
}

async function prepareYamlForFinalPass(
  prepared: DeferredImportYaml,
  state: InitializedImportWorkerState,
  profiler: ValidationProfiler,
): Promise<{
  main: PreparedSerializedYaml
  base?: PreparedSerializedYaml
  configurationFragments: ConfigurationIndexBlockFragment[]
}> {
  if (prepared.localProofCompleted === true && prepared.deferred.length > 0) {
    throw new Error(`Локальный proof оставил ${prepared.deferred.length} отложенных YAML-значений: ${prepared.targetProjectPath}`)
  }
  const preparedBaseFormCandidate = prepared.baseFormCandidate === undefined
    ? undefined
    : prepareBaseFormCandidate({
        candidate: prepared.baseFormCandidate,
      })
  const serialized = serializePreparedYaml(prepared.targetProjectPath, prepared.yaml, state, profiler, prepared.annotations)
  const validated = prepared.finalState
  const decisions = prepared.earlyIssueDecisions
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
      index: validated.index,
      final: decisions.length === 0
        ? withImportFinalHash(validated.final, serialized.localHash)
        : applyImportedDecisionsToFinalState(validated.final, decisions, serialized.localHash),
    },
    ...(baseForm === undefined ? {} : { base: baseForm }),
    configurationFragments: [prepared.configurationFragment,
      ...(baseFormConfigurationFragment === undefined ? [] : [baseFormConfigurationFragment])],
  }
}

function withImportFinalHash(
  final: ProjectStateImportFinalFileStateBatch,
  hash: bigint,
): ProjectStateImportFinalFileStateBatch {
  if (final.updates.length !== 1) {
    throw new Error("Окончательное состояние одного YAML должно содержать ровно одно обновление")
  }
  return { ...final, hashBytes: projectStateHashBytes(hash) }
}

function projectStateHashBytes(hash: bigint): Uint8Array {
  const hashBytes = new Uint8Array(8)
  new DataView(hashBytes.buffer).setBigUint64(0, hash, false)
  return hashBytes
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

function prepareBaseFormCandidate(params: {
  candidate: NonNullable<DeferredImportYaml["baseFormCandidate"]>
}): NonNullable<DeferredImportYaml["baseFormCandidate"]> | undefined {
  if (params.candidate.deferred.length > 0) {
    throw new Error(`Локальный proof основы оставил ${params.candidate.deferred.length} отложенных YAML-значений: ${params.candidate.targetProjectPath}`)
  }
  return params.candidate.source === "projected" ? undefined : params.candidate
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
  const validated = params.candidate.finalState
  if (validated === undefined) throw new Error(`Не собраны окончательные факты основы: ${params.candidate.targetProjectPath}`)
  return {
    serialized: retainWritableYaml(serialized),
    index: validated.index,
    final: withImportFinalHash(validated.final, serialized.localHash),
  }
}

function collectImportBoundaryFormChecks(params: Parameters<typeof collectBoundaryFormDataPaths>[0] & {
  readonly annotations: XmlAnomalyAnnotations
  readonly owner: { readonly kind: string; readonly name: string }
  readonly index: NonNullable<PreparedImportYaml["localIndexes"]["metadata"]["formDataPathIndex"]>
  readonly filePath: string
}): ValidationPendingCheck[] {
  return collectBoundaryFormDataPaths(params).map(occurrence => {
    const { rule: property, ...pathFact } = occurrence
    return { ...pathFact, kind: "dataPath", policy: "formDataPath", owner: params.owner, index: params.index,
      policyInput: toDataPathPolicyInput(property), location: yamlDiagnosticLocationAtPath({
        filePath: params.filePath, parsed: parsedYamlFromKnownData("", params.yaml, params.annotations), path: occurrence.yamlPath,
      }),
    }
  })
}

function prepareCompatibleFormFacts(params: {
  facts: readonly DirectImportPropertyFact[]
  original: readonly DirectImportPropertyFact[]
  index: NonNullable<PreparedImportFacts["localIndexes"]["metadata"]["formDataPathIndex"]>
  ownerCache: OwnerMetadataCache
}) {
  return applyPropertyFactChanges(params.facts, importedFormDataPathCompatibilityChangesFromOccurrences({
    finalizedOccurrences: collectFormDataPathOccurrencesFromFacts({ facts: params.facts, projection: clientApplicationFormDataPathProjection }),
    originalOccurrences: collectFormDataPathOccurrencesFromFacts({
      facts: params.original, projection: clientApplicationFormDataPathProjection,
    }),
    index: params.index, ownerCache: params.ownerCache,
  }).map(({ occurrence, value }) => ({ yamlPath: occurrence.yamlPath, kind: "set", value })))
}

function finalizeProjectionFormFacts(params: {
  facts: readonly DirectImportPropertyFact[]
  preparation: Parameters<typeof prepareFormDataPathContext>[0]["preparation"]
  currentConfigurationForm?: ReturnType<typeof prepareStandaloneFormDataPaths>
  savedBaseElementNames?: Iterable<string>
  yamlPathPrefix?: readonly (string | number)[]
  ownerCache: OwnerMetadataCache
}) {
  const context = prepareFormDataPathContext({
    preparation: params.preparation, currentConfigurationForm: params.currentConfigurationForm,
    savedBaseElementNames: params.savedBaseElementNames, ownerCache: params.ownerCache,
  })
  const changes = collectImportedFormDataPathChanges(context).map(change => ({
    ...change, yamlPath: [...(params.yamlPathPrefix ?? []), ...change.yamlPath],
  }))
  return {
    context,
    facts: prepareCompatibleFormFacts({
      facts: applyPropertyFactChanges(params.facts, changes), original: params.facts,
      index: params.preparation.index, ownerCache: params.ownerCache,
    }),
  }
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
}): XmlImportConfigurationContext {
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

function containsBaseFormCandidate(inputs: Awaited<ReturnType<typeof readImportXmlDocuments>>): boolean {
  return inputs.some(({ input, document }) => {
    if (input.role === "metadata") return false
    const forms = document.roots.filter(node => node.name === "Form")
    return forms.length === 1 && xmlElementChildren(forms[0]!, "BaseForm").length > 0
  })
}

async function processFirstPass(
  assignments: readonly ImportAssignment[],
  state: InitializedImportWorkerState,
  accumulator: FirstPassAccumulator,
): Promise<void> {
  const profiler = accumulator.profiler
  for (const assignment of assignments) {
    assignedImports.set(assignment.id, assignment)
    const collector = createConfigurationIndexCollector()
    let readyForSecondPass = false
    try {
      const inputs = await readImportXmlDocuments({ assignment, profiler, profilePass: "first" })
      const prepared = await prepareImportFacts({
        assignment,
        context: state.context,
        collector,
        inputs,
        profiler,
        topology: state.topology,
        execution: currentRuleRegistrySet<{ execution: import("@nkdk/runtime/rule-kit").CompiledPropertyRuleExecution }>()?.execution,
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
        const provisional = provisionalImportFinalContribution(prepared, validationContribution, state)
        accumulator.fragmentWriter.appendImportFinal({
          ...provisional,
          updates: provisional.updates.map(update => update.kind !== "yaml" ? update : {
            ...update, pendingReferences: [], pendingChecks: [],
          }),
        })
        pendingAssignmentIds.add(assignment.id)
        const needsBaseProjection = containsBaseFormCandidate(inputs) && shouldReadCurrentConfigurationYaml({
          componentPath: state.componentPath, rule: prepared.rule, hasBaseFormCandidate: true,
        })
        const retainFormFacts = (facts: readonly DirectImportPropertyFact[] | undefined) =>
          facts === undefined || needsBaseProjection || clientApplicationFormYamlPath(prepared.rule) === undefined
            ? facts : selectFormDataPathPreparationFacts(facts)
        const formSemanticFacts = retainFormFacts(prepared.formSemanticFacts)
        const baseFormSemanticFacts = retainFormFacts(prepared.baseFormSemanticFacts)
        const formFactPaths = new Set(formSemanticFacts?.map(fact => yamlPathToPointer(fact.yamlPath)))
        const baseFormFactPaths = new Set(baseFormSemanticFacts?.map(fact => yamlPathToPointer(fact.yamlPath)))
        dependencyFacts.set(assignment.id, {
          configurationFragment: fragment,
          properties: prepared.dependencies,
          ...(prepared.uniqueNameIssues === undefined ? {} : { uniqueNameIssues: prepared.uniqueNameIssues }),
          validation: {
            final: provisional,
            pendingChecks: prepared.pendingChecks.filter(({ kind }) => kind === "dataPath"),
            structuredDocuments: indexContribution.structuredDocuments,
          },
          ...(prepared.baseFormDependencies === undefined
            ? {}
            : { baseFormProperties: prepared.baseFormDependencies }),
          formDataPathIndex: prepared.localIndexes.metadata.formDataPathIndex,
          deferred: prepared.deferred.filter(value => formFactPaths.has(yamlPathToPointer(value.valuePath))),
          ...(formSemanticFacts === undefined
            ? {}
            : { formSemanticFacts }),
          ...(baseFormSemanticFacts === undefined
            ? {}
            : { baseFormSemanticFacts }),
          ...(prepared.baseFormDataPathIndex === undefined
            ? {}
            : { baseFormDataPathIndex: prepared.baseFormDataPathIndex }),
          ...(prepared.baseFormDeferred === undefined
            ? {}
            : { baseFormDeferred: prepared.baseFormDeferred.filter(value => baseFormFactPaths.has(yamlPathToPointer(value.valuePath))) }),
        })
        readyForSecondPass = true
        accumulator.files.push(...assignmentFiles)
      } catch (caught) {
        accumulator.diagnostics.push(importAssignmentDiagnostic(assignment, caught, "xml_import_yaml_failed"))
        continue
      }
      accumulator.reconstructionFacts.append(fragment)
    } catch (caught) {
      accumulator.diagnostics.push(importAssignmentDiagnostic(assignment, caught))
    } finally {
      if (!readyForSecondPass) {
        pendingAssignmentIds.delete(assignment.id)
      }
    }
  }

  profiler.record("Подготовка импорта конфигурации", "XML-задания, ожидающие второго прохода", {
    items: pendingAssignmentIds.size,
    timeMs: 0,
  })
}

function createFirstPassAccumulator(workerIndex: number, profiler = createImportWorkerProfiler(workerIndex)): FirstPassAccumulator {
  return {
    diagnostics: [],
    files: [],
    reconstructionFacts: createImportReconstructionFactsWriter(),
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
    reconstructionFactsBuffer: accumulator.reconstructionFacts.finish(),
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
    validationContextDependencies,
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
      updates: [{ ...identity, kind: "yaml", localValidation, pendingReferences, pendingChecks, dependencies,
        ...(validationContextDependencies === undefined ? {} : { validationContextDependencies }),
      }],
      hashBytes: batch.hashBytes,
    },
  }
}

function importIndexContribution(
  prepared: PreparedImportFacts,
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
    // Пути этого файла проверяет его воркер по локальному formDataPathIndex.
    // Полная проекция будет записана с окончательным состоянием YAML.
    forms: [],
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
  pendingAssignmentIds.clear()
  dependencyFacts.clear()
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
  }
}

function resetImportWorkerStateForTests(): void {
  const secondPass = activeSecondPass
  activeSecondPass = undefined
  secondPass?.readSession.close()
  void secondPass?.baseConfigurationStore?.close()
  clearWorkerState()
}


function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

return {
  run: runImportWorkerCommand,
  entryPoint: importWorkerEntryPoint,
  stateForTests: workerStateForTests,
  resetForTests: resetImportWorkerStateForTests,
}
}

export function createImportFirstPassTransferable(result: ImportFirstPassResult) {
  return {
    get [transferableSymbol]() {
      return [result.reconstructionFactsBuffer, ...Object.values(result.stateFragment?.buffers ?? {})]
    },
    get [valueSymbol]() {
      return result
    },
  }
}
