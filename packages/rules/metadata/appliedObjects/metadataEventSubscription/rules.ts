import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { typeDescriptionRule } from "../../commonObjects/typeDescription/types"
import { stringRule } from "../../commonObjects/string/types"
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
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
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
