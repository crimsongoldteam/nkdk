import { templateRule } from "../../commonObjects/module/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataRoleRules = {
  itemType: "MetadataRole",
  metadataTargetOwner: { kind: "self", root: "Role" },
  itemTypePrefix: "Роль",
  xmlDir: "Roles",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Role",
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
    rights: templateRule({
      nkdkPath: "Rights.xml",
      xmlPath: "Ext/Rights.xml",
      toXML: false,
      fromXML: false,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
