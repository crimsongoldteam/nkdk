import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]

export const MetadataIntegrationServiceChannelRules = {
  itemType: "MetadataIntegrationServiceChannel",
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
    externalIntegrationServiceChannelName: {
      yaml: "ИмяКаналаВнешнегоСервисаИнтеграции",
      xml: "ExternalIntegrationServiceChannelName",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    messageDirection: {
      yaml: "НаправлениеСообщения",
      xml: "MessageDirection",
      type: "SystemEnumeration",
      typeSE: "IntegrationServiceChannelMessageDirection",
      xmlParents: propertiesParents,
    },
    receiveMessageProcessing: {
      yaml: "ОбработкаПолученияСообщения",
      xml: "ReceiveMessageProcessing",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
    },
    transactioned: {
      yaml: "Транзакционный",
      xml: "Transactioned",
      type: "boolean",
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
