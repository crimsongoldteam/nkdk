const baseContextMenu = {
  itemType: "ContextMenu",
  autofill: false,
  childItems: [],
} as const

const baseExtendedTooltip = {
  itemType: "ExtendedTooltip",
  title: { items: { ru: "Расширенная подсказка" }, formatted: false },
} as const

const fullFormFieldCommonFixtureBase = {
  defaultItem: true,
  displayImportance: "High" as const,
  verticalAlign: "Top" as const,
  verticalAlignInGroup: "Top" as const,
  visible: false as const,
  titleHeight: 20,
  cellHyperlink: true,
  horizontalAlign: "Left" as const,
  horizontalAlignInGroup: "Left" as const,
  footerHorizontalAlign: "Left" as const,
  enabled: false,
  footerPicture: {
    type: "StandardPicture" as const,
    ref: "Print",
    loadTransparent: true,
  },
  headerPicture: {
    type: "StandardPicture" as const,
    ref: "Print",
    loadTransparent: true,
  },
  contextMenu: baseContextMenu,
  showInFooter: false as const,
  showInHeader: false as const,
  toolTipRepresentation: "None" as const,
  warningOnEditRepresentation: "DontShow" as const,
  onMainServerUnavalableBehavior: "DontChangeBehavior" as const,
  toolTip: {
    items: { ru: "Подсказка" },
  },
  titleLocation: "Left" as const,
  warningOnEdit: {
    items: { ru: "Предупреждение" },
  },
  skipOnInput: true,
  dataPath: "Реквизит",
  footerDataPath: "РеквизитПодвала",
  extendedTooltip: baseExtendedTooltip,
  editMode: "EnterOnInput" as const,
  shortcut: "S",
  footerText: {
    items: { ru: "Текст подвала" },
  },
  readOnly: true as const,
  titleTextColor: { type: "WebColor" as const, value: "Black" },
  footerTextColor: { type: "WebColor" as const, value: "Black" },
  titleBackColor: { type: "WebColor" as const, value: "Blue" },
  footerBackColor: { type: "WebColor" as const, value: "White" },
  titleFont: { kind: "StyleItem" as const, ref: "NormalTextFont" as const },
  footerFont: { kind: "StyleItem" as const, ref: "NormalTextFont" as const },
  userVisible: {
    common: true,
    values: [{ name: "Role.Администратор", value: false }],
  },
}

// AutoCellHeight покрыт отдельными фикстурами; full.xml-референсы его не содержат.
export const fullFormFieldCommonFixture = fullFormFieldCommonFixtureBase as typeof fullFormFieldCommonFixtureBase & {
  autoCellHeight: false
}

export const fullFormFieldTableRelatedFixture = {
  autoCellHeight: false,
  headerHorizontalAlign: "Left" as const,
  typeRestriction: { type: ["string"] },
  table: { type: "string" as const, value: "Таблица" },
  fixingInTable: "None" as const,
}

const fullFormFieldEnterpriseCommonFixtureBase = {
  CellHyperlink: true,
  DataPath: "prefix_Реквизит",
  DefaultItem: true,
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.High",
  },
  EditMode: {
    Type: "SystemEnumeration",
    Value: "ColumnEditMode.EnterOnInput",
  },
  Enabled: false,
  FooterBackColor: { Type: "Color", Value: "WebColors.White" },
  FooterDataPath: "prefix_РеквизитПодвала",
  FooterFont: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  FooterHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  FooterPicture: { Type: "Picture", Value: "PictureLib.Print" },
  FooterText: "Текст подвала",
  FooterTextColor: { Type: "Color", Value: "WebColors.Black" },
  HeaderPicture: { Type: "Picture", Value: "PictureLib.Print" },
  HorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  OnMainServerUnavalableBehavior: {
    Type: "SystemEnumeration",
    Value: "OnMainServerUnavalableBehavior.DontChangeBehavior",
  },
  ReadOnly: true,
  ShowInFooter: false,
  ShowInHeader: false,
  SkipOnInput: true,
  TitleBackColor: { Type: "Color", Value: "WebColors.Blue" },
  TitleFont: { Type: "Font", Value: "StyleFonts.NormalTextFont" },
  TitleHeight: 20,
  TitleLocation: {
    Type: "SystemEnumeration",
    Value: "FormItemTitleLocation.Left",
  },
  TitleTextColor: { Type: "Color", Value: "WebColors.Black" },
  ToolTip: "Подсказка",
  ToolTipRepresentation: {
    Type: "SystemEnumeration",
    Value: "ToolTipRepresentation.None",
  },
  VerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  Visible: false,
  WarningOnEdit: "Предупреждение",
  WarningOnEditRepresentation: {
    Type: "SystemEnumeration",
    Value: "WarningOnEditRepresentation.DontShow",
  },
} as const

// AutoCellHeight покрыт отдельными фикстурами; full.xml-референсы его не содержат.
export const fullFormFieldEnterpriseCommonFixture =
  fullFormFieldEnterpriseCommonFixtureBase as typeof fullFormFieldEnterpriseCommonFixtureBase & {
    readonly AutoCellHeight: false
  }

export const fullFormFieldEnterpriseTableRelatedFixture = {
  AutoCellHeight: false,
  HeaderHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  FixingInTable: {
    Type: "SystemEnumeration",
    Value: "FixingInTable.None",
  },
} as const

const fullFormFieldPartialYAMLCommonFixtureBase = {
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеВГруппе: "Верх",
  Видимость: "Ложь",
  ВысотаЗаголовка: 20,
  ГиперссылкаЯчейки: "Истина",
  ГоризонтальноеПоложение: "Лево",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  ГоризонтальноеПоложениеВПодвале: "Лево",
  Доступность: "Ложь",
  КартинкаПодвала: "Печать",
  КартинкаШапки: "Печать",
  КонтекстноеМеню: {
    Автозаполнение: "Ложь",
  },
  ОтображатьВПодвале: "Ложь",
  ОтображатьВШапке: "Ложь",
  ОтображениеПодсказки: "Нет",
  ОтображениеПредупрежденияПриРедактировании: "НеОтображать",
  ПоведениеПриНедоступностиОсновногоСервера: "НеИзменятьПоведение",
  Подсказка: "Подсказка",
  ПоложениеЗаголовка: "Лево",
  ПредупреждениеПриРедактировании: "Предупреждение",
  ПропускатьПриВводе: "Истина",
  ПутьКДаннымПодвала: "РеквизитПодвала",
  РазрешитьИспользование: { "Role.Администратор": "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  РежимРедактирования: "ВходПриВводе",
  СочетаниеКлавиш: "S",
  ТекстПодвала: "Текст подвала",
  ТолькоПросмотр: "Истина",
  ЦветТекстаЗаголовка: "Черный",
  ЦветТекстаПодвала: "Черный",
  ЦветФонаЗаголовка: "Синий",
  ЦветФонаПодвала: "Белый",
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ШрифтПодвала: "ОбычныйШрифтТекста",
} as const

// AutoCellHeight покрыт отдельными фикстурами; full.xml-референсы его не содержат.
export const fullFormFieldPartialYAMLCommonFixture =
  fullFormFieldPartialYAMLCommonFixtureBase as typeof fullFormFieldPartialYAMLCommonFixtureBase & {
    readonly АвтоВысотаЯчейки: "Ложь"
  }

export const fullFormFieldTableRelatedPartialYAMLCommonFixture = {
  АвтоВысотаЯчейки: "Ложь",
  ГоризонтальноеПоложениеВШапке: "Лево",
  ОграничениеТипа: "Строка",
  Таблица: "Таблица",
  ФиксацияВТаблице: "Нет",
} as const
