import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { MetadataConfigurationRules } from "./configuration/rules"
import { MetadataConfigurationExtensionRules } from "./configurationExtension/rules"
import { configurationFullXmlSyncProfile } from "../fullSyncToXml/profiles/configuration"
import { configurationExtensionFullXmlSyncProfile } from "../fullSyncToXml/profiles/configurationExtension"

export const appliedObjectComponentRules = defineMetadataRules({
  ...emptyMetadataRules,
  components: [
    {
      kind: "configuration",
      rootRule: MetadataConfigurationRules,
    },
    {
      kind: "configurationExtension",
      rootRule: MetadataConfigurationExtensionRules,
    },
  ],
  imports: [
    {
      kind: "configuration",
      detect(root) {
        const configuration = root["Configuration"]
        if (!isRecord(configuration)) return false
        const properties = configuration["Properties"]
        return (
          !isRecord(properties) ||
          !("ConfigurationExtensionPurpose" in properties)
        )
      },
      resolveAddress: () => ({ kind: "configuration" }),
    },
    {
      kind: "configurationExtension",
      detect(root) {
        const configuration = root["Configuration"]
        if (!isRecord(configuration)) return false
        const properties = configuration["Properties"]
        return (
          isRecord(properties) &&
          "ConfigurationExtensionPurpose" in properties
        )
      },
      resolveAddress(root) {
        const configuration = root["Configuration"]
        const properties = isRecord(configuration)
          ? configuration["Properties"]
          : undefined
        const name = isRecord(properties) ? properties["Name"] : undefined
        if (typeof name !== "string" || name.length === 0) {
          throw new Error("Не задано имя расширения конфигурации")
        }
        return { kind: "configurationExtension", name }
      },
      baseAddress: { kind: "configuration" },
      metadataItemAugmenter: "configurationExtension",
    },
  ],
  synchronization: [
    configurationFullXmlSyncProfile,
    configurationExtensionFullXmlSyncProfile,
  ],
})

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
