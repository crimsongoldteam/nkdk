import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { templateRule } from "../../commonObjects/module/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
export const MetadataRoleRules = {
  itemType: "MetadataRole",
  metadataTargetOwner: { kind: "self", root: "Role" },
  itemTypePrefix: "Роль",
  xmlDir: "Roles",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Role",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    rights: templateRule({
      nkdkPath: "Rights.xml",
      xmlPath: "Ext/Rights.xml",
      toXML: false,
      fromXML: false,
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
