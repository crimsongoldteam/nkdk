import { ButtonGroup, ButtonGroupPartialYAML, ButtonGroupTypedYAML } from "~/metadata/forms/elements/buttonGroup/types"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export const fullButtonGroup: Required<ButtonGroup> = {
  itemType: "ButtonGroup",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "UsualGroup",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
  name: "ГруппаКнопок",
  childItems: [
    {
      itemType: CollectionFormElementType.Button,
      name: "Кнопка",
    },
  ],
  title: {
    items: { ru: "Группа кнопок" },
  },
  representation: "Compact",
  commandSource: "FormCommandPanelGlobalCommands",
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "ГруппаКнопокРасширеннаяПодсказка" }, formatted: false },
  },
}

export const fullButtonGroupSource: ButtonGroup = {
  itemType: CollectionFormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  title: { items: { ru: "Группа кнопок" } },
  childItems: [],
}

export const fullButtonGroupPartialYAML: ButtonGroupPartialYAML = {
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Отображение: "Компактное",
  РасширеннаяПодсказка: {
    Заголовок: "ГруппаКнопокРасширеннаяПодсказка",
  },
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const fullButtonGroupTypedYAML: ButtonGroupTypedYAML = {
  Тип: "ГруппаКнопок",
  Заголовок: "Группа кнопок",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ИсточникКоманд: "FormCommandPanelGlobalCommands",
  Отображение: "Компактное",
  РасширеннаяПодсказка: {
    Заголовок: "ГруппаКнопокРасширеннаяПодсказка",
  },
  ПодчиненныеЭлементы: {
    Кнопка: {
      Тип: "Кнопка",
    },
  },
}

export const minimalButtonGroup: ButtonGroup = {
  itemType: CollectionFormElementType.ButtonGroup,
  name: "ГруппаКнопок",
  childItems: [],
}

export const minimalButtonGroupPartialYAML: ButtonGroupPartialYAML = {}

export const minimalButtonGroupTypedYAML: ButtonGroupTypedYAML = {
  Тип: "ГруппаКнопок",
}

export interface ButtonGroupStructureFixture {
  name: string
  element: ButtonGroup
  structured: ToNKDKResult
}

export const buttonGroupStructureFixturesTable: ButtonGroupStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "ГруппаКнопок",
      itemType: CollectionFormElementType.ButtonGroup,
      title: { items: { ru: "Группа кнопок" } },
      childItems: [],
    },
    structured: {
      strings: ["#Группа кнопок %ГруппаКнопок"],
      toOneLineGroup: true,
    },
  },
  {
    name: "without title",
    element: {
      name: "ГруппаКнопок",
      itemType: CollectionFormElementType.ButtonGroup,
      title: undefined,
      childItems: [],
    },
    structured: {
      strings: ["#{ГруппаКнопок}"],
      toOneLineGroup: true,
    },
  },
]
