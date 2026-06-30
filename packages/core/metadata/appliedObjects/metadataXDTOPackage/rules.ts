import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataXDTOPackageRules = {
  itemType: "MetadataXDTOPackage",
  metadataTargetOwner: { kind: "self", root: "XDTOPackage" },
  itemTypePrefix: "ПакетXDTO",
  xmlDir: "XDTOPackages",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "XDTOPackage",
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
    namespace: {
      yaml: "ПространствоИмен",
      xml: "Namespace",
      type: "string",
      xmlParents: properties,
      required: true,
    },
    package: {
      type: "ExternalFile",
      nkdkPath: "Package.bin",
      xmlPath: "Ext/Package.bin",
      syncExternalOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
