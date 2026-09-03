import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { externalFileRule } from "../../commonObjects/externalFile/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataXDTOPackageRules = {
  itemType: "MetadataXDTOPackage",
  metadataTargetOwner: { kind: "self", root: "XDTOPackage" },
  itemTypePrefix: "ПакетXDTO",
  xmlDir: "XDTOPackages",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "namespace",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "XDTOPackage",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
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
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
