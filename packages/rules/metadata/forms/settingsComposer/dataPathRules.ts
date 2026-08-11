import type { DataPathContribution } from "../../validation/dataPath/registry"
import {
  resolveSettingsComposerProperty,
  SETTINGS_COMPOSER_TYPE,
  settingsComposerNamePairs,
  settingsComposerTypeInfo,
} from "./dataPathModel"

export const settingsComposerDataPathRules: readonly DataPathContribution[] = [
  {
    kind: "formattingNamePairs",
    pairs: settingsComposerNamePairs.map(([internal, yaml]) => ({ internal, yaml })),
  },
  {
    kind: "typeResolver",
    resolver: ({ baseType }) =>
      baseType === "SettingsComposer" || baseType === "КомпоновщикНастроекКомпоновкиДанных"
        ? settingsComposerTypeInfo(SETTINGS_COMPOSER_TYPE)
        : undefined,
  },
  {
    kind: "tableColumn",
    resolver: ({ table, segment }) => {
      if (table.kind === "DynamicList" && (segment === "SettingsComposer" || segment === "КомпоновщикНастроек")) {
        return {
          name: "КомпоновщикНастроек", targetName: "SettingsComposer",
          typeInfo: settingsComposerTypeInfo(SETTINGS_COMPOSER_TYPE),
        }
      }
      return table.kind === "Registered" ? resolveSettingsComposerProperty(table.type, segment) : undefined
    },
  },
]
