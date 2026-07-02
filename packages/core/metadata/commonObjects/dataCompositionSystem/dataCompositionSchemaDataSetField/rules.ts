import { dcsAvailableValuesRule } from "../availableValues/types"
import {
  calculatedFieldUseRestrictionRule,
  type CalculatedFieldUseRestrictionRuleParams,
} from "../calculatedField/builders"
import {
  dataCompositionSchemaDataSetFieldKindRule,
  type DataCompositionSchemaDataSetFieldKindRuleParams,
} from "./builders"
import { dcsLocalStringTypeRule } from "../dcsLocalStringType/types"
import { typeDescriptionRule } from "../../typeDescription/types"
import { stringRule, type StringRuleParams } from "../../string/types"
import { MetadataItemRule } from "../../../orchestration"
import type { AppearanceFieldsPropertyRule } from "../appearanceFields/rules"
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
} as const satisfies AppearanceFieldsPropertyRule
export const DataCompositionSchemaDataSetFieldRules = {
  itemType: "DataCompositionSchemaDataSetField",
  xsiType: "dcssch:DataSetFieldField",
  properties: {
    kind: dataCompositionSchemaDataSetFieldKindRule({
      xml: "_xsi:type",
      yaml: "Вид",
      defaultValue: DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
      toXML: (metadataItem: DataSetFieldKindOwner) => metadataItem?.kind !== undefined,
      order: 0,
    } satisfies DataCompositionSchemaDataSetFieldKindRuleParams),
    dataPath: stringRule({
      xml: "dcssch:dataPath",
      yaml: "ПутьКДанным",
      order: 1,
    }),
    field: stringRule({
      xml: "dcssch:field",
      yaml: "Поле",
      toXML: (metadataItem) => isField(metadataItem) || isNestedDataSet(metadataItem),
      order: 2,
    } satisfies StringRuleParams),
    role: stringRule({
      xml: "dcssch:role",
      yaml: "Роль",
      toXML: isField,
      order: 7,
    }),
    useRestriction: calculatedFieldUseRestrictionRule({
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      toXML: (metadataItem: DataSetFieldKindOwner) => isField(metadataItem) || isFolder(metadataItem),
      order: 5,
    } satisfies CalculatedFieldUseRestrictionRuleParams),
    attributeUseRestriction: calculatedFieldUseRestrictionRule({
      xml: "dcssch:attributeUseRestriction",
      yaml: "ОграничениеИспользованияРеквизитов",
      toXML: isField,
      order: 6,
    }),
    title: dcsLocalStringTypeRule({
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 3,
    }),
    availableValues: dcsAvailableValuesRule({
      xml: "dcssch:availableValue",
      yaml: "ДоступныеЗначения",
      toXML: isField,
      order: 4,
    }),
    valueType: typeDescriptionRule({
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      toXML: isField,
      order: 12,
    }),
    appearance: appearanceRule,
    editParameters: stringRule({
      xml: "dcssch:editParameters",
      yaml: "ПараметрыРедактирования",
      toXML: isField,
      order: 14,
    }),
    orderExpressions: stringRule({
      xml: "dcssch:orderExpressions",
      yaml: "ВыраженияУпорядочивания",
      toXML: isField,
      order: 9,
    }),
    presentationExpression: stringRule({
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      toXML: isField,
      order: 8,
    }),
    hierarchyCheckDataSet: stringRule({
      xml: "dcssch:hierarchyCheckDataSet",
      yaml: "НаборДанныхПроверкиИерархии",
      toXML: isField,
      order: 10,
    }),
    hierarchyCheckDataSetParameter: stringRule({
      xml: "dcssch:hierarchyCheckDataSetParameter",
      yaml: "ПараметрНабораДанныхПроверкиИерархии",
      toXML: isField,
      order: 11,
    }),
  },
} as const satisfies MetadataItemRule
