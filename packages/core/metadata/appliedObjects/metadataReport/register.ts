import {
  registerDataPathOwnerKind,
  registerOpaqueTraversalResolver,
} from "../../validation/dataPath/registry"
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

registerOpaqueTraversalResolver(
  ({ owner, segment }) =>
    owner.kind === "ОтчетОбъект" &&
    (segment === "SettingsComposer" || segment === "КомпоновщикНастроек")
)
