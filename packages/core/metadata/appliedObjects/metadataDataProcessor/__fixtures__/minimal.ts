import { MetadataDataProcessor, MetadataDataProcessorYAML } from "../types"

export const minimal: MetadataDataProcessor = {
  itemType: "MetadataDataProcessor",
  name: "ОбработкаПоУмолчанию",
  synonym: { items: { ru: "Обработка по умолчанию" } },
}

export const minimalYAML: MetadataDataProcessorYAML = {
  Синоним: "Обработка по умолчанию",
}
