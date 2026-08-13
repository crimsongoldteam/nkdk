export { childSegmentUid, childUid, configurationUid, indexedUid, metadataItemUid } from "@nkdk/runtime"
export {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexCollector,
  withConfigurationIndexLogicalAddress,
  type ConfigurationIndexCollectionContext,
} from "@nkdk/runtime"
export { createConfigurationIndexCollector, type ConfigurationIndexCollector } from "@nkdk/runtime"
export {
  configurationIndexStoreDescriptor,
  createConfigurationIndexCandidateStore,
  openConfigurationIndexStore,
  type ConfigurationIndexCandidateStore,
  type ConfigurationIndexStoreDescriptor,
} from "@nkdk/runtime"
export {
  ConfigurationIndexCompatibilityError,
  decodeConfigurationIndex,
  type DecodeConfigurationIndexOptions,
} from "@nkdk/runtime"
export { encodeConfigurationIndex } from "@nkdk/runtime"
export {
  createConfigurationIndexExportRuntime,
  type ConfigurationIndexExportRuntime,
  type CreateConfigurationIndexExportRuntimeOptions,
} from "@nkdk/runtime"
export {
  createLocalConfigurationIndexReader,
  type LocalConfigurationIndexReader,
} from "@nkdk/runtime"
export {
  configurationIndexPath,
  readConfigurationIndex,
  writeConfigurationIndex,
} from "@nkdk/runtime"
export {
  createConfigurationIndexFragmentBuilder,
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
  type ConfigurationIndexFragmentBuilder,
} from "@nkdk/runtime"
export { hashConfigurationProjectFiles, hashConfigurationProjectFileList, type HashConfigurationProjectFilesOptions } from "./projectFiles"
export {
  createConfigurationIndexAssignmentLookupStats,
  createConfigurationIndexReader,
  readConfigurationIndexSnapshot,
  snapshotConfigurationIndex,
  type AssignmentScopedConfigurationIndexReader,
  type ConfigurationIndexAssignmentLookupStats,
  type ConfigurationIndexEntityRange,
  type ConfigurationIndexReader,
  type SharedConfigurationIndexSnapshot,
} from "@nkdk/runtime"
export type {
  ConfigurationProjectFile,
  ConfigurationIndexBlockFragment,
  ConfigurationIndexBlock,
  ConfigurationSnapshot,
  ConfigurationSnapshotEntity,
  ConfigurationSnapshotFile,
  ConfigurationSnapshotFragment,
  ConfigurationSnapshotXml,
  MergedConfigurationSnapshotFragments,
  OmittedChildren,
} from "@nkdk/runtime"
export { componentPath, type ComponentAddress } from "@nkdk/runtime"
