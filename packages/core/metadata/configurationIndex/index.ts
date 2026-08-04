export { childSegmentUid, childUid, configurationUid, indexedUid, metadataItemUid } from "./logicalAddress"
export {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexCollector,
  withConfigurationIndexLogicalAddress,
  type ConfigurationIndexCollectionContext,
} from "./collector/context"
export { createConfigurationIndexCollector, type ConfigurationIndexCollector } from "./collector/writer"
export {
  ConfigurationIndexCompatibilityError,
  decodeConfigurationIndex,
  type DecodeConfigurationIndexOptions,
} from "./decode"
export { encodeConfigurationIndex } from "./encode"
export {
  createConfigurationIndexExportRuntime,
  type ConfigurationIndexExportRuntime,
  type CreateConfigurationIndexExportRuntimeOptions,
} from "./exportRuntime"
export {
  configurationIndexPath,
  readConfigurationIndex,
  writeConfigurationIndexAtomically,
} from "./fileIO"
export {
  createConfigurationIndexFragmentBuilder,
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
  type ConfigurationIndexFragmentBuilder,
} from "./fragment"
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
} from "./sharedSnapshot"
export type {
  ConfigurationProjectFile,
  ConfigurationSnapshot,
  ConfigurationSnapshotEntity,
  ConfigurationSnapshotFile,
  ConfigurationSnapshotFragment,
  ConfigurationSnapshotXml,
  MergedConfigurationSnapshotFragments,
  OmittedChildren,
} from "./types"
export { componentPath, type ComponentAddress } from "../components/address"
