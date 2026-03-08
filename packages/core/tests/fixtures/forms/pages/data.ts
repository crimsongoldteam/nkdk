import { Pages, PagesEnterprise, PagesPartialYAML, PagesTypedYAML } from "~/metadata/forms/elements/pages/types"

export const fullPages: Pages = {
  itemType: "Pages",
  name: "Страницы",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Страницы" },
  },
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
  currentPagesState: "Titles",
  currentRowUse: "DontUse",
  pagesRepresentation: "Auto",
  events: {
    onCurrentPageChange: "ПроцедураПриСменеСтраницы",
  },
  childItems: [],
}

export const fullPagesEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_Страницы",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Pages" },
  ChildItems: [],
  CurrentPagesState: {
    Type: "SystemEnumeration",
    Value: "FormPagesState.Titles",
  },
  CurrentRowUse: {
    Type: "SystemEnumeration",
    Value: "CurrentRowUse.DontUse",
  },
  EnableContentChange: true,
  Enabled: true,
  Height: 200,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalStretch: true,
  PagesRepresentation: {
    Type: "SystemEnumeration",
    Value: "FormPagesRepresentation.Auto",
  },
  ReadOnly: false,
  Title: "Страницы",
  TitleFont: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  TitleTextColor: { Type: "Color", Value: "WebColors.Black" },
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
} satisfies Required<PagesEnterprise>

export const fullPagesSource: Pages = {
  itemType: "Pages",
  name: "Страницы",
  title: { items: { ru: "Страницы" } },
  childItems: [],
}

export const fullPagesPartialYAML: PagesPartialYAML = {
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
  ИспользованиеТекущейСтроки: "НеИспользует",
  ОтображениеСтраниц: "Авто",
  ТекущееСостояниеСтраниц: "Заголовки",
  События: {
    ПриСменеСтраницы: "ПроцедураПриСменеСтраницы",
  },
}

export const fullPagesTypedYAML: PagesTypedYAML = {
  Тип: "Страницы",
  Заголовок: "Страницы",
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
  ИспользованиеТекущейСтроки: "НеИспользует",
  ОтображениеСтраниц: "Авто",
  ТекущееСостояниеСтраниц: "Заголовки",
  События: {
    ПриСменеСтраницы: "ПроцедураПриСменеСтраницы",
  },
}

export const minimalPages: Pages = {
  itemType: "Pages",
  name: "Страницы",
  childItems: [],
}

export const minimalPagesPartialYAML: PagesPartialYAML = {}

export const minimalPagesTypedYAML: PagesTypedYAML = {
  Тип: "Страницы",
}
