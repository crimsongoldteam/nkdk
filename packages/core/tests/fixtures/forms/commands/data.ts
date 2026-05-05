import { FormCommand, FormCommandsYAML } from "~/metadata/forms/commonObjects/formCommand/types"

export const fullFormCommands: Omit<Required<FormCommand>, "id">[] = [
  {
    itemType: "FormCommand",
    name: "СоставКомплектаПодобратьФайлы",
    title: { items: { ru: "Файлы" } },
    toolTip: { items: { ru: "Состав комплекта подобрать файлы" } },
    use: {
      common: true,
      values: [{ name: "Администратор", value: true }],
    },
    shortcut: "Ctrl+F",
    picture: {
      ref: "Print",
      type: "StandardPicture",
      loadTransparent: true,
      transparentPixel: undefined,
    },
    action: "СоставКомплектаПодобратьФайлы",
    representation: "PictureAndText",
    currentRowUse: "DontUse",
    modifiesSavedData: true,
    table: "Таблица",
  },
]

export const fullFormCommandsYAML: FormCommandsYAML = {
  СоставКомплектаПодобратьФайлы: {
    Заголовок: "Файлы",
    Подсказка: "Состав комплекта подобрать файлы",
    Действие: "СоставКомплектаПодобратьФайлы",
    СочетаниеКлавиш: "Ctrl+F",
    ОтображениеКнопки: "КартинкаИТекст",
    ИзменяемыеДанные: "Истина",
    Картинка: "Печать",
    ИспользованиеТекущейСтроки: "НеИспользует",
    РазрешитьИспользование: { Администратор: "Истина" },
    Таблица: "Таблица",
  },
}

export const minimalFormCommands: FormCommand[] = [
  {
    itemType: "FormCommand",
    name: "СоставКомплектаПодобратьФайлы",
  },
]

export const minimalFormCommandYAML: FormCommandsYAML = {
  СоставКомплектаПодобратьФайлы: {},
}
