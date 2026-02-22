import { registerElementRule } from "~/metadata/metadataFactory/elements/factory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { CalendarField } from "./types"
export type { ElementRule, PropertyRule }

export const CalendarFieldRules: ElementRule<CalendarField> = {
  enterpriseField: "FormField",
  properties: {
    autoCellHeight: { yaml: "АвтоВысотаЯчейки", type: "boolean" },
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    beginOfRepresentationPeriod: { yaml: "НачалоПериодаОтображения", type: "string" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    calendarNavigation: { yaml: "ПеремещениеПоКалендарю", type: "boolean" },
    cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean" },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu" },
    dataPath: { yaml: "ПутьКДанным", type: "DataPath" },

    defaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean" },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean" },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean" },
    enabled: { yaml: "Доступность", type: "boolean" },
    endOfRepresentationPeriod: { yaml: "КонецПериодаОтображения", type: "string" },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
    font: { yaml: "Шрифт", type: "Font" },
    height: { yaml: "Высота", type: "number" },
    heightInMonths: { yaml: "ВысотаВМесяцах", type: "number" },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      xml: "GroupHorizontalAlign",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    onMainServerUnavalableBehavior: {
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      type: "SystemEnumeration",
      typeSE: "OnMainServerUnavalableBehavior",
    },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean" },
    selectionMode: {
      yaml: "РежимВыделения",
      type: "SystemEnumeration",
      typeSE: "DateSelectionMode",
    },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string" },
    showCurrentDate: { yaml: "ОтображатьТекущуюДату", type: "boolean" },
    showMonthsPanel: { yaml: "ОтображатьПанельМесяцев", type: "boolean" },
    skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean" },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
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
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      xml: "GroupVerticalAlign",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    warningOnEdit: { yaml: "ПредупреждениеПриРедактировании", type: "I8nText" },
    warningOnEditRepresentation: {
      yaml: "ОтображениеПредупрежденияПриРедактировании",
      type: "SystemEnumeration",
      typeSE: "WarningOnEditRepresentation",
    },
    width: { yaml: "Ширина", type: "number" },
    widthInMonths: { yaml: "ШиринаВМесяцах", type: "number" },
  },
  events: {
    onChange: "ПриИзменении",
    selection: "Выбор",
    dragStart: "НачалоПеретаскивания",
    dragEnd: "ОкончаниеПеретаскивания",
    drag: "Перетаскивание",
    onActivateDate: "ПриАктивизацииДаты",
    onPeriodOutput: "ПриВыводеПериода",
    dragCheck: "ПроверкаПеретаскивания",
  },
}

registerElementRule("CalendarField", CalendarFieldRules)
