import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]
const childObjectsParents = ["ChildObjects"]

export const MetadataHTTPServiceURLTemplateRules = {
  itemType: "MetadataHTTPServiceURLTemplate",
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
    template: {
      yaml: "Шаблон",
      xml: "Template",
      type: "string",
      xmlParents: propertiesParents,
    },
    methods: {
      yaml: "Методы",
      xml: "Method",
      type: "MetadataHTTPServiceMethods",
      xmlParents: childObjectsParents,
      defaultValue: [],
      defaultValueXMLRaw: {},
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: propertiesParents,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: propertiesParents,
      runtimeOnly: true,
    },
  } satisfies Record<string, PropertyRule>,
} as const satisfies MetadataItemRule
