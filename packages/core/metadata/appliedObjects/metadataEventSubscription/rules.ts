import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataEventSubscriptionRules = {
  itemType: "MetadataEventSubscription",
  itemTypePrefix: "ПодпискаНаСобытие",
  xmlDir: "EventSubscriptions",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "EventSubscription",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    source: {
      yaml: "Источник",
      type: "TypeDescription",
      xmlParents: properties,
    },
    event: {
      yaml: "Событие",
      type: "string",
      xmlParents: properties,
    },
    handler: {
      yaml: "Обработчик",
      type: "string",
      xmlParents: properties,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      defaultValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
