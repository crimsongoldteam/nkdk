import {
  externalDataSourceObjectServiceProperties,
} from "~/metadata/commonObjects/metadataExternalDataSourceField/rules"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]

export const MetadataExternalDataSourceFunctionRules = {
  itemType: "MetadataExternalDataSourceFunction",
  properties: {
    uuid: uuidPropertyRule,
    name: {
      xml: "Name",
      type: "string",
      required: true,
      xmlParents: propertiesParents,
    },
    synonym: {
      yaml: "Синоним",
      xml: "Synonym",
      type: "I8nText",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    returnValue: {
      yaml: "ВозвращаемоеЗначение",
      xml: "ReturnValue",
      type: "boolean",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      implicitValueYAML: true,
    },
    type: {
      yaml: "Тип",
      xml: "Type",
      type: "TypeDescription",
      required: true,
      xmlParents: propertiesParents,
    },
    expressionInDataSource: {
      yaml: "ВыражениеВИсточникеДанных",
      xml: "ExpressionInDataSource",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    ...externalDataSourceObjectServiceProperties,
  },
} as const satisfies MetadataItemRule
