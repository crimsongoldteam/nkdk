import { registerMetadataItemXmlImportAugmenter } from "../../ruleRuntime/metadataItem/augmenterRegistry"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"
import { registerMetadataItemYamlToXmlAugmenter } from "../../ruleRuntime/property/yamlToXmlAugmenter"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"
registerMetadataItemYamlToXmlAugmenter(
  "configurationExtension",
  configurationExtensionYamlToXmlAugmenter
)

registerMetadataItemXmlImportAugmenter("configurationExtension", configurationExtensionPropertyStatesAugmenter)
