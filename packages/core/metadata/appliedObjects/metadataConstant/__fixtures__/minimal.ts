import { MetadataConstant, MetadataConstantYAML } from "../types"

export const minimal: MetadataConstant = {
  itemType: "MetadataConstant",
  name: "КонстантаПоУмолчанию",
  synonym: { items: { ru: "Константа по умолчанию" } },
  type: { type: ["AnyIBRef"] },
}

export const minimalYAML: MetadataConstantYAML = {
  Синоним: "Константа по умолчанию",
  Тип: "ЛюбаяСсылка",
}
