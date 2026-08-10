import type { DataPathContribution } from "../../validation/dataPath/registry"

export const metadataTaskDataPathRules: readonly DataPathContribution[] = [{
  kind: "standardAttributeType",
  resolver: ({ owner, internalName }) => {
    if (owner.ref.kind !== "Задача" && owner.ref.kind !== "ЗадачаОбъект") return undefined
    if (internalName !== "BusinessProcess" && internalName !== "RoutePoint") return undefined
    return { kinds: ["object"], nextTypes: [{ kind: "БизнесПроцесс" }], sourceText: `${owner.ref.kind}.${internalName}` }
  },
}]
