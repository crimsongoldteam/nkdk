import { appearanceFieldsRule } from "../appearanceFields/builders"
import { dcsAvailableValuesRule } from "../availableValues/types"
import { calculatedFieldOrderExpressionRule, calculatedFieldUseRestrictionRule } from "./builders"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { typeDescriptionRule } from "../../typeDescription/types"
import { stringRule } from "../../string/types"
import { MetadataItemRule } from "../../../ruleRuntime"
export const CalculatedFieldRules = {
  itemType: "CalculatedField",
  xmlOrder: [
    "dataPath",
    "expression",
    "title",
    "appearance",
    "useRestriction",
    "availableValues",
    "presentationExpression",
    "orderExpressions",
    "valueType",
  ],
  properties: {
    dataPath: stringRule({
      xml: "dcssch:dataPath",
      yaml: "ПутьКДанным",
    }),
    expression: stringRule({
      xml: "dcssch:expression",
      yaml: "Выражение",
      defaultValueXMLEmpty: "",
    }),
    title: dcsLocalStringTypeRule({
      xml: "dcssch:title",
      yaml: "Заголовок",
    }),
    availableValues: dcsAvailableValuesRule({
      xml: "dcssch:availableValue",
      yaml: "ДоступныеЗначения",
    }),
    appearance: appearanceFieldsRule({
      xml: "dcssch:appearance",
      yaml: "Оформление",
    }),
    useRestriction: calculatedFieldUseRestrictionRule({
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
    }),
    presentationExpression: stringRule({
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
    }),
    orderExpressions: calculatedFieldOrderExpressionRule({
      xml: "dcssch:orderExpression",
      yaml: "ВыраженияУпорядочивания",
    }),
    valueType: typeDescriptionRule({
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
    }),
  },
} as const satisfies MetadataItemRule
