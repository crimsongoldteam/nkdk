import { registerDataPathOwnerKind, registerTraversalTransitionResolver } from "~/metadata/validation/dataPath/registry"
import { MetadataReportRules } from "./rules"

registerDataPathOwnerKind({
  kind: "Отчет",
  projectDir: "Отчет",
  rule: MetadataReportRules,
  metadataLinkPrefixes: ["Report"],
  aliases: ["ОтчетОбъект"],
})
registerDataPathOwnerKind({
  kind: "ОтчетОбъект",
  projectDir: "Отчет",
  rule: MetadataReportRules,
  typeDescriptionBases: ["ReportObject"],
  metadataLinkPrefixes: ["Report"],
})

registerTraversalTransitionResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "ОтчетОбъект") return undefined
  if (segment !== "SettingsComposer" && segment !== "КомпоновщикНастроек") return undefined
  return { kind: "warning" }
})
