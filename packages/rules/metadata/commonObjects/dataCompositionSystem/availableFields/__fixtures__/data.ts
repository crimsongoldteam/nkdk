import { AvailableFields, AvailableFieldsYAML } from "../types"

export const fullAvailableFields = ["Реквизит2", "Реквизит2РасширеннаяПодсказка"] as const satisfies AvailableFields

export const fullAvailableFieldsYAML = [
  "Реквизит2",
  "Реквизит2РасширеннаяПодсказка",
] as const satisfies AvailableFieldsYAML

export const selectedItemAvailableFields = [
  {
    field: "Документ",
    use: true,
    title: { items: { ru: "Документ" } },
    viewMode: "Normal",
  },
  {
    field: "Документ",
    use: false,
    lwsTitle: { items: { ru: "Многоязычный документ" } },
  },
] as const satisfies AvailableFields

export const selectedItemAvailableFieldsYAML = [
  {
    Поле: "Документ",
    Использование: "Истина",
    Заголовок: "Документ",
    РежимОтображения: "Обычный",
  },
  {
    Поле: "Документ",
    Использование: "Ложь",
    МногоязычныйЗаголовок: "Многоязычный документ",
  },
] as const satisfies AvailableFieldsYAML
