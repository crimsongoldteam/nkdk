import { appearanceFieldsRule } from "~/metadata/commonObjects/dataCompositionSystem/appearanceFields/types"
import { dcsAvailableValuesRule } from "~/metadata/commonObjects/dataCompositionSystem/availableValues/types"
import {
  calculatedFieldOrderExpressionRule,
  calculatedFieldUseRestrictionRule,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedField/types"
import { dcsLocalStringTypeRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const CalculatedFieldRules = {
  itemType: "CalculatedField",
  properties: {
    dataPath: stringRule({
      xml: "dcssch:dataPath",
      yaml: "ПутьКДанным",
      order: 1,
    }),
    expression: stringRule({
      xml: "dcssch:expression",
      yaml: "Выражение",
      order: 2,
      defaultValueXMLEmpty: "",
    }),
    title: dcsLocalStringTypeRule({
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 3,
    }),
    availableValues: dcsAvailableValuesRule({
      xml: "dcssch:availableValue",
      yaml: "ДоступныеЗначения",
      order: 4,
    }),
    appearance: appearanceFieldsRule({
      xml: "dcssch:appearance",
      yaml: "Оформление",
      order: 5,
    }),
    useRestriction: calculatedFieldUseRestrictionRule({
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 6,
    }),
    presentationExpression: stringRule({
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      order: 7,
    }),
    orderExpressions: calculatedFieldOrderExpressionRule({
      xml: "dcssch:orderExpression",
      yaml: "ВыраженияУпорядочивания",
      order: 8,
    }),
    valueType: typeDescriptionRule({
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 9,
    }),
  },
} as const satisfies MetadataItemRule
