import { registerDataPathOwnerKind, registerVirtualOwnerFieldResolver } from "../../validation/dataPath/registry"
import { MetadataExchangePlanRules } from "./rules"

registerDataPathOwnerKind({
  kind: "ПланОбмена",
  projectDir: "ПланОбмена",
  rule: MetadataExchangePlanRules,
  typeDescriptionBases: ["ExchangePlanRef"],
  metadataLinkPrefixes: ["ExchangePlan"],
  aliases: ["ПланОбменаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ПланОбменаОбъект",
  projectDir: "ПланОбмена",
  rule: MetadataExchangePlanRules,
  typeDescriptionBases: ["ExchangePlanObject"],
  metadataLinkPrefixes: ["ExchangePlan"],
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ПланОбмена" && owner.ref.kind !== "ПланОбменаОбъект") return undefined
  if (segment === "ThisNode") {
    return {
      name: segment,
      typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ExchangePlan.ThisNode" },
    }
  }
  if (segment === "ОбластьДанныхОсновныеДанные") {
    return {
      name: segment,
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "ExchangePlan.DataArea" },
    }
  }
  return undefined
})
