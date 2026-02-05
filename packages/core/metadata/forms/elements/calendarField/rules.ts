import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { CalendarField } from "./types"
export type { ElementRule, PropertyRule }

export const CalendarFieldRules: ElementRule<CalendarField> = {
  properties: {
    autoCellHeight: { yaml: "АвтоВысотаЯчейки", type: "boolean", enterprise: true },
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", enterprise: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", enterprise: true },
    beginOfRepresentationPeriod: { yaml: "НачалоПериодаОтображения", type: "string", enterprise: true },
    border: { yaml: "Рамка", type: "Border", enterprise: true },
    borderColor: { yaml: "ЦветРамки", type: "Color", enterprise: true },
    calendarNavigation: { yaml: "ПеремещениеПоКалендарю", type: "boolean", enterprise: true },
    cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean", enterprise: true },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu", enterprise: true },
    dataPath: { yaml: "ПутьКДанным", type: "string", enterprise: true },
    defaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean", enterprise: true },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      enterprise: true,
    },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", enterprise: true },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", enterprise: true },
    enabled: { yaml: "Доступность", type: "boolean", enterprise: true },
    endOfRepresentationPeriod: { yaml: "КонецПериодаОтображения", type: "string", enterprise: true },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", enterprise: true },
    font: { yaml: "Шрифт", type: "Font", enterprise: true },
    height: { yaml: "Высота", type: "number", enterprise: true },
    heightInMonths: { yaml: "ВысотаВМесяцах", type: "number", enterprise: true },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      xml: "GroupHorizontalAlign",
      enterprise: true,
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", enterprise: true },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", enterprise: true },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", enterprise: true },
    onMainServerUnavalableBehavior: {
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      type: "SystemEnumeration",
      typeSE: "OnMainServerUnavalableBehavior",
      enterprise: true,
    },
    readOnly: { yaml: "ТолькоПросмотр", type: "boolean", enterprise: true },
    selectionMode: {
      yaml: "РежимВыделения",
      type: "SystemEnumeration",
      typeSE: "DateSelectionMode",
      enterprise: true,
    },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string", enterprise: true },
    showCurrentDate: { yaml: "ОтображатьТекущуюДату", type: "boolean", enterprise: true },
    showMonthsPanel: { yaml: "ОтображатьПанельМесяцев", type: "boolean", enterprise: true },
    skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean", enterprise: true },
    // export interface PropertyRule {
    //   yaml: string
    //   yamlAlt?: string
    //   type: TypeRulesNames
    //   typeDetailed?: string
    //   xml?: string
    //   enterprise?: boolean
    // }
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartial: "other",
      enterprise: true,
    },
    titleFont: { yaml: "ШрифтЗаголовка", type: "Font", enterprise: true },
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number", enterprise: true },
    titleLocation: {
      yaml: "ПоложениеЗаголовка",
      type: "SystemEnumeration",
      typeSE: "FormItemTitleLocation",
      enterprise: true,
    },
    titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color", enterprise: true },
    toolTip: { yaml: "Подсказка", type: "I8nText", enterprise: true },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
      enterprise: true,
    },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlAlt: "ЗапретитьИспользование",
      type: "UserVisible",
      enterprise: true,
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      xml: "GroupVerticalAlign",
      enterprise: true,
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", enterprise: true },
    visible: { yaml: "Видимость", type: "boolean", enterprise: true },
    warningOnEdit: { yaml: "ПредупреждениеПриРедактировании", type: "I8nText", enterprise: true },
    warningOnEditRepresentation: {
      yaml: "ОтображениеПредупрежденияПриРедактировании",
      type: "SystemEnumeration",
      typeSE: "WarningOnEditRepresentation",
      enterprise: true,
    },
    width: { yaml: "Ширина", type: "number", enterprise: true },
    widthInMonths: { yaml: "ШиринаВМесяцах", type: "number", enterprise: true },
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
