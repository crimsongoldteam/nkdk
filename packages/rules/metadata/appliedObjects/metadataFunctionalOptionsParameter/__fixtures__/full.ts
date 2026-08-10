import { MetadataFunctionalOptionsParameter, MetadataFunctionalOptionsParameterYAML } from "../types"

export const full: MetadataFunctionalOptionsParameter = {
  itemType: "MetadataFunctionalOptionsParameter",
  name: "ПараметрФункциональныхОпцийВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  use: ["Catalog.СправочникПолный", "InformationRegister.РегистрСведений1.Dimension.Измерение1"],
}

export const fullYAML: MetadataFunctionalOptionsParameterYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Использование: ["Справочник.СправочникПолный", "РегистрСведений.РегистрСведений1.Измерение.Измерение1"],
}
