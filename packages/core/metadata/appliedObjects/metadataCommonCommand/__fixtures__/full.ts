import { MetadataCommonCommand, MetadataCommonCommandYAML } from "../types"

export const full: MetadataCommonCommand = {
  itemType: "MetadataCommonCommand",
  name: "ОбщаяКомандаПолная",
  synonym: { items: { ru: "Общая команда полная" } },
  comment: "Комментарий",
  group: "NavigationPanelOrdinary",
}

export const fullYAML: MetadataCommonCommandYAML = {
  Синоним: "Общая команда полная",
  Комментарий: "Комментарий",
  Группа: "ПанельНавигацииОбычное",
  Отображение: "Авто",
}

export const fullExportedYAML: MetadataCommonCommandYAML = {
  Комментарий: "Комментарий",
  Группа: "ПанельНавигацииОбычное",
}
