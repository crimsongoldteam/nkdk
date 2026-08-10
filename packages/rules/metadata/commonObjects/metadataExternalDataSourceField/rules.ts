import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { booleanRule } from "../boolean/types"
import {
  attributeChoiceFragment,
  attributeFillFragment,
  attributePresentationFragment,
  metadataChildNameProperty,
} from "../metadataAttribute/fragments"
import { stringRule } from "../string/types"
import { uuidPropertyRule } from "../uuid/rule"

const propertiesParents = ["Properties"]
const presentation = attributePresentationFragment({}).properties
const choice = attributeChoiceFragment.properties

export const externalDataSourceFieldBaseProperties = {
  uuid: uuidPropertyRule,
  name: metadataChildNameProperty,
  ...presentation,
  synonym: {
    yaml: "Синоним",
    xml: "Synonym",
    type: "I8nText",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    excludeIfEqualNameYAML: true,
  },
  type: {
    yaml: "Тип",
    xml: "Type",
    type: "TypeDescription",
    required: true,
    xmlParents: propertiesParents,
  },
  ...attributeFillFragment.properties,
  fillChecking: choice.fillChecking,
  choiceParameterLinks: choice.choiceParameterLinks,
  choiceParameters: choice.choiceParameters,
  quickChoice: choice.quickChoice,
  createOnInput: choice.createOnInput,
  choiceHistoryOnInput: choice.choiceHistoryOnInput,
  choiceForm: choice.choiceForm,
} as const satisfies Record<string, PropertyRule>

const externalDataSourceServiceProperties = {
  objectBelonging: {
    yaml: "ПринадлежностьОбъекта",
    xml: "ObjectBelonging",
    type: "SystemEnumeration",
    typeSE: "ObjectBelonging",
    xmlParents: propertiesParents,
    implicitValueYAML: "Native",
    toYAML: false,
    fromYAML: false,
  },
  extendedConfigurationObject: {
    xml: "ExtendedConfigurationObject",
    type: "string",
    xmlParents: propertiesParents,
    runtimeOnly: true,
  },
} as const satisfies Record<string, PropertyRule>

export const externalDataSourceObjectServiceProperties = externalDataSourceServiceProperties

export const MetadataExternalDataSourceFieldRules = {
  itemType: "MetadataExternalDataSourceField",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "type",
    "passwordMode",
    "format",
    "editFormat",
    "toolTip",
    "markNegatives",
    "mask",
    "multiLine",
    "extendedEdit",
    "minValue",
    "maxValue",
    "fillFromFillingValue",
    "fillValue",
    "fillChecking",
    "choiceParameterLinks",
    "choiceParameters",
    "quickChoice",
    "createOnInput",
    "choiceHistoryOnInput",
    "choiceForm",
    "nameInDataSource",
    "readOnly",
    "allowNull",
    "uuid",
  ],
  properties: {
    ...externalDataSourceFieldBaseProperties,
    nameInDataSource: stringRule({
      yaml: "ИмяВИсточникеДанных",
      xml: "NameInDataSource",
      xmlParents: propertiesParents,
    }),
    readOnly: booleanRule({
      yaml: "ТолькоЧтение",
      xml: "ReadOnly",
      xmlParents: propertiesParents,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    allowNull: booleanRule({
      yaml: "РазрешитьNull",
      xml: "AllowNull",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    ...externalDataSourceServiceProperties,
  },
} as const satisfies MetadataItemRule
