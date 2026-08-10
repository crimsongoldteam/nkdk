import { typeDescriptionRule } from "../../commonObjects/typeDescription/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataEventSubscriptionRules = {
  itemType: "MetadataEventSubscription",
  metadataTargetOwner: { kind: "self", root: "EventSubscription" },
  itemTypePrefix: "ПодпискаНаСобытие",
  xmlDir: "EventSubscriptions",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "source",
    "event",
    "handler",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "EventSubscription",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: properties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    source: typeDescriptionRule({
      yaml: "Источник",
      xmlParents: properties,
    }),
    event: stringRule({
      yaml: "Событие",
      xmlParents: properties,
    }),
    handler: stringRule({
      yaml: "Обработчик",
      xmlParents: properties,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
