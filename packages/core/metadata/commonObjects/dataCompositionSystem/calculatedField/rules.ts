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
    appearance: {
      type: "AppearanceFields",
      xml: "dcssch:appearance",
      yaml: "Оформление",
      order: 4,
    },
    useRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 5,
    },
    presentationExpression: {
      type: "string",
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      order: 6,
    },
    orderExpressions: {
      type: "CalculatedFieldOrderExpression",
      xml: "dcssch:orderExpression",
      yaml: "ВыраженияУпорядочивания",
      order: 7,
    },
    valueType: {
      type: "TypeDescription",
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 8,
    },
  },
} as const satisfies MetadataItemRule
