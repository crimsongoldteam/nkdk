import { registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { GanttChartField } from "./types"
export type { ElementRule, PropertyRule }

export const GanttChartFieldRules = {
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.GanttChartField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    height: { yaml: "Высота", type: "number" },
    horizontalLines: { yaml: "ГоризонтальныеЛинии", type: "boolean" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    intervalsSelectionMode: {
      yaml: "РежимВыделенияИнтервалов",
      type: "SystemEnumeration",
      typeSE: "GanttChartIntervalsSelectionMode",
    },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    tableLocation: {
      yaml: "ПоложениеТаблицы",
      type: "SystemEnumeration",
      typeSE: "GanttChartTableLocation",
    },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
    },
    valuesSelectionMode: {
      yaml: "РежимВыделенияЗначений",
      type: "SystemEnumeration",
      typeSE: "GanttChartValuesSelectionMode",
    },
    verticalLines: { yaml: "ВертикальныеЛинии", type: "boolean" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
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
    selection: "Выбор",
    detailProcessing: "ОбработкаРасшифровки",
    beforeExpand: "ПередРазворачиванием",
    beforeCollapse: "ПередСворачиванием",
    onActivateValue: "ПриАктивизацииЗначения",
    onActivateInterval: "ПриАктивизацииИнтервала",
    onIntervalEditEnd: "ПриОкончанииРедактированияИнтервала",
  },
} as const satisfies ElementRule<GanttChartField>

registerElementRule("GanttChartField", GanttChartFieldRules as ElementRule<GanttChartField>)
