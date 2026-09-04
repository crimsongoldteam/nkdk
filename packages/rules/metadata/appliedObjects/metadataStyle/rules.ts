import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { templateRule } from "../../commonObjects/module/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
export const MetadataStyleRules = {
  itemType: "MetadataStyle",
  metadataTargetOwner: { kind: "self", root: "Style" },
  itemTypePrefix: "Стиль",
  xmlDir: "Styles",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Style",
      rootAttributes: V8_MDCLASSES_ROOT,
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    style: templateRule({
      nkdkPath: "Style.xml",
      xmlPath: "Ext/Style.xml",
      toXML: false,
      fromXML: false,
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
