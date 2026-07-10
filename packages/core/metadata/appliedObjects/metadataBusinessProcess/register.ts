import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataBusinessProcessRules } from "./rules"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "БизнесПроцесс",
  projectDir: "БизнесПроцесс",
  rule: MetadataBusinessProcessRules,
  typeDescriptionBases: ["BusinessProcessRef"],
  metadataLinkPrefixes: ["BusinessProcess"],
  aliases: ["БизнесПроцессОбъект"],
})
registerDataPathOwnerKind({
  kind: "БизнесПроцессОбъект",
  projectDir: "БизнесПроцесс",
  rule: MetadataBusinessProcessRules,
  typeDescriptionBases: ["BusinessProcessObject"],
  metadataLinkPrefixes: ["BusinessProcess"],
})
