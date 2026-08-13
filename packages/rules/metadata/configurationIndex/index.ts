export { childSegmentUid, childUid, configurationUid, indexedUid, metadataItemUid } from "@nkdk/runtime"
export {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexCollector,
  withConfigurationIndexLogicalAddress,
  type ConfigurationIndexCollectionContext,
} from "@nkdk/runtime"
export { createConfigurationIndexCollector, type ConfigurationIndexCollector } from "@nkdk/runtime"
export { configurationIndexStoreDescriptor, type ConfigurationIndexStoreDescriptor } from "@nkdk/runtime"
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
  createConfigurationIndexFragmentBuilder,
  decodeConfigurationBlockFragments,
  encodeConfigurationBlockFragments,
  mergeConfigurationIndexFragments,
  type ConfigurationIndexFragmentBuilder,
} from "@nkdk/runtime"
export { hashConfigurationProjectFiles, hashConfigurationProjectFileList, type HashConfigurationProjectFilesOptions } from "./projectFiles"
export type {
  ConfigurationProjectFile,
  ConfigurationIndexBlockFragment,
  ConfigurationIndexBlock,
  ConfigurationIndexBlockEntity,
  ConfigurationIndexFragmentCollection,
} from "@nkdk/runtime"
export { componentPath, type ComponentAddress } from "@nkdk/runtime"
