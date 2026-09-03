import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { typeDescriptionRule } from "../../commonObjects/typeDescription/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataDefinedTypeRules = {
  itemType: "MetadataDefinedType",
  metadataTargetOwner: { kind: "self", root: "DefinedType" },
  itemTypePrefix: "ОпределяемыйТип",
  xmlDir: "DefinedTypes",
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "type",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "DefinedType",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [{ name: "DefinedType", category: "DefinedType" }],
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
