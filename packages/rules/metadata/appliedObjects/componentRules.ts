import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { MetadataConfigurationRules } from "./configuration/rules"
import { MetadataConfigurationExtensionRules } from "./configurationExtension/rules"
import { configurationFullXmlSyncProfile } from "../fullSyncToXml/profiles/configuration"
import { configurationExtensionFullXmlSyncProfile } from "../fullSyncToXml/profiles/configurationExtension"
import { resolveXmlImportRootItemName } from "../importFromXml/componentDescriptor"
import type { FullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"
import { xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"

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
        return configurationExtensionFlag(root) === false
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
        return configurationExtensionFlag(root) === true
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

function configurationExtensionFlag(root: XmlElementNode): boolean | undefined {
  const configurations = xmlElementChildren(root, "Configuration")
  if (configurations.length !== 1) return undefined
  const properties = xmlElementChildren(configurations[0]!, "Properties")
  return properties.length === 1 && xmlElementChildren(properties[0]!, "ConfigurationExtensionPurpose").length > 0
}
