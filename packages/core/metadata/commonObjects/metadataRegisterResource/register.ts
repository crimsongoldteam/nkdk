import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { MetadataRegisterResourceRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "MetadataRegisterResources",
  itemRule: MetadataRegisterResourceRules,
  xmlElement: "Resource",
  keyField: "name",
  collectionItemRule: true,
})
