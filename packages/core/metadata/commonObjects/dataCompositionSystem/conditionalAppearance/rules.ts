import { MetadataItemRule } from "~/metadata/orchestration"

export const ConditionalAppearanceRules = {
  itemType: "ConditionalAppearance",
  properties: {
    conditionalAppearanceItems: {
      type: "ConditionalAppearanceItems",
      xml: "dcsset:item",
      yaml: "Элементы",
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      defaultValueYAML: "Normal",
      defaultValue: "QuickAccess",
    },
    userSettingID: {
      type: "string",
      xml: "dcsset:userSettingID",
      yaml: "ИдентификаторПользовательскойНастройки",
    },
    userSettingPresentation: {
      type: "UserSettingPresentation",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    },
  },
} as const satisfies MetadataItemRule
