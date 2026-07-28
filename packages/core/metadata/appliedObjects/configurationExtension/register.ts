import { registerXmlImportComponentDescriptor } from "../../importFromXml/componentDescriptor"
import { registerMetadataItemXmlImportAugmenter } from "../../importFromXml/metadataItemAugmenter"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"
import { MetadataConfigurationExtensionRules } from "./rules"
import { registerFullXmlSyncComponentProfile } from "../../fullSyncToXml/componentProfile"
import { configurationExtensionFullXmlSyncProfile } from "../../fullSyncToXml/profiles/configurationExtension"
import { registerMetadataItemYamlToXmlAugmenter } from "../../orchestration/property/yamlToXmlAugmenter"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"
import { registerMetadataComponentDescriptor } from "../../components/descriptor"

registerFullXmlSyncComponentProfile(configurationExtensionFullXmlSyncProfile)
registerMetadataComponentDescriptor({
  kind: "configurationExtension",
  rootRule: MetadataConfigurationExtensionRules,
})
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
  resolveAddress(root) {
    const configuration = root["Configuration"]
    const properties = isRecord(configuration) ? configuration["Properties"] : undefined
    const name = isRecord(properties) ? properties["Name"] : undefined
    if (typeof name !== "string" || name.length === 0) {
      throw new Error("Не задано имя расширения конфигурации")
    }
    return { kind: "configurationExtension", name }
  },
  baseAddress: { kind: "configuration" },
  metadataItemAugmenter: "configurationExtension",
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
