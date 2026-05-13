import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]

export const MetadataHTTPServiceMethodRules = {
  itemType: "MetadataHTTPServiceMethod",
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
    httpMethod: {
      yaml: "HTTPМетод",
      xml: "HTTPMethod",
      type: "SystemEnumeration",
      typeSE: "HTTPMethod",
      xmlParents: propertiesParents,
      defaultValueXML: "GET",
      preserveExplicitDefaultXML: true,
    },
    handler: {
      yaml: "Обработчик",
      xml: "Handler",
      type: "string",
      xmlParents: propertiesParents,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: propertiesParents,
      toYAML: false,
      fromYAML: false,
      defaultValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: propertiesParents,
      runtimeOnly: true,
    },
  } satisfies Record<string, PropertyRule>,
} as const satisfies MetadataItemRule
