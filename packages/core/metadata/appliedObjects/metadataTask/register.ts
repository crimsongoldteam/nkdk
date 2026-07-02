import { registerDataPathOwnerKind, registerStandardAttributeTypeResolver } from "../../validation/dataPath/registry"
import { MetadataTaskRules } from "./rules"

registerDataPathOwnerKind({
  kind: "Задача",
  projectDir: "Задача",
  rule: MetadataTaskRules,
  typeDescriptionBases: ["TaskRef"],
  metadataLinkPrefixes: ["Task"],
  aliases: ["ЗадачаОбъект"],
})
registerDataPathOwnerKind({
  kind: "ЗадачаОбъект",
  projectDir: "Задача",
  rule: MetadataTaskRules,
  typeDescriptionBases: ["TaskObject"],
  metadataLinkPrefixes: ["Task"],
})

registerStandardAttributeTypeResolver(({ owner, internalName }) => {
  if (owner.ref.kind !== "Задача" && owner.ref.kind !== "ЗадачаОбъект") return undefined
  if (internalName !== "BusinessProcess" && internalName !== "RoutePoint") return undefined

  return {
    kinds: ["object"],
    nextTypes: [{ kind: "БизнесПроцесс" }],
    sourceText: `${owner.ref.kind}.${internalName}`,
  }
})
