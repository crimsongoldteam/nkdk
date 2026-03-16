import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const CalendarFieldRules = {
  itemType: "CalendarField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.CalendarField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    beginOfRepresentationPeriod: { yaml: "НачалоПериодаОтображения", type: "string" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    calendarNavigation: { yaml: "ПеремещениеПоКалендарю", type: "boolean" },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean" },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean" },
    endOfRepresentationPeriod: { yaml: "КонецПериодаОтображения", type: "string" },
    font: { yaml: "Шрифт", type: "Font" },
    height: { yaml: "Высота", type: "number" },
    heightInMonths: { yaml: "ВысотаВМесяцах", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    selectionMode: {
      yaml: "РежимВыделения",
      type: "SystemEnumeration",
      typeSE: "DateSelectionMode",
    },
    showCurrentDate: { yaml: "ОтображатьТекущуюДату", type: "boolean" },
    showMonthsPanel: { yaml: "ОтображатьПанельМесяцев", type: "boolean" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    widthInMonths: { yaml: "ШиринаВМесяцах", type: "number" },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
        dragStart: "НачалоПеретаскивания",
        dragEnd: "ОкончаниеПеретаскивания",
        drag: "Перетаскивание",
        onActivateDate: "ПриАктивизацииДаты",
        onPeriodOutput: "ПриВыводеПериода",
        dragCheck: "ПроверкаПеретаскивания",
      },
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      toYAML: false,
      fromYAML: false,
      defaultType: "dateTime",
    },
    ...formFieldCommonProperties,
  },
} as const satisfies ElementRule

registerElementRule("CalendarField", CalendarFieldRules)
