import { MetadataItemRule } from "~/metadata/orchestration/property/types"

/** Поля, связанные с таблицей/колонкой: есть не у всех элементов формы (напр. нет у PDFDocumentField). */
export const formFieldTableRelatedProperties = {
  headerHorizontalAlign: {
    yaml: "ГоризонтальноеПоложениеВШапке",
    xml: "HeaderHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    implicitValueYAML: "Auto",
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
    implicitValueYAML: "None",
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
    implicitValueYAML: false,
  },
  displayImportance: {
    yaml: "ВажностьПриОтображении",
    xml: "_DisplayImportance",
    type: "SystemEnumeration",
    typeSE: "DisplayImportance",
    implicitValueYAML: "Auto",
  },
  verticalAlign: {
    yaml: "ВертикальноеПоложение",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    implicitValueYAML: "Auto",
  },
  verticalAlignInGroup: {
    yaml: "ВертикальноеПоложениеВГруппе",
    xml: "GroupVerticalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    implicitValueYAML: "Auto",
  },
  // type: {
  //   yaml: "Вид",
  //   type: "SystemEnumeration",
  //   typeSE: "FormFieldType",
  // },
  visible: { yaml: "Видимость", type: "boolean", implicitValueYAML: true },
  titleHeight: { yaml: "ВысотаЗаголовка", type: "number", implicitValueYAML: 0 },
  cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean", implicitValueYAML: false },
  autoCellHeight: {
    yaml: "АвтоВысотаЯчейки",
    type: "boolean",
    implicitValueYAML: true,
  },
  horizontalAlign: {
    yaml: "ГоризонтальноеПоложение",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    implicitValueYAML: "Auto",
  },
  horizontalAlignInGroup: {
    yaml: "ГоризонтальноеПоложениеВГруппе",
    xml: "GroupHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    implicitValueYAML: "Auto",
  },
  footerHorizontalAlign: {
    yaml: "ГоризонтальноеПоложениеВПодвале",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    implicitValueYAML: "Auto",
  },
  enabled: { yaml: "Доступность", type: "boolean", implicitValueYAML: true },
  title: {
    yaml: "Заголовок",
    type: "I8nText",
  },
  footerPicture: { yaml: "КартинкаПодвала", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
  headerPicture: { yaml: "КартинкаШапки", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
  contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu", toEnterprise: false },
  showInFooter: {
    yaml: "ОтображатьВПодвале",
    type: "boolean",
    implicitValueYAML: true,
  },
  showInHeader: {
    yaml: "ОтображатьВШапке",
    type: "boolean",
    implicitValueYAML: true,
  },
  toolTipRepresentation: {
    yaml: "ОтображениеПодсказки",
    type: "SystemEnumeration",
    typeSE: "ToolTipRepresentation",
    implicitValueYAML: "Auto",
  },
  warningOnEditRepresentation: {
    yaml: "ОтображениеПредупрежденияПриРедактировании",
    type: "SystemEnumeration",
    typeSE: "WarningOnEditRepresentation",
    implicitValueYAML: "Auto",
  },
  onMainServerUnavalableBehavior: {
    yaml: "ПоведениеПриНедоступностиОсновногоСервера",
    type: "SystemEnumeration",
    typeSE: "OnMainServerUnavalableBehavior",
    implicitValueYAML: "Auto",
  },
  toolTip: { yaml: "Подсказка", type: "I8nText" },
  titleLocation: {
    yaml: "ПоложениеЗаголовка",
    type: "SystemEnumeration",
    typeSE: "FormItemTitleLocation",
    implicitValueYAML: "Auto",
  },
  warningOnEdit: { yaml: "ПредупреждениеПриРедактировании", type: "I8nText" },
  skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean", implicitValueYAML: false },
  footerDataPath: { yaml: "ПутьКДаннымПодвала", type: "DataPath", defaultType: "string" },
  extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", toEnterprise: false },
  editMode: {
    yaml: "РежимРедактирования",
    type: "SystemEnumeration",
    typeSE: "ColumnEditMode",
    implicitValueYAML: "Enter",
  },
  // parent: { yaml: "Родитель", type: "string", toEnterprise: false },
  shortcut: { yaml: "СочетаниеКлавиш", type: "string", toEnterprise: false },
  footerText: { yaml: "ТекстПодвала", type: "I8nText" },
  readOnly: { yaml: "ТолькоПросмотр", type: "boolean", implicitValueYAML: false },
  titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
  footerTextColor: { yaml: "ЦветТекстаПодвала", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
  titleBackColor: { yaml: "ЦветФонаЗаголовка", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
  footerBackColor: { yaml: "ЦветФонаПодвала", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
  titleFont: { yaml: "ШрифтЗаголовка", type: "Font", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] } },
  footerFont: { yaml: "ШрифтПодвала", type: "Font", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] } },
  userVisible: {
    yaml: "Использование",
    type: "UserVisible",
    toEnterprise: false,
  },
} as const satisfies MetadataItemRule["properties"]
