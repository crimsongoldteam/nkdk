import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration"
import {
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET,
  getDataCompositionSchemaDataSetFieldKind,
} from "./kind"

type DataSetFieldKindOwner = Parameters<typeof getDataCompositionSchemaDataSetFieldKind>[0]

const isField = (item: DataSetFieldKindOwner) =>
  getDataCompositionSchemaDataSetFieldKind(item) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
const isFolder = (item: DataSetFieldKindOwner) =>
  getDataCompositionSchemaDataSetFieldKind(item) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER
const isNestedDataSet = (item: DataSetFieldKindOwner) =>
  getDataCompositionSchemaDataSetFieldKind(item) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET

const appearanceRule = {
  type: "AppearanceFields",
  xml: "dcssch:appearance",
  yaml: "Оформление",
  toXML: isField,
  order: 13,
  appearanceXml: "dataSetField",
} as const satisfies PropertyRule & { appearanceXml: "dataSetField" }

export const DataCompositionSchemaDataSetFieldRules = {
  itemType: "DataCompositionSchemaDataSetField",
  xsiType: "dcssch:DataSetFieldField",
  properties: {
    kind: {
      type: "DataCompositionSchemaDataSetFieldKind",
      xml: "_xsi:type",
      yaml: "Вид",
      defaultValue: DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
      toXML: (metadataItem) => metadataItem?.kind !== undefined,
      order: 0,
    },
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
      toXML: (metadataItem) => isField(metadataItem) || isNestedDataSet(metadataItem),
      order: 2,
    },
    role: {
      type: "string",
      xml: "dcssch:role",
      yaml: "Роль",
      toXML: isField,
      order: 7,
    },
    useRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      toXML: (metadataItem) => isField(metadataItem) || isFolder(metadataItem),
      order: 5,
    },
    attributeUseRestriction: {
      type: "CalculatedFieldUseRestriction",
      xml: "dcssch:attributeUseRestriction",
      yaml: "ОграничениеИспользованияРеквизитов",
      toXML: isField,
      order: 6,
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
      toXML: isField,
      order: 4,
    },
    valueType: {
      type: "TypeDescription",
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      toXML: isField,
      order: 12,
    },
    appearance: appearanceRule,
    editParameters: {
      type: "string",
      xml: "dcssch:editParameters",
      yaml: "ПараметрыРедактирования",
      toXML: isField,
      order: 14,
    },
    orderExpressions: {
      type: "string",
      xml: "dcssch:orderExpressions",
      yaml: "ВыраженияУпорядочивания",
      toXML: isField,
      order: 9,
    },
    presentationExpression: {
      type: "string",
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      toXML: isField,
      order: 8,
    },
    hierarchyCheckDataSet: {
      type: "string",
      xml: "dcssch:hierarchyCheckDataSet",
      yaml: "НаборДанныхПроверкиИерархии",
      toXML: isField,
      order: 10,
    },
    hierarchyCheckDataSetParameter: {
      type: "string",
      xml: "dcssch:hierarchyCheckDataSetParameter",
      yaml: "ПараметрНабораДанныхПроверкиИерархии",
      toXML: isField,
      order: 11,
    },
  },
} as const satisfies MetadataItemRule
