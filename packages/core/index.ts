import { registerCoreMetadata } from "./metadata/register"

registerCoreMetadata()

export { registerCoreMetadata } from "./metadata/register"
export { syncConfigurationFromXML } from "./metadata/appliedObjects/configuration/convertFromXML"
export type { ConfigurationSyncResult } from "./metadata/appliedObjects/configuration/convertFromXML"
export { syncConfigurationToXML } from "./metadata/appliedObjects/configuration/syncToXML"
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
export { shortRoundTripXML } from "./metadata/appliedObjects/configuration/shortRoundTripXML"
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
export type { MigrationConflict, MigrationEntry, StructuralState } from "./metadata/appliedObjects/configuration/migrations"
export {
  exportMetadataCatalogToJSONSchema,
  exportMetadataCatalogToYAML,
  importMetadataCatalogFromYAML,
  type MetadataCatalog,
  type MetadataCatalogXML,
  type MetadataCatalogYAML,
} from "./metadata/appliedObjects/metadataCatalog/index"
export { createEmptyClientApplicationForm } from "./metadata/forms/clientApplicationForm/createEmpty"
export { importClientApplicationFormFromXML } from "./metadata/forms/clientApplicationForm/fromXML"
export { importClientApplicationFormFromYAML } from "./metadata/forms/clientApplicationForm/fromYAML"
export { exportClientApplicationFormToEnterprise } from "./metadata/forms/clientApplicationForm/toEnterprise"
export { exportClientApplicationFormToJSONSchema } from "./metadata/forms/clientApplicationForm/toJSONSchema"
export { exportClientApplicationFormToXML } from "./metadata/forms/clientApplicationForm/toXML"
export { exportClientApplicationFormToYAML } from "./metadata/forms/clientApplicationForm/toYAML"
export type {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./metadata/forms/clientApplicationForm/types"
export { exportFormMetadataToXML } from "./metadata/forms/index"
export type { FormMetadataXML } from "./metadata/forms/index"
export { xmlExport } from "./xml/export/exporter"
export { importContentFromXML } from "./xml/import/importer"
export { exportToYAML } from "./yaml/export"
export { importFromYAML } from "./yaml/import"
export { parseMetadataYaml } from "./yaml/parseMetadataYaml"
export type { ParsedYaml } from "./yaml/parseMetadataYaml"
export { importMetadataEnumerationFromYAML } from "./metadata/appliedObjects/metadataEnumeration/fromYAML"
export type { Diagnostic, DiagnosticSource, DiagnosticSeverity, MetadataKind } from "./metadata/validation/types"
export {
  validateProject,
  type ValidateProjectParams,
  type ValidateProjectResult,
} from "./metadata/validation/validateProject"
export { validateParsedFile } from "./metadata/validation/validateFile"
export { validateForm, type ValidateFormParams } from "./metadata/validation/validateForm"
export {
  exportJSONSchemaForProjectFile,
  exportJSONSchemaForSchemaName,
  ProjectFileSchemaError,
  type ExportJSONSchemaForProjectFileParams,
  type ExportJSONSchemaForSchemaNameParams,
} from "./metadata/validation/projectFileSchema"
export {
  describeMetadataProjectDirectoryStructure,
  type DescribeMetadataProjectDirectoryStructureParams,
  type MetadataProjectDirectoryStructure,
  type MetadataProjectStructureNode,
} from "./metadata/project/directoryStructure"
export {
  describeMetadataRuleResources,
  type MetadataProjectAssetDescriptor,
  type MetadataProjectConfigurationYamlDescriptor,
  type MetadataProjectDynamicDescriptor,
  type MetadataProjectExternalXmlBaseDescriptor,
  type MetadataProjectExternalXmlDescriptor,
  type MetadataProjectExternalXmlPathDescriptor,
  type MetadataProjectObjectXmlDescriptor,
  type MetadataProjectPropertiesYamlDescriptor,
  type MetadataProjectResourceDescriptor,
  type MetadataProjectXmlDescriptor,
  type MetadataProjectYamlDescriptor,
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
