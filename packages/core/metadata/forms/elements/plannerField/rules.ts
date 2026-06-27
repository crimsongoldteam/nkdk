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
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false },
    dimensionItemHyperlink: { yaml: "ГиперссылкаЭлементаИзмерения", type: "boolean" },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", toEnterprise: false },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", toEnterprise: false },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    timeScaleItemHyperlink: { yaml: "ГиперссылкаЭлементаШкалыВремени", type: "boolean" },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    wrappedTimeScaleHeaderHyperlink: { yaml: "ГиперссылкаПеренесенногоЗаголовкаШкалыВремени", type: "boolean" },
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
  },
} as const satisfies ElementRule

registerElementRule("PlannerField", PlannerFieldRules)
