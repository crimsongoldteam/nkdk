import { ConditionalAppearance, ConditionalAppearanceYAML } from "../types"

export const fullConditionalAppearance = {
  itemType: "ConditionalAppearance",
  viewMode: "QuickAccess",
  conditionalAppearanceItems: [{ itemType: "ConditionalAppearanceItem" }, { itemType: "ConditionalAppearanceItem" }],
  userSettingID: "48553968-cd08-47dc-896c-8bb766f9e28f",
  userSettingPresentation: {
    items: { ru: "Представление пользовательского оформления" },
  },
} as const satisfies ConditionalAppearance

export const fullConditionalAppearanceYAML = {
  Элементы: [{}, {}],
  РежимОтображения: "БыстрыйДоступ",
  ИспользоватьПользовательскуюНастройку: "48553968-cd08-47dc-896c-8bb766f9e28f",
  ПредставлениеПользовательскойНастройки: "Представление пользовательского оформления",
} as const

export const minimalConditionalAppearance = {
  itemType: "ConditionalAppearance",
  viewMode: "Normal",
} as const satisfies ConditionalAppearance

export const minimalConditionalAppearanceYAML = {} as const satisfies ConditionalAppearanceYAML

export const minimalUserSettingsConditionalAppearance = {
  itemType: "ConditionalAppearance",
  viewMode: "Normal",
  userSettingID: "b75fecce-942b-4aed-abc9-e6a02e460fb3",
} as const satisfies ConditionalAppearance

export const minimalUserSettingsConditionalAppearanceYAML = {
  ИспользоватьПользовательскуюНастройку: "b75fecce-942b-4aed-abc9-e6a02e460fb3",
} as const satisfies ConditionalAppearanceYAML
