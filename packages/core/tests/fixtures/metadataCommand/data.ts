import { MetadataCommands, MetadataCommandsYAML } from "~/metadata/appliedObjects/metadataCommand/types"

export const fullMetadataCommands: MetadataCommands = [
  {
    name: "Глоссарий",
    modifiesData: true,
    synonym: { items: { ru: "Глоссарий какой-то" } },
    group: "CommandGroup.КакаяТоГруппаКоманд",
    onMainServerUnavalableBehavior: "DontChangeBehavior",
    parameterUseMode: "Multiple",
    representation: "Text",
    shortcut: "Ctrl+G",
    toolTip: { items: { ru: "Подсказка для команды" } },
    commandParameterType: { type: ["DocumentRef.КакойТоДокумент"] },
    comment: "Комментарий к команде",
    picture: {
      type: "StandardPicture",
      ref: "Print",
      loadTransparent: true,
    },
  },
]

export const fullMetadataCommandsYAML: MetadataCommandsYAML = {
  Глоссарий: {
    Синоним: "Глоссарий какой-то",
    Группа: "ГруппаКоманд.КакаяТоГруппаКоманд",
    ПоведениеПриНедоступностиОсновногоСервера: "НеИзменятьПоведение",
    РежимИспользованияПараметра: "Множественный",
    Отображение: "Текст",
    Комментарий: "Комментарий к команде",
    Картинка: "Печать",
    СочетаниеКлавиш: "Ctrl+G",
    ТипПараметраКоманды: "Документ.КакойТоДокумент",
    ИзменяетДанные: "Истина",
    Подсказка: "Подсказка для команды",
  },
}

export const minimalMetadataCommands: MetadataCommands = [
  {
    name: "Глоссарий",
    synonym: { items: { ru: "Глоссарий" } },
    group: "NavigationPanelOrdinary",
  },
]

export const defaultMetadataCommands: MetadataCommands = [
  {
    name: "Глоссарий",
    synonym: { items: { ru: "Глоссарий" } },
    group: "NavigationPanelImportant",
  },
]

export const minimalMetadataCommandsYAML: MetadataCommandsYAML = {
  Глоссарий: "ПанельНавигацииОбычное",
}

export const defaultMetadataCommandsYAML: MetadataCommandsYAML = {
  Глоссарий: "ПанельНавигацииВажное",
}
