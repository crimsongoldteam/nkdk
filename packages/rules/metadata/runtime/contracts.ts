import type { OperationRegistrySet, RulesSynchronizationContribution } from "../operations/operationRegistrySet"
import type { ValidateProjectParams, ValidateProjectResult } from "../project/validateProject"
import type {
  CreateProjectStateServiceOptions,
  ProjectStateService,
} from "../projectState/service"
import type { MetadataRulesDefinition } from "../ruleRuntime/definition"
import type { RuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import type { ValidationRegistrySet } from "../validation/validationRegistrySet"
import type { ProjectReferenceContribution } from "../validation/projectReferenceIndexRegistry"
import type { DataPathContribution } from "../validation/dataPath/registry"
import type { parseProjectPath } from "../projectDefinition/path"
import type { describeMetadataProjectDirectoryStructure } from "../project/directoryStructure"
import type {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  ProjectFileSchemaError,
} from "../validation/projectFileSchema"
import type {
  listSchemaSummaryKeys,
  splitSearchTerms,
  summarizeJSONSchema,
} from "../validation/schemaSummary"
import type {
  ConfigurationImportResult,
  ImportConfigurationFromXmlParams,
} from "../importFromXml"
import type { syncConfigurationFromXML } from "../appliedObjects/configuration/convertFromXML"
import type {
  planSyncConfigurationToXml,
  syncConfigurationToXml,
} from "../fullSyncToXml/syncConfiguration"
import type {
  initializeXmlSyncState,
  readXmlSyncState,
} from "../appliedObjects/configuration/syncState"
import type { renameMetadataItem } from "../operations/renameItem"
import type { findMetadataReferences } from "../operations/findMetadataReferences"
import type { MetadataWorkerPoolHandle } from "../workerPool/types"
import type {
  finalizePartialXmlSyncPackage,
  markPartialSyncApplied,
  markPartialSyncPreparedAfterRejection,
  markPartialSyncTransferring,
  preparePartialXmlSyncPackage,
  readPendingPartialXmlSync,
} from "../partialSyncToXml"

export interface MetadataWorkerManifest {
  readonly preparedYamlProject: URL
  readonly importFromXml: URL
  readonly fullSyncToXml: URL
  readonly generic: URL
}

export interface CreateMetadataRuntimeOptions {
  readonly rules: MetadataRulesDefinition<RulesSynchronizationContribution, ProjectReferenceContribution, DataPathContribution>
  readonly workers: MetadataWorkerManifest
  readonly createWorkerPool?: (workerUrl: URL) => MetadataWorkerPoolHandle
  readonly createProjectStateService: (
    options: CreateProjectStateServiceOptions,
    rules: RuleRegistrySet,
  ) => ProjectStateService
}

export interface MetadataRuntime {
  readonly projects: {
    createState(): ProjectStateService
    readonly specs: RuleRegistrySet["projectSpecs"]
    readonly parsePath: typeof parseProjectPath
    readonly describeStructure: typeof describeMetadataProjectDirectoryStructure
  }
  readonly schemas: RuleRegistrySet["schemas"] & {
    readonly ProjectFileSchemaError: typeof ProjectFileSchemaError
    readonly exportForProjectFile: typeof exportJSONSchemaForProjectFile
    readonly exportByName: typeof exportJSONSchemaForSchemaName
    readonly splitSearchTerms: typeof splitSearchTerms
    readonly listSummaryKeys: typeof listSchemaSummaryKeys
    readonly summarize: typeof summarizeJSONSchema
  }
  readonly validation: ValidationRegistrySet & {
    validateProject(
      params: Omit<ValidateProjectParams, "projectState"> & {
        readonly projectState: ProjectStateService
      },
    ): Promise<ValidateProjectResult>
  }
  readonly import: {
    configurationFromXml(
      params: Omit<ImportConfigurationFromXmlParams, "projectState"> & {
        readonly projectState: ProjectStateService
      },
    ): Promise<ConfigurationImportResult>
    readonly configurationFromSourceXml: typeof syncConfigurationFromXML
  }
  readonly sync: {
    readonly planToXml: typeof planSyncConfigurationToXml
    readonly configurationToXml: typeof syncConfigurationToXml
    readonly readState: typeof readXmlSyncState
    readonly initializeState: typeof initializeXmlSyncState
    readonly partial: {
      readonly prepare: typeof preparePartialXmlSyncPackage
      readonly readPending: typeof readPendingPartialXmlSync
      readonly markTransferring: typeof markPartialSyncTransferring
      readonly markPreparedAfterRejection: typeof markPartialSyncPreparedAfterRejection
      readonly markApplied: typeof markPartialSyncApplied
      readonly finalize: typeof finalizePartialXmlSyncPackage
    }
  }
  readonly metadata: {
    readonly rules: RuleRegistrySet
    readonly operations: OperationRegistrySet
    readonly rename: typeof renameMetadataItem
    readonly findReferences: typeof findMetadataReferences
  }
  close(): Promise<void>
}
