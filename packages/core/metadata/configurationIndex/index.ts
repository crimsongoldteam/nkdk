export { childUid, configurationUid, indexedUid, metadataItemUid } from "./logicalAddress"
export {
  ConfigurationIndexCompatibilityError,
  decodeConfigurationIndex,
  type DecodeConfigurationIndexOptions,
} from "./decode"
export { encodeConfigurationIndex } from "./encode"
export {
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
export type {
  ConfigurationIdentity,
  ConfigurationIndexBinding,
  ConfigurationIndexData,
  ConfigurationIndexFragment,
  ConfigurationProjectFile,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "./types"
