import { borderRule } from "../../../commonObjects/border/types"
import { colorRule } from "../../../commonObjects/color/types"
import { fontRule } from "../../../commonObjects/font/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import type { PropertyRule } from "../../../orchestration/property/types"
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
    border: borderRule({
      yaml: "Рамка",
      implicitValueYAML: "Single",
      metadataTarget: {
        kind: "object",
        roots: ["StyleItem"],
        filters: [{ kind: "styleItemType", values: ["Border"] }],
      },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    calendarNavigation: booleanRule({ yaml: "ПеремещениеПоКалендарю", implicitValueYAML: true }),
    enableDrag: booleanRule({ yaml: "РазрешитьПеретаскивание", implicitValueYAML: false }),
    enableStartDrag: booleanRule({ yaml: "РазрешитьНачалоПеретаскивания", implicitValueYAML: false }),
    endOfRepresentationPeriod: stringRule({ yaml: "КонецПериодаОтображения" }),
    font: fontRule({
      yaml: "Шрифт",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    }),
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
    events: eventsRule({
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
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      toYAML: false,
      fromYAML: false,
      defaultType: "dateTime",
      allowedKinds: ["dateTime"],
      allowComposite: false,
    }),
    ...formFieldDisabledTableRelatedProperties,
    ...formFieldCommonProperties,
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
  },
} as const satisfies ElementRule
registerElementRule("CalendarField", CalendarFieldRules)
