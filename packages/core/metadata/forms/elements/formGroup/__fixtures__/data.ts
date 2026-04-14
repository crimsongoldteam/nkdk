const baseExtendedTooltip = {
  itemType: "ExtendedTooltip",
  title: { items: { ru: "Расширенная подсказка" }, formatted: false },
} as const

export const fullFormGroupCommonFixture = {
  enableContentChange: true,
  enabled: false,
  extendedTooltip: baseExtendedTooltip,
  height: 200,
  horizontalAlignInGroup: "Left" as const,
  horizontalStretch: true,
  readOnly: true as const,
  shortcut: "S",
  titleFont: { kind: "StyleItem" as const, ref: "NormalTextFont" as const },
  titleTextColor: { type: "WebColor" as const, value: "Black" },
  toolTip: { items: { ru: "Подсказка" } },
  toolTipRepresentation: "None" as const,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: false }],
  },
  verticalAlignInGroup: "Top" as const,
  verticalStretch: true,
  visible: false as const,
  width: 300,
}

export const fullFormGroupEnterpriseCommonFixture = {
  EnableContentChange: true,
  Enabled: false,
  Height: 200,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalStretch: true,
  ReadOnly: true,
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
  Visible: false,
  Width: 300,
} as const

export const fullFormGroupPartialYAMLCommonFixture = {
  // enableContentChange (defaultValueYAML: true) omitted — default value не сериализуется
  Доступность: "Ложь",
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  РастягиватьПоГоризонтали: "Истина",
  ТолькоПросмотр: "Истина",
  СочетаниеКлавиш: "S",
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ЦветТекстаЗаголовка: "Черный",
  Подсказка: "Подсказка",
  ОтображениеПодсказки: "Нет",
  РазрешитьИспользование: { Администратор: "Ложь" },
  ВертикальноеПоложениеВГруппе: "Верх",
  // verticalStretch (defaultValueYAML: true) omitted — default value не сериализуется
  Видимость: "Ложь",
  Ширина: 300,
} as const
