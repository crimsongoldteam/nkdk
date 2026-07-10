import { externalFileRule } from "../../commonObjects/externalFile/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataXDTOPackageRules = {
  itemType: "MetadataXDTOPackage",
  metadataTargetOwner: { kind: "self", root: "XDTOPackage" },
  itemTypePrefix: "ПакетXDTO",
  xmlDir: "XDTOPackages",
  properties: {
    xmlRoot: xmlRootRule({
      container: "XDTOPackage",
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
    namespace: stringRule({
      yaml: "ПространствоИмен",
      xml: "Namespace",
      xmlParents: properties,
      required: true,
    }),
    package: externalFileRule({
      nkdkPath: "Package.bin",
      xmlPath: "Ext/Package.bin",
      syncExternalOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
