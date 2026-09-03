import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { externalPictureRule } from "../../commonObjects/externalPicture/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataCommonPictureRules = {
  itemType: "MetadataCommonPicture",
  metadataTargetOwner: { kind: "self", root: "CommonPicture" },
  itemTypePrefix: "ОбщаяКартинка",
  xmlDir: "CommonPictures",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "availabilityForChoice",
    "availabilityForAppearance",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonPicture",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    picture: externalPictureRule({
      nkdkDir: "Картинка",
      xmlPath: "Ext/Picture.xml",
      payloadXmlDir: "Ext/Picture",
      toXML: false,
      fromXML: false,
    }),
    availabilityForChoice: booleanRule({
      yaml: "ДоступностьДляВыбора",
      xml: "AvailabilityForChoice",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    availabilityForAppearance: booleanRule({
      yaml: "ДоступностьДляОформления",
      xml: "AvailabilityForAppearance",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
