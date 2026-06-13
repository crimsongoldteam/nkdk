import { MetadataItemRule } from "~/metadata/orchestration/property/types"

/** Поля, связанные с таблицей/колонкой: есть не у всех элементов формы (напр. нет у PDFDocumentField). */
export const formFieldTableRelatedProperties = {
  headerHorizontalAlign: {
    yaml: "ГоризонтальноеПоложениеВШапке",
    xml: "HeaderHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    defaultValueYAML: "Auto",
  },
  typeRestriction: {
    yaml: "ОграничениеТипа",
    type: "TypeDescription",
    toEnterprise: false,
  },
  table: {
    yaml: "Таблица",
    xml: "AssociatedTableElementId",
    type: "AssociatedTable",
    toEnterprise: false,
  },
  fixingInTable: {
    yaml: "ФиксацияВТаблице",
    xml: "FixingInTable",
    type: "SystemEnumeration",
    typeSE: "FixingInTable",
    defaultValueYAML: "None",
  },
} as const satisfies MetadataItemRule["properties"]

export const formFieldDisabledTableRelatedProperties = Object.fromEntries(
  Object.entries(formFieldTableRelatedProperties).map(([key, property]) => [
    key,
    {
      ...property,
      runtimeOnly: true,
    },
  ])
) satisfies MetadataItemRule["properties"]

export const formFieldCommonProperties = {
  name: {
    type: "string",
    xml: "_name",
    required: true,
  },

  defaultItem: {
    yaml: "АктивизироватьПоУмолчанию",
    type: "boolean",
    defaultValueYAML: false,
  },
  displayImportance: {
    yaml: "ВажностьПриОтображении",
    xml: "_DisplayImportance",
    type: "SystemEnumeration",
    typeSE: "DisplayImportance",
    defaultValueYAML: "Auto",
  },
  verticalAlign: {
    yaml: "ВертикальноеПоложение",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    defaultValueYAML: "Auto",
  },
  verticalAlignInGroup: {
    yaml: "ВертикальноеПоложениеВГруппе",
    xml: "GroupVerticalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    defaultValueYAML: "Auto",
  },
  // type: {
  //   yaml: "Вид",
  //   type: "SystemEnumeration",
  //   typeSE: "FormFieldType",
  // },
  visible: { yaml: "Видимость", type: "boolean", defaultValueYAML: true },
  titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
  cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean", defaultValueYAML: false },
  autoCellHeight: {
    yaml: "АвтоВысотаЯчейки",
    type: "boolean",
    defaultValueYAML: true,
  },
  horizontalAlign: {
    yaml: "ГоризонтальноеПоложение",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    defaultValueYAML: "Auto",
  },
  horizontalAlignInGroup: {
    yaml: "ГоризонтальноеПоложениеВГруппе",
    xml: "GroupHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    defaultValueYAML: "Auto",
  },
  footerHorizontalAlign: {
    yaml: "ГоризонтальноеПоложениеВПодвале",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    defaultValueYAML: "Auto",
  },
  enabled: { yaml: "Доступность", type: "boolean", defaultValueYAML: true },
  title: {
    yaml: "Заголовок",
    type: "I8nText",
  },
  footerPicture: { yaml: "КартинкаПодвала", type: "Picture" },
  headerPicture: { yaml: "КартинкаШапки", type: "Picture" },
  contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu", toEnterprise: false },
  showInFooter: {
    yaml: "ОтображатьВПодвале",
    type: "boolean",
    defaultValueYAML: true,
  },
  showInHeader: {
    yaml: "ОтображатьВШапке",
    type: "boolean",
    defaultValueYAML: true,
  },
  toolTipRepresentation: {
    yaml: "ОтображениеПодсказки",
    type: "SystemEnumeration",
    typeSE: "ToolTipRepresentation",
    defaultValueYAML: "Auto",
  },
  warningOnEditRepresentation: {
    yaml: "ОтображениеПредупрежденияПриРедактировании",
    type: "SystemEnumeration",
    typeSE: "WarningOnEditRepresentation",
    defaultValueYAML: "Auto",
  },
  onMainServerUnavalableBehavior: {
    yaml: "ПоведениеПриНедоступностиОсновногоСервера",
    type: "SystemEnumeration",
    typeSE: "OnMainServerUnavalableBehavior",
    defaultValueYAML: "Auto",
  },
  toolTip: { yaml: "Подсказка", type: "I8nText" },
  titleLocation: {
    yaml: "ПоложениеЗаголовка",
    type: "SystemEnumeration",
    typeSE: "FormItemTitleLocation",
    defaultValueYAML: "Auto",
  },
  warningOnEdit: { yaml: "ПредупреждениеПриРедактировании", type: "I8nText" },
  skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean", defaultValueYAML: false },
  footerDataPath: { yaml: "ПутьКДаннымПодвала", type: "DataPath", defaultType: "string" },
  extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", toEnterprise: false },
  editMode: {
    yaml: "РежимРедактирования",
    type: "SystemEnumeration",
    typeSE: "ColumnEditMode",
    defaultValueYAML: "Enter",
  },
  // parent: { yaml: "Родитель", type: "string", toEnterprise: false },
  shortcut: { yaml: "СочетаниеКлавиш", type: "string", toEnterprise: false },
  footerText: { yaml: "ТекстПодвала", type: "I8nText" },
  readOnly: { yaml: "ТолькоПросмотр", type: "boolean", defaultValueYAML: false },
  titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color" },
  footerTextColor: { yaml: "ЦветТекстаПодвала", type: "Color" },
  titleBackColor: { yaml: "ЦветФонаЗаголовка", type: "Color" },
  footerBackColor: { yaml: "ЦветФонаПодвала", type: "Color" },
  titleFont: { yaml: "ШрифтЗаголовка", type: "Font" },
  footerFont: { yaml: "ШрифтПодвала", type: "Font" },
  userVisible: {
    yaml: "Использование",
    type: "UserVisible",
    toEnterprise: false,
  },
} as const satisfies MetadataItemRule["properties"]
