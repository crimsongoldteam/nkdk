import { FormCommand, FormCommandsYAML } from "~/metadata/forms/commonObjects/formCommand/types"

export const fullFormCommands: Omit<Required<FormCommand>, "id">[] = [
  {
    itemType: "FormCommand",
    name: "СоставКомплектаПодобратьФайлы",
    title: { items: { ru: "Заголовок" } },
    toolTip: { items: { ru: "Подсказка" } },
    use: {
      common: true,
      values: [{ name: "Role.Администратор", value: false }],
    },
    shortcut: "S",
    picture: {
      ref: "Properties",
      type: "StandardPicture",
      loadTransparent: true,
      transparentPixel: undefined,
    },
    action: "Действие",
    functionalOptions: ["FunctionalOption.ФункциональнаяОпцияБулево"],
    representation: "PictureAndText",
    modifiesSavedData: true,
    currentRowUse: "DontUse",
    table: { type: "string" as const, value: "Таблица" },
  },
]

export const fullFormCommandsYAML: FormCommandsYAML = {
  СоставКомплектаПодобратьФайлы: {
    Заголовок: "Заголовок",
    Подсказка: "Подсказка",
    Действие: "Действие",
    СочетаниеКлавиш: "S",
    ОтображениеКнопки: "КартинкаИТекст",
    ИзменяемыеДанные: "Истина",
    Картинка: "Свойства",
    ИспользованиеТекущейСтроки: "НеИспользует",
    РазрешитьИспользование: { "Role.Администратор": "Ложь" },
    ФункциональныеОпции: ["FunctionalOption.ФункциональнаяОпцияБулево"],
    Таблица: "Таблица",
  },
}

export const minimalFormCommands: FormCommand[] = [
  {
    itemType: "FormCommand",
    id: "2",
    name: "ПоУмолчанию",
    title: { items: { ru: "По умолчанию" } },
  },
]

export const minimalFormCommandsFromXML: FormCommand[] = [
  {
    itemType: "FormCommand",
    name: "ПоУмолчанию",
    title: { items: { ru: "По умолчанию" } },
  },
]

export const minimalFormCommandsImportedFromYAML: FormCommand[] = [
  {
    itemType: "FormCommand",
    name: "ПоУмолчанию",
    title: { items: { ru: "По умолчанию" } },
  },
]

export const minimalFormCommandYAML: FormCommandsYAML = {
  ПоУмолчанию: {},
}
