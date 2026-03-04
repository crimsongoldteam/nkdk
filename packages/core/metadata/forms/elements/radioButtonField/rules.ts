import { registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
export type { ElementRule, PropertyRule }

export const RadioButtonFieldRules = {
  itemType: "RadioButtonField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.RadioButtonField",
  properties: {
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    choiceList: { yaml: "СписокВыбора", type: "ChoiceList" },
    columnsCount: { yaml: "КоличествоКолонок", type: "number" },
    equalColumnsWidth: { yaml: "ОдинаковаяШиринаКолонок", type: "boolean" },
    font: { yaml: "Шрифт", type: "Font" },
    itemHeight: { yaml: "ВысотаЭлемента", type: "number" },
    itemTitleHeight: { yaml: "ВысотаЗаголовкаЭлемента", type: "number" },
    itemWidth: { yaml: "ШиринаЭлемента", type: "number" },
    radioButtonType: {
      yaml: "ВидПереключателя",
      type: "SystemEnumeration",
      typeSE: "RadioButtonType",
    },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnterprise: false,
    },
    autoCellHeight: { yaml: "АвтоВысотаЯчейки", type: "boolean" },
    cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean" },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu", toEnterprise: false },
    dataPath: { yaml: "ПутьКДанным", type: "DataPath", defaultType: "number" },

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
    footerDataPath: { yaml: "ПутьКДаннымПодвала", type: "DataPath", defaultType: "string" },
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
    table: { yaml: "Таблица", xml: "AssociatedTableElementId", type: "AssociatedTable", toEnterprise: false },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
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
    typeRestriction: { yaml: "ОграничениеТипа", type: "TypeDescription", toEnterprise: false },
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
} as const satisfies ElementRule

registerElementRule("RadioButtonField", RadioButtonFieldRules)
