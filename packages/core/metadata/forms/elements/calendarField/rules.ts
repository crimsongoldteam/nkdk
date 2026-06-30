import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    beginOfRepresentationPeriod: stringRule({ yaml: "НачалоПериодаОтображения" }),
    border: {
      yaml: "Рамка",
      type: "Border",
      implicitValueYAML: "Single",
      metadataTarget: {
        kind: "object",
        roots: ["StyleItem"],
        filters: [{ kind: "styleItemType", values: ["Border"] }],
      },
    },
    borderColor: {
      yaml: "ЦветРамки",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    calendarNavigation: booleanRule({ yaml: "ПеремещениеПоКалендарю", implicitValueYAML: true }),
    enableDrag: booleanRule({ yaml: "РазрешитьПеретаскивание", implicitValueYAML: false }),
    enableStartDrag: booleanRule({ yaml: "РазрешитьНачалоПеретаскивания", implicitValueYAML: false }),
    endOfRepresentationPeriod: stringRule({ yaml: "КонецПериодаОтображения" }),
    font: {
      yaml: "Шрифт",
      type: "Font",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    },
    height: numberRule({ yaml: "Высота", implicitValueYAML: 9 }),
    heightInMonths: numberRule({ yaml: "ВысотаВМесяцах", implicitValueYAML: 1 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    selectionMode: systemEnumerationRule({
      yaml: "РежимВыделения",
      typeSE: "DateSelectionMode",
      implicitValueYAML: "Single",
    }),
    showCurrentDate: booleanRule({ yaml: "ОтображатьТекущуюДату", implicitValueYAML: true }),
    showMonthsPanel: booleanRule({ yaml: "ОтображатьПанельМесяцев", implicitValueYAML: false }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 16 }),
    widthInMonths: numberRule({ yaml: "ШиринаВМесяцах", implicitValueYAML: 1 }),
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
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
  },
} as const satisfies ElementRule
registerElementRule("CalendarField", CalendarFieldRules)
