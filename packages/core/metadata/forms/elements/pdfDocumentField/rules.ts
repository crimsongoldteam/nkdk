import { registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { PdfDocumentField } from "./types"
export type { ElementRule, PropertyRule }

export const PdfDocumentFieldRules = {
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PDFDocumentField",
  properties: {
    autoCellHeight: { yaml: "АвтоВысотаЯчейки", type: "boolean" },
    cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean" },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu", toEnterprise: false },
    dataPath: { yaml: "ПутьКДанным", type: "DataPath" },

    defaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean" },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    editMode: {
      yaml: "РежимРедактирования",
      type: "SystemEnumeration",
      typeSE: "ColumnEditMode",
    },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", toEnterprise: false },
    fixingInTable: {
      yaml: "ФиксацияВТаблице",
      type: "SystemEnumeration",
      typeSE: "FixingInTable",
    },
    footerBackColor: { yaml: "ЦветФонаПодвала", type: "Color" },
    footerDataPath: { yaml: "ПутьКДаннымПодвала", type: "DataPath" },
    footerFont: { yaml: "ШрифтПодвала", type: "Font" },
    footerHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеВПодвале",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    footerPicture: { yaml: "КартинкаПодвала", type: "Picture" },
    footerText: { yaml: "ТекстПодвала", type: "I8nText" },
    footerTextColor: { yaml: "ЦветТекстаПодвала", type: "Color" },
    headerHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеВШапке",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    headerPicture: { yaml: "КартинкаШапки", type: "Picture" },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean" },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string", toEnterprise: false },
    showInFooter: { yaml: "ОтображатьВПодвале", type: "boolean" },
    showInHeader: { yaml: "ОтображатьВШапке", type: "boolean" },
    skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean" },
    table: { yaml: "Таблица", xml: "AssociatedTableElementId", type: "AssociatedTable" },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    titleBackColor: { yaml: "ЦветФонаЗаголовка", type: "Color" },
    titleFont: { yaml: "ШрифтЗаголовка", type: "Font" },
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
    titleLocation: {
      yaml: "ПоложениеЗаголовка",
      type: "SystemEnumeration",
      typeSE: "FormItemTitleLocation",
    },
    titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color" },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormFieldType",
    },
    typeRestriction: { yaml: "ОграничениеТипа", type: "TypeDescription" },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
    },
    verticalAlign: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    visible: { yaml: "Видимость", type: "boolean" },
    warningOnEdit: { yaml: "ПредупреждениеПриРедактировании", type: "I8nText" },
    warningOnEditRepresentation: {
      yaml: "ОтображениеПредупрежденияПриРедактировании",
      type: "SystemEnumeration",
      typeSE: "WarningOnEditRepresentation",
    },
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    currentPageNumber: { yaml: "НомерТекущейСтраницы", type: "number" },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    orientation: { yaml: "Ориентация", type: "number" },
    output: {
      yaml: "Вывод",
      type: "SystemEnumeration",
      typeSE: "UseOutput",
    },
    scale: { yaml: "Масштаб", type: "number" },
    usedFileName: { yaml: "ИспользуемоеИмяФайла", type: "string" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    viewStatusLocation: {
      yaml: "ПоложениеСостоянияПросмотра",
      type: "SystemEnumeration",
      typeSE: "ViewStatusLocation",
    },
    width: { yaml: "Ширина", type: "number" },
  },
  events: {
    onChange: "ПриИзменении",
    uRLClick: "НажатиеНаНавигационнойСсылке",
  },
} as const satisfies ElementRule<PdfDocumentField>

registerElementRule("PDFDocumentField", PdfDocumentFieldRules as ElementRule<PdfDocumentField>)
