import type { DataPathContribution } from "../../validation/dataPath/registry"
import {
  SETTINGS_COMPOSER_TYPE,
  settingsComposerGraph,
  settingsComposerNamePairs,
  settingsComposerTypeInfo,
} from "./dataPathGraph"

export const settingsComposerDataPathRules: readonly DataPathContribution[] = [
  { kind: "typedGraph", types: settingsComposerGraph },
  {
    kind: "formattingNamePairs",
    pairs: settingsComposerNamePairs.map(([internal, yaml]) => ({ internal, yaml })),
  },
  {
    kind: "elementProperty",
    registration: {
      itemType: "Table",
      propertyYaml: "РежимОтображения",
      terminalTypes: ["DataCompositionFilter", "DataCompositionUserSettings"],
    },
  },
  {
    kind: "elementProperty",
    registration: {
      itemType: "Table",
      propertyYaml: "ПодробноеОтображениеИменованныхЭлементовНастройки",
      terminalTypes: ["DataCompositionFilter", "DataCompositionConditionalAppearance"],
    },
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
      return undefined
    },
  },
]
