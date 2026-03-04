import {
  LabelDecoration,
  LabelDecorationEnterprise,
  LabelDecorationPartialYAML,
} from "~/metadata/forms/elements/labelDecoration/types"

import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullLabelDecoration: RequiredFieldsElement<LabelDecoration> = {
  itemType: CollectionFormElementType.LabelDecoration,
  name: "Заголовок",
  title: {
    items: { ru: "Заголовок формы" },
    formatted: false,
  },
  backColor: { type: "WebColor", value: "Blue" },
  border: {
    ref: "style:ControlBorder",
    width: 1,
    controlBorderType: "Indented",
  },
  borderColor: { type: "WebColor", value: "Green" },
  groupVerticalAlign: "Top",
  horizontalAlign: "Left",
  hyperlink: true,
  titleHeight: 20,
  verticalAlign: "Top",
  autoMaxHeight: true,
  autoMaxWidth: true,
  displayImportance: "High",
  enabled: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  shortcut: "Ctrl+S",
  skipOnInput: false,
  textColor: { type: "WebColor", value: "Blue" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "Label",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
  contextMenu: {
    itemType: "ContextMenu",
    autofill: false,
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  events: {
    click: "ПроцедураНажатия",
    uRLProcessing: "ПроцедураОбработкиНавигационнойСсылки",
  },
}

export const fullLabelDecorationEnterprise = {
  ElementType: "FormDecoration",
  Name: "Заголовок",
  Type: { Type: "SystemEnumeration", Value: "FormDecorationType.Label" },
  AutoMaxHeight: true,
  AutoMaxWidth: true,
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.High",
  },
  Enabled: true,
  Font: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  Height: 200,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalStretch: true,
  MaxHeight: 500,
  MaxWidth: 400,
  SkipOnInput: false,
  TextColor: { Type: "Color", Value: "WebColors.Blue" },
  ToolTip: "Подсказка",
  ToolTipRepresentation: {
    Type: "SystemEnumeration",
    Value: "ToolTipRepresentation.None",
  },
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  VerticalStretch: true,
  Visible: true,
  Width: 300,
  BackColor: { Type: "Color", Value: "WebColors.Blue" },
  BorderColor: { Type: "Color", Value: "WebColors.Green" },
  GroupVerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  HorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  Hyperlink: true,
  TitleHeight: 20,
  VerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  Title: "Заголовок формы",
  Border: { Type: "Border", Value: "ControlBorderType.Indented", Width: 1 },
} satisfies Required<LabelDecorationEnterprise>

export const fullLabelDecorationPartialYAML: LabelDecorationPartialYAML = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "Надпись",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПропускатьПриВводе: "Ложь",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ЦветТекста: "Синий",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  ВертикальноеВыравниваниеГруппы: "Верх",
  ВертикальноеПоложение: "Верх",
  ВысотаЗаголовка: 20,
  Гиперссылка: "Истина",
  ГоризонтальноеПоложение: "Лево",
  КонтекстноеМеню: {
    Автозаполнение: "Ложь",
  },
  Рамка: {
    Имя: "style:ControlBorder",
    Ширина: 1,
    ТипРамки: "Вдавленная",
  },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  ЦветРамки: "Зеленый",
  ЦветФона: "Синий",
  События: {
    Нажатие: "ПроцедураНажатия",
    ОбработкаНавигационнойСсылки: "ПроцедураОбработкиНавигационнойСсылки",
  },
}

export const minimalLabelDecoration: LabelDecoration = {
  itemType: CollectionFormElementType.LabelDecoration,
  name: "Заголовок",
}

export const minimalLabelDecorationPartialYAML: LabelDecorationPartialYAML = {}

// Для обратной совместимости
export const fullLabelDecorationYAML: LabelDecorationPartialYAML = fullLabelDecorationPartialYAML
export const minimalLabelDecorationYAML: LabelDecorationPartialYAML = minimalLabelDecorationPartialYAML

export interface LabelDecorationStructureFixture {
  name: string
  element: LabelDecoration
  structured: ToNKDKResult
}

export const labelDecorationStructureFixturesTable: LabelDecorationStructureFixture[] = [
  {
    name: "with title",
    element: {
      name: "ИмяПоля",
      itemType: CollectionFormElementType.LabelDecoration,
      title: { items: { ru: "Заголовок" }, formatted: false },
    },
    structured: {
      strings: ["Заголовок %ИмяПоля"],
      toOneLineGroup: true,
    },
  },
  {
    name: "without title",
    element: {
      name: "ИмяПоля",
      title: { items: { ru: "" }, formatted: false },
      itemType: CollectionFormElementType.LabelDecoration,
    },
    structured: {
      strings: ["%ИмяПоля"],
      toOneLineGroup: true,
    },
  },

  {
    name: "with escaped title",
    element: {
      name: "ИмяПоля",
      itemType: CollectionFormElementType.LabelDecoration,
      title: { items: { ru: 'Заголовок "формы"' }, formatted: false },
    },
    structured: {
      strings: ['"Заголовок ""формы""" %ИмяПоля'],
      toOneLineGroup: true,
    },
  },
]
