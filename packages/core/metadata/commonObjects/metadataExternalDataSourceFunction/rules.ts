import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { externalDataSourceObjectServiceProperties } from "~/metadata/commonObjects/metadataExternalDataSourceField/rules"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const propertiesParents = ["Properties"]
export const MetadataExternalDataSourceFunctionRules = {
  itemType: "MetadataExternalDataSourceFunction",
  properties: {
    uuid: uuidPropertyRule,
    name: stringRule({
      xml: "Name",
      required: true,
      xmlParents: propertiesParents,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    }),
    returnValue: booleanRule({
      yaml: "ВозвращаемоеЗначение",
      xml: "ReturnValue",
      xmlParents: propertiesParents,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    type: {
      yaml: "Тип",
      xml: "Type",
      type: "TypeDescription",
      required: true,
      xmlParents: propertiesParents,
    },
    expressionInDataSource: stringRule({
      yaml: "ВыражениеВИсточникеДанных",
      xml: "ExpressionInDataSource",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    }),
    ...externalDataSourceObjectServiceProperties,
  },
} as const satisfies MetadataItemRule
