import {
  registerXmlImportComponentDescriptor,
  resolveXmlImportRootItemName,
} from "../../importFromXml/componentDescriptor"
import { registerMetadataItemXmlImportAugmenter } from "../../ruleRuntime/metadataItem/augmenterRegistry"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"
import { MetadataConfigurationExtensionRules } from "./rules"
import { registerFullXmlSyncComponentProfile } from "../../fullSyncToXml/componentProfile"
import { configurationExtensionFullXmlSyncProfile } from "../../fullSyncToXml/profiles/configurationExtension"
import { registerMetadataItemYamlToXmlAugmenter } from "../../ruleRuntime/property/yamlToXmlAugmenter"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"
import { registerMetadataComponentDescriptor } from "../../components/descriptor"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { registerProjectJSONSchema } from "../../projectDefinition/schemaRegistry"

registerFullXmlSyncComponentProfile(configurationExtensionFullXmlSyncProfile)
registerMetadataComponentDescriptor({
  kind: "configurationExtension",
  rootRule: MetadataConfigurationExtensionRules,
})
registerProjectJSONSchema(MetadataConfigurationExtensionRules.itemType, ({ context }) =>
  exportMetadataItemToJSONSchema({ context, rule: MetadataConfigurationExtensionRules })
)
registerMetadataItemYamlToXmlAugmenter(
  "configurationExtension",
  configurationExtensionYamlToXmlAugmenter
)

registerMetadataItemXmlImportAugmenter("configurationExtension", configurationExtensionPropertyStatesAugmenter)

registerXmlImportComponentDescriptor({
  kind: "configurationExtension",
  detect(root) {
    const configuration = root["Configuration"]
    if (!isRecord(configuration)) return false
    const properties = configuration["Properties"]
    return isRecord(properties) && "ConfigurationExtensionPurpose" in properties
  },
  resolveRoot(root) {
    const itemName = resolveXmlImportRootItemName(root)
    return {
      address: { kind: "configurationExtension", name: itemName },
      itemName,
    }
  },
  baseAddress: { kind: "configuration" },
  metadataItemAugmenter: "configurationExtension",
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
