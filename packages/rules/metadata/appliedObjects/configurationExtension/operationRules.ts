import type { MetadataOperationContribution } from "../../ruleRuntime/definition"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"

export const configurationExtensionOperationRules: readonly MetadataOperationContribution[] = [
  {
    kind: "yamlToXmlAugmenter",
    componentKind: "configurationExtension",
    augmenter: configurationExtensionYamlToXmlAugmenter,
  },
  {
    kind: "xmlImportAugmenter",
    name: "configurationExtension",
    augmenter: configurationExtensionPropertyStatesAugmenter,
  },
]
