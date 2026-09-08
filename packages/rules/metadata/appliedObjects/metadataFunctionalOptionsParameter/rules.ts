import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataFunctionalOptionsParameterRules = {
  itemType: "MetadataFunctionalOptionsParameter",
  metadataTargetOwner: { kind: "self", root: "FunctionalOptionsParameter" },
  itemTypePrefix: "ПараметрФункциональныхОпций",
  xmlDir: "FunctionalOptionsParameters",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "use",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "FunctionalOptionsParameter",
      rootAttributes: V8_MDCLASSES_ROOT,
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    use: metadataItemLinksRule({
      yaml: "Использование",
      metadataTarget: { kind: "member", owner: "explicit", allowOwner: true },
      xml: "Use",
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
