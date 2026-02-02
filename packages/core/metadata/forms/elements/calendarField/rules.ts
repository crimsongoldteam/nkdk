import { NamedElement } from "../baseElement/types"
import { CalendarField } from "./types"

export interface PropertyRule {
  yaml: string
  yamlAlt?: string
  type: string
  typeDetailed?: string
  xml?: string
  enterprise?: boolean
}

export interface ElementRule<T extends NamedElement> {
  properties?: Partial<Record<Capitalize<Extract<keyof T, string>>, PropertyRule>>
  events?: Record<string, string>
}

export const CalendarFieldRules: ElementRule<CalendarField> = {
  properties: {
    AutoCellHeight: { yaml: "АвтоВысотаЯчейки", type: "boolean", enterprise: true },
    AutoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", enterprise: true },
    AutoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", enterprise: true },
    BeginOfRepresentationPeriod: { yaml: "НачалоПериодаОтображения", type: "string", enterprise: true },
    Border: { yaml: "Рамка", type: "Border", enterprise: true },
    BorderColor: { yaml: "ЦветРамки", type: "Color", enterprise: true },
    CalendarNavigation: { yaml: "ПеремещениеПоКалендарю", type: "boolean", enterprise: true },
    CellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean", enterprise: true },
    ContextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu", enterprise: true },
    DataPath: { yaml: "ПутьКДанным", type: "string", enterprise: true },
    DefaultItem: { yaml: "АктивизироватьПоУмолчанию", type: "boolean", enterprise: true },
    DisplayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "DisplayImportance",
      enterprise: true,
    },
    EnableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", enterprise: true },
    EnableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", enterprise: true },
    Enabled: { yaml: "Доступность", type: "boolean", enterprise: true },
    EndOfRepresentationPeriod: { yaml: "КонецПериодаОтображения", type: "string", enterprise: true },
    ExtendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", enterprise: true },
    Font: { yaml: "Шрифт", type: "Font", enterprise: true },
    Height: { yaml: "Высота", type: "number", enterprise: true },
    HeightInMonths: { yaml: "ВысотаВМесяцах", type: "number", enterprise: true },
    HorizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложение",
      type: "ItemHorizontalLocation",
      xml: "GroupHorizontalAlign",
      enterprise: true,
    },
    HorizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", enterprise: true },
    MaxHeight: { yaml: "МаксимальнаяВысота", type: "number", enterprise: true },
    MaxWidth: { yaml: "МаксимальнаяШирина", type: "number", enterprise: true },
    OnMainServerUnavalableBehavior: {
      yaml: "ПоведениеПриНедоступностиОсновногоСервера",
      type: "OnMainServerUnavalableBehavior",
      enterprise: true,
    },
    ReadOnly: { yaml: "ТолькоПросмотр", type: "boolean", enterprise: true },
    SelectionMode: { yaml: "РежимВыделения", type: "DateSelectionMode", enterprise: true },
    Shortcut: { yaml: "СочетаниеКлавиш", type: "string", enterprise: true },
    ShowCurrentDate: { yaml: "ОтображатьТекущуюДату", type: "boolean", enterprise: true },
    ShowMonthsPanel: { yaml: "ОтображатьПанельМесяцев", type: "boolean", enterprise: true },
    SkipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean", enterprise: true },
    Title: { yaml: "Заголовок", type: "I8nText", enterprise: true },
    TitleFont: { yaml: "ШрифтЗаголовка", type: "Font", enterprise: true },
    TitleHeight: { yaml: "ВысотаЗаголовка", type: "number", enterprise: true },
    TitleLocation: { yaml: "ПоложениеЗаголовка", type: "FormItemTitleLocation", enterprise: true },
    TitleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color", enterprise: true },
    ToolTip: { yaml: "Подсказка", type: "I8nText", enterprise: true },
    ToolTipRepresentation: { yaml: "ОтображениеПодсказки", type: "ToolTipRepresentation", enterprise: true },
    UserVisible: {
      yaml: "РазрешитьИспользование",
      yamlAlt: "ЗапретитьИспользование",
      type: "UserVisible",
      enterprise: true,
    },
    VerticalAlignInGroup: {
      yaml: "ВертикальноеПоложение",
      type: "ItemVerticalAlign",
      xml: "GroupVerticalAlign",
      enterprise: true,
    },
    VerticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", enterprise: true },
    Visible: { yaml: "Видимость", type: "boolean", enterprise: true },
    WarningOnEdit: { yaml: "ПредупреждениеПриРедактировании", type: "I8nText", enterprise: true },
    WarningOnEditRepresentation: {
      yaml: "ОтображениеПредупрежденияПриРедактировании",
      type: "WarningOnEditRepresentation",
      enterprise: true,
    },
    Width: { yaml: "Ширина", type: "number", enterprise: true },
    WidthInMonths: { yaml: "ШиринаВМесяцах", type: "number", enterprise: true },
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
