import { uuidPropertyRule } from "../uuid/rule"
import { getParentFromContext } from "../../context/helpers"
import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { internalInfoRule } from "../internalInfo/types"

const propertiesParents = ["Properties"]

export const MetadataIntegrationServiceChannelRules = {
  itemType: "MetadataIntegrationServiceChannel",
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "externalIntegrationServiceChannelName",
    "messageDirection",
    "receiveMessageProcessing",
    "transactioned",
    "uuid",
  ],
  properties: {
    uuid: uuidPropertyRule,
    internalInfo: internalInfoRule({
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const parent = getParentFromContext(params.context, ["MetadataIntegrationService"])
        return `${parent.name}.${params.metadata.name}`
      },
      items: [{ name: "IntegrationServiceChannelManager", category: "Manager" }],
    }),
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
      excludeIfEqualNameYAML: true,
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
      implicitValueYAML: "Send",
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
      implicitValueYAML: true,
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
