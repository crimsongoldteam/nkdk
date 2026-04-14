import { ConditionalAppearance, ConditionalAppearanceYAML } from "../types"

export const fullConditionalAppearance = {
  itemType: "ConditionalAppearance",
  viewMode: "QuickAccess",
  conditionalAppearanceItems: [{ itemType: "ConditionalAppearanceItem" }, { itemType: "ConditionalAppearanceItem" }],
  userSettingID: true,
  userSettingPresentation: {
    items: { ru: "Представление пользовательского оформления" },
  },
} as const satisfies ConditionalAppearance

export const fullConditionalAppearanceYAML = {
  Элементы: [{}, {}],
  РежимОтображения: "БыстрыйДоступ",
  ИспользоватьПользовательскуюНастройку: "Истина",
  ПредставлениеПользовательскойНастройки: "Представление пользовательского оформления",
} as const

export const minimalConditionalAppearance = {
  itemType: "ConditionalAppearance",
  viewMode: "Normal",
} as const satisfies ConditionalAppearance

export const minimalConditionalAppearanceYAML = {
  РежимОтображения: "Обычный",
} as const satisfies ConditionalAppearanceYAML

export const minimalUserSettingsConditionalAppearance = {
  itemType: "ConditionalAppearance",
  viewMode: "Normal",
  userSettingID: true,
} as const satisfies ConditionalAppearance

export const minimalUserSettingsConditionalAppearanceYAML = {
  РежимОтображения: "Обычный",
  ИспользоватьПользовательскуюНастройку: "Истина",
} as const satisfies ConditionalAppearanceYAML
