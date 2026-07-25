import { registerXmlImportComponentDescriptor } from "../../importFromXml/componentDescriptor"
import { registerMetadataItemXmlImportAugmenter } from "../../importFromXml/metadataItemAugmenter"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"
import { MetadataConfigurationExtensionRules } from "./rules"

registerMetadataItemXmlImportAugmenter("configurationExtension", configurationExtensionPropertyStatesAugmenter)

registerXmlImportComponentDescriptor({
  kind: "configurationExtension",
  rootRule: MetadataConfigurationExtensionRules,
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
