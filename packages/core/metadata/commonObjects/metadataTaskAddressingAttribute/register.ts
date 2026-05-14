import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { MetadataTaskAddressingAttributeRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataTaskAddressingAttributes",
  itemRule: MetadataTaskAddressingAttributeRules,
  xmlElement: "AddressingAttribute",
  keyField: "name",
  graphChild: {
    idFrom: "name",
    edgeKind: "ADDRESSING_ATTRIBUTE",
    edgeYaml: "РеквизитАдресации",
    nodeSegment: "РеквизитАдресации",
  },
})
