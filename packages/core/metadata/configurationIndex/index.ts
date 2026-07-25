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
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
export { hashConfigurationProjectFiles, hashConfigurationProjectFileList, type HashConfigurationProjectFilesOptions } from "./projectFiles"
export {
  createConfigurationIndexReader,
  readConfigurationIndexSnapshot,
  snapshotConfigurationIndex,
  type ConfigurationIndexReader,
  type SharedConfigurationIndexSnapshot,
} from "./sharedSnapshot"
export type {
  ConfigurationIdentity,
  ConfigurationIndexBinding,
  ConfigurationIndexData,
  ConfigurationIndexFragment,
  ConfigurationLocalDependency,
  ConfigurationLocalDependencyRulePathSegment,
  ConfigurationLocalIndexes,
  ConfigurationProjectFile,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "./types"
export { componentPath, type ComponentAddress } from "../components/address"
