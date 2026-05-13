import { MetadataFunctionalOptionsParameter, MetadataFunctionalOptionsParameterYAML } from "../types"

export const minimal: MetadataFunctionalOptionsParameter = {
  itemType: "MetadataFunctionalOptionsParameter",
  name: "ПараметрФункциональныхОпцийПоУмолчанию",
  synonym: { items: { ru: "Параметр функциональных опций по умолчанию" } },
  use: ["Catalog.СправочникВладелец"],
}

export const minimalYAML: MetadataFunctionalOptionsParameterYAML = {
  Синоним: "Параметр функциональных опций по умолчанию",
  Использование: ["Справочник.СправочникВладелец"],
}
