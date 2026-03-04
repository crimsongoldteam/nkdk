import { Page, PageEnterprise, PagePartialYAML } from "~/metadata/forms/elements/page/types"

export const fullPage: Required<Page> = {
  itemType: CollectionFormElementType.Page,
  name: "Страница",
  enableContentChange: true,
  enabled: true,
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  readOnly: false,
  shortcut: "Ctrl+S",
  title: {
    items: { ru: "Страница" },
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
  backColor: { type: "WebColor", value: "White" },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  picture: { ref: "Print", type: "StandardPicture", loadTransparent: true },
  childItemsHorizontalAlign: "Left",
  childItemsVerticalAlign: "Top",
  displayImportance: "High",
  format: {
    items: { ru: "Формат" },
  },
  group: "Vertical",
  horizontalSpacing: "Single",
  itemsAndTitlesAlign: "Auto",
  scrollOnCompress: true,
  showTitle: true,
  slaveItemsWidth: "Auto",
  titleDataPath: "Объект.Заголовок",
  verticalAlign: "Top",
  verticalScrollOnReduceSize: true,
  verticalSpacing: "Single",
  childItems: [
    {
      name: "ПолеВвода",
      itemType: "InputField",
    },
  ],
}

export const fullPagePartialYAML: PagePartialYAML = {
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
  ВажностьПриОтображении: "Высокая",
  ВертикальнаяПрокруткаПриСжатии: "Истина",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеПодчиненных: "Верх",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "Авто",
  ГоризонтальноеПоложениеПодчиненных: "Лево",
  ГоризонтальныйИнтервал: "Одинарный",
  Группировка: "Вертикальная",
  Картинка: "Печать",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымЗаголовка: "Объект.Заголовок",
  РасширеннаяПодсказка: {
    Заголовок: "Расширенная подсказка",
  },
  СкроллПриСжатии: "Истина",
  Формат: "Формат",
  ЦветФона: "Белый",
  ШиринаПодчиненныхЭлементов: "Авто",
}

export const fullPageEnterprise = {
  ElementType: "FormGroup",
  Name: "Страница",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Page" },
  BackColor: { Type: "Color", Value: "WebColors.White" },
  ChildItems: [
    {
      ElementType: "FormField",
      Name: "ПолеВвода",
      Type: { Type: "SystemEnumeration", Value: "FormFieldType.InputField" },
    },
  ],
  ChildItemsHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  ChildItemsVerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.High",
  },
  Format: "Формат",
  Group: {
    Type: "SystemEnumeration",
    Value: "ChildFormItemsGroup.Vertical",
  },
  HorizontalSpacing: {
    Type: "SystemEnumeration",
    Value: "FormItemSpacing.Single",
  },
  ItemsAndTitlesAlign: {
    Type: "SystemEnumeration",
    Value: "ItemsAndTitlesAlignVariant.Auto",
  },
  ScrollOnCompress: true,
  ShowTitle: true,
  SlaveItemsWidth: {
    Type: "SystemEnumeration",
    Value: "ChildFormItemsWidth.Auto",
  },
  TitleDataPath: "Объект.Заголовок",
  VerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  VerticalScrollOnReduceSize: true,
  VerticalSpacing: {
    Type: "SystemEnumeration",
    Value: "FormItemSpacing.Single",
  },
  EnableContentChange: true,
  Enabled: true,
  Height: 200,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalStretch: true,
  ReadOnly: false,
  Title: "Страница",
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
  Picture: { Type: "Picture", Value: "PictureLib.Print" },
} satisfies Required<PageEnterprise>

export const minimalPage: Page = {
  itemType: CollectionFormElementType.Page,
  name: "Страница",
  childItems: [],
}

export const minimalPagePartialYAML: PagePartialYAML = {}

// export const minimalPageYAML: PagePartialYAML = minimalPagePartialYAML
