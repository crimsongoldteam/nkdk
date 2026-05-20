export { syncConfigurationFromXML } from "./metadata/appliedObjects/configuration/convertFromXML"
export type { ConfigurationSyncResult } from "./metadata/appliedObjects/configuration/convertFromXML"
export { syncConfigurationToXML } from "./metadata/appliedObjects/configuration/syncToXML"
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
export { importClientApplicationFromFromNKDK } from "./metadata/forms/clientApplicationForm/fromNKDK"
export { importClientApplicationFormFromXML } from "./metadata/forms/clientApplicationForm/fromXML"
export { importClientApplicationFormFromYAML } from "./metadata/forms/clientApplicationForm/fromYAML"
export { exportClientApplicationFormToEnterprise } from "./metadata/forms/clientApplicationForm/toEnterprise"
export { exportClientApplicationFormToJSONSchema } from "./metadata/forms/clientApplicationForm/toJSONSchema"
export { exportClientApplicationFormToNKDK as exportClientApplicationFormToStructure } from "./metadata/forms/clientApplicationForm/toNKDK"
export { exportClientApplicationFormToXML } from "./metadata/forms/clientApplicationForm/toXML"
export { exportClientApplicationFormToYAML } from "./metadata/forms/clientApplicationForm/toYAML"
export type {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./metadata/forms/clientApplicationForm/types"
export { exportFormMetadataToXML, importChildItemsFromNKDK } from "./metadata/forms/index"
export type { FormMetadataXML } from "./metadata/forms/index"
export { xmlExport } from "./xml/export/exporter"
export { importContentFromXML } from "./xml/import/importer"
export { exportToYAML } from "./yaml/export"
export { importFromYAML } from "./yaml/import"
export { parseMetadataYaml } from "./yaml/parseMetadataYaml"
export type { ParsedYaml } from "./yaml/parseMetadataYaml"
export { importMetadataEnumerationFromYAML } from "./metadata/appliedObjects/metadataEnumeration/fromYAML"
export { getCatalogPropertyReferenceScope } from "./metadata/appliedObjects/metadataCatalog/rules"
export { getDocumentPropertyReferenceScope } from "./metadata/appliedObjects/metadataDocument/rules"
export { getEnumerationPropertyReferenceScope } from "./metadata/appliedObjects/metadataEnumeration/rules"
export type { ReferenceScope } from "./metadata/orchestration/property/types"
export {
  importMetadataFileWithGraph,
  type ImportMetadataFileResult,
} from "./metadata/orchestration/importMetadataFileWithGraph"
export { buildGraph, buildGraphForChangedFile } from "./metadata/graphImport/buildGraph"
export {
  discoverProjectGraphFiles,
  isSupportedProjectGraphFile,
} from "./metadata/graphImport/projectFiles"
export type {
  BuildGraphForChangedFileParams,
  FileGraphData,
  FileStats,
  ImportContext,
  ProjectGraphInput,
  ProjectGraphSource,
} from "./metadata/orchestration/buildGraph"
export type { Diagnostic, DiagnosticSource, DiagnosticSeverity, MetadataKind } from "./metadata/validation/types"
export { exportMetadataDocumentToJSONSchema } from "./metadata/appliedObjects/metadataDocument/toJSONSchema"
export { exportMetadataEnumerationToJSONSchema } from "./metadata/appliedObjects/metadataEnumeration/toJSONSchema"
