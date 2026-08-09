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
import { MetadataItemRule } from "../../../ruleRuntime"
import type { YAMLPropertySource } from "../../../ruleRuntime/property/fromYAMLToXMLTypes"
import type { AppearanceFieldsPropertyRule } from "../appearanceFields/rules"
import {
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER,
  DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET,
  getDataCompositionSchemaDataSetFieldKind,
} from "./kind"
const kindFromSource = (source: YAMLPropertySource) =>
  getDataCompositionSchemaDataSetFieldKind({ kind: source.raw("kind") as never })
const isField = (source: YAMLPropertySource) =>
  kindFromSource(source) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD
const isFolder = (source: YAMLPropertySource) =>
  kindFromSource(source) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FOLDER
const isNestedDataSet = (source: YAMLPropertySource) =>
  kindFromSource(source) === DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_NESTED_DATA_SET
const appearanceRule = {
  type: "AppearanceFields",
  xml: "dcssch:appearance",
  yaml: "Оформление",
  toXML: isField,
  configurationIndexAddressing: "yamlPath",
} as const satisfies AppearanceFieldsPropertyRule
export const DataCompositionSchemaDataSetFieldRules = {
  itemType: "DataCompositionSchemaDataSetField",
  xsiType: "dcssch:DataSetFieldField",
  xmlOrder: [
    "dataPath",
    "field",
    "title",
    "useRestriction",
    "attributeUseRestriction",
    "availableValues",
    "presentationExpression",
    "valueType",
    "appearance",
    "kind",
  ],
  properties: {
    kind: dataCompositionSchemaDataSetFieldKindRule({
      xml: "_xsi:type",
      yaml: "Вид",
      defaultValue: DATA_COMPOSITION_SCHEMA_DATA_SET_FIELD_KIND_FIELD,
      toXML: (source: YAMLPropertySource) => source.has("kind"),
    } satisfies DataCompositionSchemaDataSetFieldKindRuleParams),
    dataPath: stringRule({
      xml: "dcssch:dataPath",
      yaml: "ПутьКДанным",
    }),
    field: stringRule({
      xml: "dcssch:field",
      yaml: "Поле",
      toXML: (metadataItem) => isField(metadataItem) || isNestedDataSet(metadataItem),
    } satisfies StringRuleParams),
    role: stringRule({
      xml: "dcssch:role",
      yaml: "Роль",
      toXML: isField,
    }),
    useRestriction: calculatedFieldUseRestrictionRule({
      xml: "dcssch:useRestriction",
      yaml: "ОграничениеИспользования",
      toXML: (source: YAMLPropertySource) => isField(source) || isFolder(source),
    } satisfies CalculatedFieldUseRestrictionRuleParams),
    attributeUseRestriction: calculatedFieldUseRestrictionRule({
      xml: "dcssch:attributeUseRestriction",
      yaml: "ОграничениеИспользованияРеквизитов",
      toXML: isField,
    }),
    title: dcsLocalStringTypeRule({
      xml: "dcssch:title",
      yaml: "Заголовок",
    }),
    availableValues: dcsAvailableValuesRule({
      xml: "dcssch:availableValue",
      yaml: "ДоступныеЗначения",
      toXML: isField,
    }),
    valueType: typeDescriptionRule({
      xml: "dcssch:valueType",
      yaml: "ТипЗначения",
      toXML: isField,
    }),
    appearance: appearanceRule,
    editParameters: stringRule({
      xml: "dcssch:editParameters",
      yaml: "ПараметрыРедактирования",
      toXML: isField,
    }),
    orderExpressions: stringRule({
      xml: "dcssch:orderExpressions",
      yaml: "ВыраженияУпорядочивания",
      toXML: isField,
    }),
    presentationExpression: stringRule({
      xml: "dcssch:presentationExpression",
      yaml: "ВыражениеПредставления",
      toXML: isField,
    }),
    hierarchyCheckDataSet: stringRule({
      xml: "dcssch:hierarchyCheckDataSet",
      yaml: "НаборДанныхПроверкиИерархии",
      toXML: isField,
    }),
    hierarchyCheckDataSetParameter: stringRule({
      xml: "dcssch:hierarchyCheckDataSetParameter",
      yaml: "ПараметрНабораДанныхПроверкиИерархии",
      toXML: isField,
    }),
  },
} as const satisfies MetadataItemRule
