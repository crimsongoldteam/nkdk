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
      order: 1,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      order: 2,
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      order: 3,
    },
    source: {
      yaml: "Источник",
      type: "TypeDescription",
      xmlParents: properties,
      order: 4,
    },
    event: {
      yaml: "Событие",
      type: "string",
      xmlParents: properties,
      order: 5,
    },
    handler: {
      yaml: "Обработчик",
      type: "string",
      xmlParents: properties,
      order: 6,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
      order: 7,
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
