import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const CalendarFieldRules = {
  itemType: "CalendarField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.CalendarField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    beginOfRepresentationPeriod: { yaml: "НачалоПериодаОтображения", type: "string" },
    border: { yaml: "Рамка", type: "Border", implicitValueYAML: "Single", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    calendarNavigation: { yaml: "ПеремещениеПоКалендарю", type: "boolean", implicitValueYAML: true },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", implicitValueYAML: false },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", implicitValueYAML: false },
    endOfRepresentationPeriod: { yaml: "КонецПериодаОтображения", type: "string" },
    font: { yaml: "Шрифт", type: "Font", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] } },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 9 },
    heightInMonths: { yaml: "ВысотаВМесяцах", type: "number", implicitValueYAML: 1 },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: true },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    selectionMode: {
      yaml: "РежимВыделения",
      type: "SystemEnumeration",
      typeSE: "DateSelectionMode",
      implicitValueYAML: "Single",
    },
    showCurrentDate: { yaml: "ОтображатьТекущуюДату", type: "boolean", implicitValueYAML: true },
    showMonthsPanel: { yaml: "ОтображатьПанельМесяцев", type: "boolean", implicitValueYAML: false },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", implicitValueYAML: true },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 16 },
    widthInMonths: { yaml: "ШиринаВМесяцах", type: "number", implicitValueYAML: 1 },
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
      allowedKinds: ["dateTime"],
      allowComposite: false,
    },
    ...formFieldDisabledTableRelatedProperties,
    ...formFieldCommonProperties,
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number", implicitValueYAML: 0 },
  },
} as const satisfies ElementRule

registerElementRule("CalendarField", CalendarFieldRules)
