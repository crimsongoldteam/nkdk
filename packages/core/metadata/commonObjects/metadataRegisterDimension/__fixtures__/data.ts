import { MetadataRegisterDimensions, MetadataRegisterDimensionsYAML } from "../types"

export const dimensionsFromXML: MetadataRegisterDimensions = [
  {
    itemType: "MetadataRegisterDimension",
    name: "ИзмерениеПоУмолчанию",
    synonym: { items: { ru: "Измерение по умолчанию" } },
    type: { type: ["boolean"] },
    objectBelonging: "Native",
  },
  {
    itemType: "MetadataRegisterDimension",
    name: "ИзмерениеБезИтогов",
    synonym: { items: { ru: "Измерение без итогов" } },
    type: { type: ["boolean"] },
    useInTotals: false,
    master: true,
    mainFilter: false,
    denyIncompleteValues: true,
    typeReductionMode: "DeleteData",
    objectBelonging: "Native",
  },
]

export const dimensionsYAML: MetadataRegisterDimensionsYAML = {
  ИзмерениеПоУмолчанию: {
    Тип: "Булево",
  },
  ИзмерениеБезИтогов: {
    Тип: "Булево",
    ИспользоватьВИтогах: "Ложь",
    Ведущее: "Истина",
    ОсновнойОтбор: "Ложь",
    ЗапретНезавершенныхЗначений: "Истина",
    РежимСокращенияТипа: "УдалятьДанные",
  },
}
