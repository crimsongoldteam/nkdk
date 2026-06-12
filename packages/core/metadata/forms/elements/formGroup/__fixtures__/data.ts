const baseExtendedTooltip = {
  itemType: "ExtendedTooltip",
} as const

export const fullFormGroupCommonFixture = {
  enableContentChange: true,
  enabled: false,
  extendedTooltip: baseExtendedTooltip,
  height: 15,
  horizontalAlignInGroup: "Left" as const,
  horizontalStretch: true,
  readOnly: true as const,
  title: { items: { ru: "Заголовок элемента" } },
  titleFont: { kind: "StyleItem" as const, ref: "LargeTextFont" as const },
  titleTextColor: { type: "WebColor" as const, value: "Crimson" },
  toolTip: { items: { ru: "Подсказка" } },
  toolTipRepresentation: "Balloon" as const,
  userVisible: {
    common: true,
    values: [{ name: "Role.Администратор", value: false }],
  },
  verticalAlignInGroup: "Top" as const,
  verticalStretch: false,
  visible: false as const,
  width: 10,
}

export const fullFormGroupEnterpriseCommonFixture = {
  EnableContentChange: true,
  Enabled: false,
  Height: 15,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalStretch: true,
  ReadOnly: true,
  TitleFont: { Type: "Font", Value: "StyleFonts.LargeTextFont" },
  TitleTextColor: { Type: "Color", Value: "WebColors.Crimson" },
  ToolTip: "Подсказка",
  ToolTipRepresentation: {
    Type: "SystemEnumeration",
    Value: "ToolTipRepresentation.Balloon",
  },
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  VerticalStretch: false,
  Visible: false,
  Width: 10,
} as const

export const fullFormGroupPartialYAMLCommonFixture = {
  Доступность: "Ложь",
  Заголовок: "Заголовок элемента",
  Высота: 15,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  РастягиватьПоГоризонтали: "Истина",
  ТолькоПросмотр: "Истина",
  ШрифтЗаголовка: { Вид: "КрупныйШрифтТекста" },
  ЦветТекстаЗаголовка: "Малиновый",
  Подсказка: "Подсказка",
  ОтображениеПодсказки: "Всплывающая",
  РазрешитьИспользование: { "Role.Администратор": "Ложь" },
  ВертикальноеПоложениеВГруппе: "Верх",
  РастягиватьПоВертикали: "Ложь",
  Видимость: "Ложь",
  Ширина: 10,
} as const
