import { externalPictureRule } from "~/metadata/commonObjects/externalPicture/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
export const MetadataCommonPictureRules = {
  itemType: "MetadataCommonPicture",
  metadataTargetOwner: { kind: "self", root: "CommonPicture" },
  itemTypePrefix: "ОбщаяКартинка",
  xmlDir: "CommonPictures",
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonPicture",
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
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
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
