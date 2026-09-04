import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { typeDescriptionRule } from "../../commonObjects/typeDescription/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataSessionParameterRules = {
  itemType: "MetadataSessionParameter",
  metadataTargetOwner: { kind: "self", root: "SessionParameter" },
  itemTypePrefix: "ПараметрСеанса",
  xmlDir: "SessionParameters",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "type",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "SessionParameter",
      rootAttributes: V8_MDCLASSES_ROOT,
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    type: typeDescriptionRule({
      ownerFactRole: "type",
      yaml: "Тип",
      xmlParents: properties,
      defaultValueXMLRaw: "",
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
