import { MetadataBot, MetadataBotYAML } from "../types"

export const full: MetadataBot = {
  itemType: "MetadataBot",
  name: "БотВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  predefined: false,
  picture: {
    ref: "DataCompositionNewGroup",
    type: "StandardPicture",
    loadTransparent: true,
  },
}

export const fullYAML: MetadataBotYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Предопределенный: "Ложь",
  Картинка: "НоваяГруппировкаКомпоновкиДанных",
}
