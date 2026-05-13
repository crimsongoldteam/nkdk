import { MetadataStyleItem, MetadataStyleItemYAML } from "../types"

export const font: MetadataStyleItem = {
  itemType: "MetadataStyleItem",
  name: "ЭлементСтиляШрифтВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: "Font",
  value: {
    type: "Font",
    value: {
      faceName: "Devanagari MT",
      height: 16,
      bold: true,
      italic: true,
      underline: true,
      strikeout: true,
      kind: "Absolute",
      scale: 99,
    },
  },
}

export const fontYAML: MetadataStyleItemYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Тип: "Шрифт",
  Значение: {
    Вид: "Шрифт",
    Значение: {
      Имя: "Devanagari MT",
      Размер: 16,
      Масштаб: 99,
      Полужирный: "Истина",
      Наклонный: "Истина",
      Подчеркивание: "Истина",
      Зачеркивание: "Истина",
    },
  },
}
