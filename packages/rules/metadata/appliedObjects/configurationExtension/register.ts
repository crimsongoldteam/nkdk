import { registerMetadataItemXmlImportAugmenter } from "../../ruleRuntime/metadataItem/augmenterRegistry"
import { registerMetadataItemYamlToXmlAugmenter } from "../../ruleRuntime/property/yamlToXmlAugmenter"
import { configurationExtensionOperationRules } from "./operationRules"

for (const operation of configurationExtensionOperationRules) {
  if (operation.kind === "xmlImportAugmenter") {
    registerMetadataItemXmlImportAugmenter(operation.name, operation.augmenter)
  } else {
    registerMetadataItemYamlToXmlAugmenter(operation.componentKind, operation.augmenter)
  }
}
