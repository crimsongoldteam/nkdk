import type { DataPathContribution } from "../../validation/dataPath/registry"
import {
  SETTINGS_COMPOSER_TYPE,
  settingsComposerTableSource,
  settingsComposerTypeInfo,
} from "../../forms/settingsComposer/dataPathModel"

export const metadataReportDataPathRules: readonly DataPathContribution[] = [{
  kind: "traversalTransition",
  resolver: ({ owner, segment }) =>
    owner.ref.kind === "ОтчетОбъект" && (segment === "SettingsComposer" || segment === "КомпоновщикНастроек")
      ? {
          typeInfo: settingsComposerTypeInfo(SETTINGS_COMPOSER_TYPE),
          sourceName: "КомпоновщикНастроек",
          targetName: "SettingsComposer",
          tableSource: settingsComposerTableSource(SETTINGS_COMPOSER_TYPE),
        }
      : undefined,
}]
