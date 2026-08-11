import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { MetadataConfigurationRules } from "./configuration/rules"
import { MetadataConfigurationExtensionRules } from "./configurationExtension/rules"
import { configurationFullXmlSyncProfile } from "../fullSyncToXml/profiles/configuration"
import { configurationExtensionFullXmlSyncProfile } from "../fullSyncToXml/profiles/configurationExtension"
import { resolveXmlImportRootItemName } from "../importFromXml/componentDescriptor"
import type { FullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"

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
      resolveRoot(root) {
        return {
          address: { kind: "configuration" },
          itemName: resolveXmlImportRootItemName(root),
        }
      },
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
      resolveRoot(root) {
        const itemName = resolveXmlImportRootItemName(root)
        return {
          address: { kind: "configurationExtension", name: itemName },
          itemName,
        }
      },
      baseAddress: { kind: "configuration" },
      metadataItemAugmenter: "configurationExtension",
    },
  ],
  synchronization: [
    configurationFullXmlSyncProfile,
    configurationExtensionFullXmlSyncProfile,
  ] as const satisfies readonly FullXmlSyncComponentProfile[],
})

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
