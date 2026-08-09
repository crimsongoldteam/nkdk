import { registerCoreMetadata } from "./metadata/register"
import type {} from "./metadata/forms/clientApplicationForm/context.types"
import type {} from "./metadata/fullSyncToXml/worker"
import type {} from "./metadata/importFromXml/worker"
import type {} from "./metadata/project/workerOperation.types"
import type {} from "./metadata/systemEnumerations/registry.types"
import type {} from "./metadata/workerPool/projectQueries"

registerCoreMetadata()

export { registerCoreMetadata } from "./metadata/register"
export {
  ProjectStateReadSessionClosedError,
  createProjectStateFileUpdateBatch,
  createDefaultProjectStateService as createProjectStateService,
  createProjectStateWriterHandle,
  ProjectStateWriterCancelledError,
  ProjectStateWriterClosedError,
  type ProjectStateFileIdentity,
  type ProjectStateFileUpdate,
  type ProjectStateFileUpdateBatch,
  type ProjectStateFileUpdateBatchEntry,
  type ProjectStateComponentProjection,
  type ProjectStateRefreshParams,
  type ProjectStateRefreshProfile,
  type ProjectStateRefreshResult,
  type ProjectStateRefreshStats,
  type ProjectStateReadSession,
  type ProjectStateReadSessionFactory,
  type ProjectStateReadToken,
  type ProjectStateStore,
  type ProjectStateService,
  type ProjectStateWriterHandle,
} from "./metadata/projectState"
export * from "./metadata/configurationIndex"
export { componentPath, type ComponentAddress } from "./metadata/components/address"
export { NKDK_CORE_VERSION } from "./version"
export {
  createXmlImportWorkerPoolHandle,
  importConfigurationFromXml,
  type ConfigurationImportResult,
  type ExternalFileTransfer,
  type ImportConfigurationFromXmlParams,
  type XmlImportWorkerPoolHandle,
} from "./metadata/importFromXml"
export { syncConfigurationFromXML } from "./metadata/appliedObjects/configuration/convertFromXML"
export type { ConfigurationSyncResult } from "./metadata/appliedObjects/configuration/convertFromXML"
export {
  planSyncConfigurationToXml as planSyncToXml,
  syncComponentToXml,
  syncConfigurationToXml as syncConfigurationToXML,
  type FullXmlSyncPlanResult,
  type FullXmlSyncResult,
  type PlanSyncConfigurationToXmlParams,
  type SyncComponentToXmlParams,
  type SyncConfigurationToXmlParams,
} from "./metadata/fullSyncToXml"
export {
  SYNC_STATE_FILE,
  diffSyncState,
  hashProjectFiles,
  initializeXmlSyncState,
  readXmlSyncState,
  writeXmlSyncState,
  type InitializeXmlSyncStateParams,
  type XmlSyncState,
  type XmlSyncStateDiff,
} from "./metadata/appliedObjects/configuration/syncState"
export {
  ADD_ACTION,
  DELETE_ACTION,
  applyPendingMigrationFiles,
  buildRenameTargetPath,
  collectStructuralStateFromXML,
  collectStructuralStateFromYAML,
  detectMigrationConflicts,
  listMigrationFileNames,
  nextMigrationFileName,
  readAppliedMigrationsState,
  readPendingMigrationEntries,
  validateAppliedMigrationTarget,
  writeAppliedMigrationsState,
  writeMigrationFile,
} from "./metadata/appliedObjects/configuration/migrations"
export type {
  MigrationConflict,
  MigrationEntry,
  StructuralState,
} from "./metadata/appliedObjects/configuration/migrations"
export {
  exportMetadataCatalogToJSONSchema,
  type MetadataCatalog,
  type MetadataCatalogXML,
  type MetadataCatalogYAML,
} from "./metadata/appliedObjects/metadataCatalog/index"
export { createEmptyClientApplicationForm } from "./metadata/forms/clientApplicationForm/createEmpty"
export { exportClientApplicationFormToEnterprise } from "./metadata/forms/clientApplicationForm/toEnterprise"
export { exportClientApplicationFormToJSONSchema } from "./metadata/forms/clientApplicationForm/toJSONSchema"
export type {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./metadata/forms/clientApplicationForm/types"
export type { FormMetadataXML } from "./metadata/forms/index"
export { xmlExport } from "./xml/export/exporter"
export { importContentFromXML } from "./xml/import/importer"
export { exportToYAML } from "./yaml/export"
export { importFromYAML } from "./yaml/import"
export { parseWithJsYaml } from "./yaml/jsYamlParser"
export type { JsParsedYaml, JsYamlSyntaxError } from "./yaml/jsYamlParser"
export { buildYamlLocationIndex } from "./yaml/locationIndex"
export type { YamlLocationIndex, YamlPath, YamlPosition } from "./yaml/locationIndex"
export { parseMetadataYaml } from "./yaml/parseMetadataYaml"
export type { ParsedYaml } from "./yaml/parseMetadataYaml"
export type {
  Diagnostic,
  DiagnosticSource,
  DiagnosticSeverity,
  MetadataDiagnostic,
} from "./metadata/validation/types"
export {
  createDiagnosticBatchWriter,
  openDiagnosticBatch,
  type DiagnosticBatchView,
  type DiagnosticBatchWriter,
  type EncodedDiagnosticBatch,
} from "./metadata/diagnostics/binaryBatch"
export {
  createMetadataDiagnosticCollection,
  type MetadataDiagnosticCollection,
} from "./metadata/diagnostics/collection"
export {
  validateProject,
  type ValidateProjectParams,
  type ValidateProjectResult,
} from "./metadata/validation/validateProject"
export { validateForm, type ValidateFormParams } from "./metadata/validation/validateForm"
export {
  createValidationProfileResult,
  type ValidationProfileResult,
} from "./metadata/validation/profile"
export {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  ProjectFileSchemaError,
  type ExportJSONSchemaForProjectFileParams,
  type ExportJSONSchemaForSchemaNameParams,
} from "./metadata/validation/projectFileSchema"
export * from "./metadata/operations"
export {
  describeMetadataProjectDirectoryStructure,
  type DescribeMetadataProjectDirectoryStructureParams,
  type MetadataProjectDirectoryStructure,
  type MetadataProjectStructureNode,
} from "./metadata/project/directoryStructure"
export {
  parseProjectPath,
  projectPathFromFileSystem,
  resolveProjectPath,
  type ProjectPathOptions,
} from "./metadata/project/path"
export {
  describeMetadataRuleOperationTargets,
  type MetadataRuleOperationTargetDescriptor,
} from "./metadata/project"
export {
  configurationMetadataProjectSpec,
  getMetadataProjectSpecByDir,
  metadataProjectSpecByDir,
  metadataProjectSpecs,
  type MetadataProjectSpec,
} from "./metadata/project/specs"
export {
  assertMetadataProjectPathInside,
  classifyMetadataProjectPath,
  discoverMetadataProjectResources,
  resolveMetadataProjectResource,
  type MetadataProjectConfigurationYamlRef,
  type MetadataProjectFormYamlRef,
  type MetadataProjectNestingSegment,
  type MetadataProjectPropertiesYamlRef,
  type MetadataProjectResourceKind,
  type MetadataProjectResourceOwner,
  type MetadataProjectResourceRef,
  type MetadataProjectYamlRole,
} from "./metadata/project/resources"
export {
  listSchemaSummaryKeys,
  summarizeJSONSchema,
  splitSearchTerms,
  type SchemaFieldSummary,
  type SchemaSummary,
  type SchemaSummaryOptions,
} from "./metadata/validation/schemaSummary"
export { exportMetadataDocumentToJSONSchema } from "./metadata/appliedObjects/metadataDocument/toJSONSchema"
export { exportMetadataEnumerationToJSONSchema } from "./metadata/appliedObjects/metadataEnumeration/toJSONSchema"
