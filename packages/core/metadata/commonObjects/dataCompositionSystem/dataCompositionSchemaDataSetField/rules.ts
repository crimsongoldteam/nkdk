import { MetadataItemRule } from "~/metadata/orchestration"

export const DataCompositionSchemaDataSetFieldRules = {
  itemType: "DataCompositionSchemaDataSetField",
  xsiType: "dcssch:DataSetFieldField",
  properties: {
    dataPath: {
      type: "string",
      xml: "dcssch:dataPath",
      yaml: "ПутьКДанным",
      order: 1,
    },
    field: {
      type: "string",
      xml: "dcssch:field",
      yaml: "Поле",
      order: 2,
    },
    role: {
      type: "string",
      xml: "dcssch:role",
      yaml: "Роль",
      order: 3,
    },
    useRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      order: 4,
    },
    attributeUseRestriction: {
      type: "string",
      xml: "dcssch:attributeUseRestriction",
      yaml: "ОграничениеИспользованияРеквизитов",
      order: 5,
    },
    title: {
      type: "I8nText",
      xml: "dcssch:title",
      yaml: "Заголовок",
      typedXML: true,
      order: 6,
    },
    valueType: {
      type: "TypeDescription",
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      order: 7,
    },
    appearance: {
      type: "string",
      xml: "dcssch:appearance",
      yaml: "Оформление",
      order: 8,
    },
    editParameters: {
      type: "string",
      xml: "dcssch:editParameters",
      yaml: "ПараметрыРедактирования",
      order: 9,
    },
    orderExpressions: {
      type: "string",
      xml: "dcssch:orderExpressions",
      yaml: "ВыраженияУпорядочивания",
      order: 10,
    },
    presentationExpression: {
      type: "string",
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      order: 11,
    },
    hierarchyCheckDataSet: {
      type: "string",
      xml: "dcssch:hierarchyCheckDataSet",
      yaml: "НаборДанныхПроверкиИерархии",
      order: 12,
    },
    hierarchyCheckDataSetParameter: {
      type: "string",
      xml: "dcssch:hierarchyCheckDataSetParameter",
      yaml: "ПараметрНабораДанныхПроверкиИерархии",
      order: 13,
    },
  },
} as const satisfies MetadataItemRule
