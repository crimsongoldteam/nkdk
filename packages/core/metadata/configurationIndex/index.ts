export { childUid, configurationUid, indexedUid, metadataItemUid } from "./logicalAddress"
export {
  ConfigurationIndexCompatibilityError,
  decodeConfigurationIndex,
  type DecodeConfigurationIndexOptions,
} from "./decode"
export { encodeConfigurationIndex } from "./encode"
export {
  DEFAULT_CONFIGURATION_INDEX_BASE_ID,
  configurationIndexPath,
  readConfigurationIndex,
  writeConfigurationIndexAtomically,
} from "./fileIO"
export {
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
export {
  hashConfigurationProjectFiles,
  type HashConfigurationProjectFilesOptions,
} from "./projectFiles"
export type {
  ConfigurationIdentity,
  ConfigurationIndexBinding,
  ConfigurationIndexData,
  ConfigurationIndexFragment,
  ConfigurationProjectFile,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "./types"
