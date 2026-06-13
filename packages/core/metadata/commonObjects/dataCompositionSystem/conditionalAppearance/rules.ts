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
      implicitValueYAML: "Normal",
      defaultValueXML: "QuickAccess",
      defaultValue: ({ operation }) => (operation === "importFromYAML" ? undefined : "QuickAccess"),
    },
    userSettingID: {
      type: "UserSettingsID",
      xml: "dcsset:userSettingID",
      yaml: "ИспользоватьПользовательскуюНастройку",
      implicitValueYAML: false,
    },
    userSettingPresentation: {
      type: "DcsLocalStringType",
      xml: "dcsset:userSettingPresentation",
      yaml: "ПредставлениеПользовательскойНастройки",
    },
  },
} as const satisfies MetadataItemRule
