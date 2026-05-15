import { AvailableFields, AvailableFieldsYAML } from "../types"

export const fullAvailableFields = [
  "Реквизит2",
  "Реквизит2РасширеннаяПодсказка",
  {
    field: "Документ",
    use: true,
    title: { items: { ru: "Документ" } },
    viewMode: "Normal",
  },
] as const satisfies AvailableFields

export const fullAvailableFieldsYAML = [
  "Реквизит2",
  "Реквизит2РасширеннаяПодсказка",
  {
    Поле: "Документ",
    Использование: "Истина",
    Заголовок: "Документ",
    РежимОтображения: "Обычный",
  },
] as const satisfies AvailableFieldsYAML
