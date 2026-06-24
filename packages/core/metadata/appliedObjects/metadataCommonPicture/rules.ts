import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataCommonPictureRules = {
  itemType: "MetadataCommonPicture",
  itemTypePrefix: "ОбщаяКартинка",
  xmlDir: "CommonPictures",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "CommonPicture",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    picture: {
      type: "ExternalPicture",
      nkdkDir: "Картинка",
      xmlPath: "Ext/Picture.xml",
      payloadXmlDir: "Ext/Picture",
      toXML: false,
      fromXML: false,
    },
    availabilityForChoice: {
      yaml: "ДоступностьДляВыбора",
      xml: "AvailabilityForChoice",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    },
    availabilityForAppearance: {
      yaml: "ДоступностьДляОформления",
      xml: "AvailabilityForAppearance",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
