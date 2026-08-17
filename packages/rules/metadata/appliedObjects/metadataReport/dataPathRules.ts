import type { DataPathContribution } from "../../validation/dataPath/registry"
import {
  SETTINGS_COMPOSER_TYPE,
  settingsComposerTypeInfo,
} from "../../forms/settingsComposer/dataPathGraph"

export const metadataReportDataPathRules: readonly DataPathContribution[] = [{
  kind: "traversalTransition",
  resolver: ({ owner, segment }) =>
    owner.ref.kind === "ОтчетОбъект" && (segment === "SettingsComposer" || segment === "КомпоновщикНастроек")
      ? {
          typeInfo: settingsComposerTypeInfo(SETTINGS_COMPOSER_TYPE),
          sourceName: "КомпоновщикНастроек",
          targetName: "SettingsComposer",
        }
      : undefined,
}]
