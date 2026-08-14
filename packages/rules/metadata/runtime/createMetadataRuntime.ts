import { withOperationRegistrySet } from "../operations/operationExecutionContext"
import { createOperationRegistrySet } from "../operations/operationRegistrySet"
import { validateProject } from "../project/validateProject"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import {
  createRuleSchemaRuntime,
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { withValidationRegistrySet } from "../validation/validationExecutionContext"
import { createValidationRegistrySet } from "../validation/validationRegistrySet"
import type {
  CreateMetadataRuntimeOptions,
  MetadataRuntime,
} from "./contracts"
import { parseProjectPath } from "../projectDefinition/path"
import { describeMetadataProjectDirectoryStructure } from "../project/directoryStructure"
import {
  exportJSONSchemaForProjectFile,
  ProjectFileSchemaError,
} from "../validation/projectFileSchema"
import {
  listSchemaSummaryKeys,
  splitSearchTerms,
  summarizeJSONSchema,
} from "../validation/schemaSummary"
import {
  createImportCoordinatorDependencies,
  importConfigurationFromXml,
} from "../importFromXml/importConfiguration"
import { syncConfigurationFromXML } from "../appliedObjects/configuration/convertFromXML"
import {
  planSyncConfigurationToXml,
  syncConfigurationToXml,
  createFullXmlSyncCoordinatorDependencies,
} from "../fullSyncToXml/syncConfiguration"
import {
  initializeXmlSyncState,
  readXmlSyncState,
} from "../appliedObjects/configuration/syncState"
import { renameMetadataItem } from "../operations/renameItem"
import { findMetadataReferences } from "../operations/findMetadataReferences"
import type { ProjectStateService } from "../projectState/service"
import { createMetadataWorkerPoolHandle } from "../workerPool/handle"
import { discoverProjectStateValidationFileBatches } from "../projectState/projectFiles"
import { createPropertyStateCapabilityRegistry } from "../appliedObjects/configurationExtension/propertyStateCapabilities"
import {
  finalizePartialXmlSyncPackage,
  forceClearPendingPartialXmlSync,
  markPartialSyncApplied,
  markPartialSyncPreparedAfterRejection,
  markPartialSyncTransferring,
  preparePartialXmlSyncPackage,
  readPendingPartialXmlSync,
} from "../partialSyncToXml"

export function createMetadataRuntime(
  options: CreateMetadataRuntimeOptions,
): MetadataRuntime {
  const rules = createRuleRegistrySet(options.rules)
  const propertyStates = createPropertyStateCapabilityRegistry(options.rules.propertyStateCapabilities)
  const validation = createValidationRegistrySet(options.rules, rules, propertyStates)
  const operations = createOperationRegistrySet(options.rules, propertyStates)
  const executionRegistries = { rules, validation, operations }
  const withExecutionRegistries = <Result>(execute: () => Result): Result =>
    withRuleRegistrySet(executionRegistries.rules, () =>
      withPropertyRuleRegistrySet(executionRegistries.rules.property, () =>
        withValidationRegistrySet(executionRegistries.validation, () =>
          withOperationRegistrySet(executionRegistries.operations, execute))))
  const syncDependencies = createFullXmlSyncCoordinatorDependencies(
    operations.synchronization.resolve,
  )
  const importDependencies = createImportCoordinatorDependencies(
    operations.imports.resolve,
  )
  const schemaRuntime = createRuleSchemaRuntime(
    rules,
    (name, availableNames) => new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${availableNames.join(", ")}`,
    ),
  )
  const createWorkerPool = options.createWorkerPool
    ?? ((workerUrl: URL) => createMetadataWorkerPoolHandle({ workerUrl }))
  const ownedStates = new WeakSet<object>()
  const openStates = new Set<ProjectStateService>()
  let closed = false
  let closePromise: Promise<void> | undefined

  const assertOpen = () => {
    if (closed) throw new Error("Metadata runtime закрыт")
  }
  const assertOwnedState = (state: ProjectStateService) => {
    assertOpen()
    if (!ownedStates.has(state)) {
      throw new Error("ProjectStateService принадлежит другому runtime")
    }
  }

  return {
    projects: {
      specs: rules.projectSpecs,
      parsePath: parseProjectPath,
      describeStructure: (params) =>
        describeMetadataProjectDirectoryStructure(params, rules),
      createState() {
        assertOpen()
        const state = options.createProjectStateService({
          workerPool: createWorkerPool(options.workers.generic),
          discoverFiles: ({ projectDir }) =>
            discoverProjectStateValidationFileBatches(projectDir, undefined, rules),
        }, rules)
        ownedStates.add(state)
        openStates.add(state)
        return state
      },
    },
    schemas: {
      ...rules.schemas,
      ProjectFileSchemaError,
      exportForProjectFile: (params) => exportJSONSchemaForProjectFile(params, {
        rules,
        schemas: schemaRuntime,
      }),
      exportByName: schemaRuntime.exportByName,
      splitSearchTerms,
      listSummaryKeys: listSchemaSummaryKeys,
      summarize: summarizeJSONSchema,
    },
    validation: {
      ...validation,
      async validateProject(params) {
        assertOwnedState(params.projectState)
        return withExecutionRegistries(() => validateProject(params))
      },
    },
    import: {
      async configurationFromXml(params) {
        assertOwnedState(params.projectState)
        return withExecutionRegistries(() =>
          importConfigurationFromXml(params, importDependencies))
      },
      configurationFromSourceXml: (params) =>
        withExecutionRegistries(() => syncConfigurationFromXML(params)),
    },
    sync: {
      async planToXml(params) {
        assertOwnedState(params.projectState)
        return withExecutionRegistries(() =>
          planSyncConfigurationToXml(params, syncDependencies))
      },
      async configurationToXml(params) {
        assertOwnedState(params.projectState)
        return withExecutionRegistries(() =>
          syncConfigurationToXml(params, syncDependencies))
      },
      readState: readXmlSyncState,
      initializeState: initializeXmlSyncState,
      partial: {
        async prepare(params) {
          assertOwnedState(params.projectState)
          return withExecutionRegistries(() => preparePartialXmlSyncPackage(params))
        },
        readPending: readPendingPartialXmlSync,
        markTransferring: markPartialSyncTransferring,
        markPreparedAfterRejection: markPartialSyncPreparedAfterRejection,
        markApplied: markPartialSyncApplied,
        finalize: finalizePartialXmlSyncPackage,
        forceClear: forceClearPendingPartialXmlSync,
      },
    },
    metadata: {
      rules,
      operations,
      async rename(params) {
        assertOwnedState(params.projectState)
        return withExecutionRegistries(() => renameMetadataItem(params, rules))
      },
      async findReferences(params) {
        assertOwnedState(params.projectState)
        return withExecutionRegistries(() => findMetadataReferences(params, rules))
      },
    },
    close() {
      if (closePromise !== undefined) return closePromise
      closed = true
      closePromise = Promise.all([...openStates].map((state) => state.close())).then(
        () => {
          openStates.clear()
        },
      )
      return closePromise
    },
  }
}
