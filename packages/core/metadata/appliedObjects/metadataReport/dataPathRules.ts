import type { DataPathContribution } from "../../validation/dataPath/registry"

export const metadataReportDataPathRules: readonly DataPathContribution[] = [{
  kind: "opaqueTraversal",
  resolver: ({ owner, segment }) => owner.kind === "ОтчетОбъект" && (segment === "SettingsComposer" || segment === "КомпоновщикНастроек"),
}]
