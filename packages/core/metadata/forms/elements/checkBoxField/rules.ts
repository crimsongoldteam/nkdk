import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { CheckBoxField } from "./types"
export type { ElementRule, PropertyRule }

export const CheckBoxFieldRules: ElementRule<CheckBoxField> = {
  properties: {
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    checkBoxType: {
      yaml: "ВидФлажка",
      type: "SystemEnumeration",
      typeSE: "CheckBoxType",
    },
    editFormat: { yaml: "ФорматРедактирования", type: "I8nText" },
    equalItemsWidth: { yaml: "ОдинаковаяШиринаЭлементов", type: "boolean" },
    font: { yaml: "Шрифт", type: "Font" },
    itemHeight: { yaml: "ВысотаЭлемента", type: "number" },
    itemTitleHeight: { yaml: "ВысотаЗаголовкаЭлемента", type: "number" },
    itemWidth: { yaml: "ШиринаЭлемента", type: "number" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    threeState: { yaml: "ТриСостояния", type: "boolean" },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
    },
    autoCellHeight: { yaml: "АвтоВысотаЯчейки", type: "boolean" },
    cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean" },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu" },
    dataPath: { yaml: "ПутьКДанным", type: "string" },
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
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
    fixingInTable: {
      yaml: "ФиксацияВТаблице",
      type: "SystemEnumeration",
      typeSE: "FixingInTable",
    },
    footerBackColor: { yaml: "ЦветФонаПодвала", type: "Color" },
    footerDataPath: { yaml: "ПутьКДаннымПодвала", type: "string" },
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
    shortcut: { yaml: "СочетаниеКлавиш", type: "string" },
    showInFooter: { yaml: "ОтображатьВПодвале", type: "boolean" },
    showInHeader: { yaml: "ОтображатьВШапке", type: "boolean" },
    skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean" },
    table: { yaml: "Таблица", xml: "AssociatedTableElementId", type: "string" },
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
  },
  events: {
    onChange: "ПриИзменении",
  },
}

registerElementRule("CheckBoxField", CheckBoxFieldRules)
