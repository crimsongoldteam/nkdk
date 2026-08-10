import type { DataPathContribution } from "../../validation/dataPath/registry"

export const metadataExchangePlanDataPathRules: readonly DataPathContribution[] = [{
  kind: "virtualOwnerField",
  resolver: ({ owner, segment }) => {
    if (owner.ref.kind !== "ПланОбмена" && owner.ref.kind !== "ПланОбменаОбъект") return undefined
    if (segment === "ThisNode") return { name: segment, typeInfo: { kinds: ["boolean"], nextTypes: [], sourceText: "ExchangePlan.ThisNode" } }
    if (segment === "ОбластьДанныхОсновныеДанные") return { name: segment, typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "ExchangePlan.DataArea" } }
    return undefined
  },
}]
