import { createOperationRegistrySet } from "../operations/operationRegistrySet"
import { validateProject } from "../project/validateProject"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { createRuleSchemaRuntime } from "@nkdk/runtime/rule-kit"
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
import { importConfigurationFromXml } from "../importFromXml/importConfiguration"
import { syncConfigurationFromXML } from "../appliedObjects/configuration/convertFromXML"
import {
  planSyncConfigurationToXml,
  syncConfigurationToXml,
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

export function createMetadataRuntime(
  options: CreateMetadataRuntimeOptions,
): MetadataRuntime {
  const rules = createRuleRegistrySet(options.rules)
  const validation = createValidationRegistrySet(options.rules)
  const operations = createOperationRegistrySet(options.rules)
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
      exportForProjectFile: exportJSONSchemaForProjectFile,
      exportByName: schemaRuntime.exportByName,
      splitSearchTerms,
      listSummaryKeys: listSchemaSummaryKeys,
      summarize: summarizeJSONSchema,
    },
    validation: {
      ...validation,
      async validateProject(params) {
        assertOwnedState(params.projectState)
        return validateProject(params)
      },
    },
    import: {
      async configurationFromXml(params) {
        assertOwnedState(params.projectState)
        return importConfigurationFromXml(params)
      },
      configurationFromSourceXml: syncConfigurationFromXML,
    },
    sync: {
      async planToXml(params) {
        assertOwnedState(params.projectState)
        return planSyncConfigurationToXml(params)
      },
      async configurationToXml(params) {
        assertOwnedState(params.projectState)
        return syncConfigurationToXml(params)
      },
      readState: readXmlSyncState,
      initializeState: initializeXmlSyncState,
    },
    metadata: {
      rules,
      operations,
      async rename(params) {
        assertOwnedState(params.projectState)
        return renameMetadataItem(params)
      },
      async findReferences(params) {
        assertOwnedState(params.projectState)
        return findMetadataReferences(params)
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
