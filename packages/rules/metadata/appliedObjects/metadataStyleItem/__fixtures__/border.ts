import { MetadataStyleItem, MetadataStyleItemYAML } from "../types"

export const border: MetadataStyleItem = {
  itemType: "MetadataStyleItem",
  name: "ЭлементСтиляРамка",
  synonym: { items: { ru: "Элемент стиля рамка" } },
  type: "Border",
  value: {
    type: "Border",
    value: { width: 5, controlBorderType: "Overline" },
  },
}

export const borderYAML: MetadataStyleItemYAML = {
  Тип: "Рамка",
  Значение: {
    Вид: "Рамка",
    Значение: {
      Ширина: 5,
      ТипРамки: "ЧертаСверху",
    },
  },
}
