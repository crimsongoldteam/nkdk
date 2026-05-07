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
    },
    title: {
      type: "DcsLocalStringType",
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 3,
    },
    useRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 4,
    },
    presentationExpression: {
      type: "string",
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      order: 5,
    },
    orderExpressions: {
      type: "CalculatedFieldOrderExpression",
      xml: "dcssch:orderExpression",
      yaml: "ВыраженияУпорядочивания",
      order: 6,
    },
    valueType: {
      type: "TypeDescription",
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 7,
    },
  },
} as const satisfies MetadataItemRule
