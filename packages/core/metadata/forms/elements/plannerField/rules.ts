import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldDisabledTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const PlannerFieldRules = {
  itemType: "PlannerField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PlannerField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
    commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false },
    dimensionItemHyperlink: booleanRule({ yaml: "ГиперссылкаЭлементаИзмерения", implicitValueYAML: false }),
    enableDrag: booleanRule({ yaml: "РазрешитьПеретаскивание", implicitValueYAML: false, toEnterprise: false }),
    enableStartDrag: booleanRule({
      yaml: "РазрешитьНачалоПеретаскивания",
      implicitValueYAML: false,
      toEnterprise: false,
    }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 10 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    timeScaleItemHyperlink: booleanRule({ yaml: "ГиперссылкаЭлементаШкалыВремени", implicitValueYAML: false }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 50 }),
    wrappedTimeScaleHeaderHyperlink: booleanRule({
      yaml: "ГиперссылкаПеренесенногоЗаголовкаШкалыВремени",
      implicitValueYAML: false,
    }),
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        selection: "Выбор",
        plannerActionClick: "НажатиеНаДействиеПланировщика",
        uRLClick: "НажатиеНаНавигационнойСсылке",
        wrappedTimeScaleHeaderClick: "НажатиеНаПеренесенномЗаголовкеШкалыВремени",
        dimensionItemClick: "НажатиеНаЭлементеИзмерения",
        timeScaleItemClick: "НажатиеНаЭлементеШкалыВремени",
        dragStart: "НачалоПеретаскивания",
        commandGenerateProcessing: "ОбработкаФормированияКоманд",
        dragEnd: "ОкончаниеПеретаскивания",
        beforeStartQuickEdit: "ПередНачаломБыстрогоРедактирования",
        beforeStartEdit: "ПередНачаломРедактирования",
        beforePrint: "ПередПечатью",
        beforeExpandDimensionItem: "ПередРазворачиваниемЭлементаИзмерения",
        beforeCollapseDimensionItem: "ПередСворачиваниемЭлементаИзмерения",
        beforeCreate: "ПередСозданием",
        beforeDelete: "ПередУдалением",
        drag: "Перетаскивание",
        onActivate: "ПриАктивизации",
        onEditEnd: "ПриОкончанииРедактирования",
        onCurrentRepresentationPeriodChange: "ПриСменеТекущегоПериодаОтображения",
        dragCheck: "ПроверкаПеретаскивания",
        insideDragCheck: "ПроверкаПеретаскиванияВнутри",
      },
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      toYAML: false,
      fromYAML: false,
      defaultType: "Planner",
    },
    ...formFieldCommonProperties,
    ...formFieldDisabledTableRelatedProperties,
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
  },
} as const satisfies ElementRule
registerElementRule("PlannerField", PlannerFieldRules)
