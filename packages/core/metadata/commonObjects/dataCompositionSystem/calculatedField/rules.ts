import { MetadataItemRule } from "~/metadata/orchestration"

export const CalculatedFieldRules = {
  itemType: "CalculatedField",
  properties: {
    dataPath: {
      type: "string",
      xml: "dcssch:dataPath",
      yaml: "ПутьКДанным",
      order: 1,
    },
    expression: {
      type: "string",
      xml: "dcssch:expression",
      yaml: "Выражение",
      order: 2,
      defaultValueXMLEmpty: "",
    },
    title: {
      type: "DcsLocalStringType",
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 3,
    },
    availableValues: {
      type: "DcsAvailableValues",
      xml: "dcssch:availableValue",
      yaml: "ДоступныеЗначения",
      order: 4,
    },
    appearance: {
      type: "AppearanceFields",
      xml: "dcssch:appearance",
      yaml: "Оформление",
      order: 5,
    },
    useRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 6,
    },
    presentationExpression: {
      type: "string",
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      order: 7,
    },
    orderExpressions: {
      type: "CalculatedFieldOrderExpression",
      xml: "dcssch:orderExpression",
      yaml: "ВыраженияУпорядочивания",
      order: 8,
    },
    valueType: {
      type: "TypeDescription",
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 9,
    },
  },
} as const satisfies MetadataItemRule
