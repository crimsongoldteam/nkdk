import { Command, CommandsEnterprise } from "~/metadata/forms/commands/types"

export const fullCommands: Required<Command>[] = [
  {
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
    },
    action: "СоставКомплектаПодобратьФайлы",
    representation: "PictureAndText",
    currentRowUse: "DontUse",
    modifiesSavedData: true,
    table: "Таблица",
  },
]

export const fullCommandsEnterprise: CommandsEnterprise = {
  СоставКомплектаПодобратьФайлы: {
    Заголовок: "Файлы",
    Подсказка: "Состав комплекта подобрать файлы",
    Действие: "СоставКомплектаПодобратьФайлы",
    СочетаниеКлавиш: "Ctrl+F",
    ОтображениеКнопки: "PictureAndText",
    ИзменяемыеДанные: true,
    Картинка: "Печать",
    ИспользованиеТекущейСтроки: "НеИспользует",
    РазрешитьИспользование: { Администратор: "Истина" },
    Таблица: "Таблица",
  },
}

export const minimalCommands: Command[] = [
  {
    name: "СоставКомплектаПодобратьФайлы",
  },
]

export const minimalCommandEnterprise: CommandsEnterprise = {
  СоставКомплектаПодобратьФайлы: {},
}
