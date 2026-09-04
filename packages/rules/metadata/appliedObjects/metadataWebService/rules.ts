import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { metadataWebServiceOperationsRule } from "./builders"
import { xDTOPackagesRule } from "../../commonObjects/xDTOPackages/types"
import { moduleRule } from "../../commonObjects/module/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_XML_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataWebServiceRules = {
  itemType: "MetadataWebService",
  metadataTargetOwner: { kind: "self", root: "WebService" },
  itemTypePrefix: "WebСервис",
  xmlDir: "WebServices",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "namespace",
    "xdtoPackages",
    "descriptorFileName",
    "reuseSessions",
    "sessionMaxAge",
    "operations",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "WebService",
      ...V8_MDCLASSES_XML_ROOT,
    }),
    ...metadataIdentityProperties,
    name: {
      ...metadataIdentityProperties.name,
      defaultValue: ({ name }: { name?: string }) => name,
    },
    namespace: stringRule({
      yaml: "ПространствоИмен",
      xml: "Namespace",
      xmlParents: properties,
    }),
    xdtoPackages: xDTOPackagesRule({
      yaml: "ПакетыXDTO",
      xml: "XDTOPackages",
      xmlParents: properties,
      defaultValueXMLRaw: {},
    }),
    reuseSessions: systemEnumerationRule({
      yaml: "ПовторноеИспользованиеСеансов",
      xml: "ReuseSessions",
      typeSE: "SessionReuseMode",
      xmlParents: properties,
      defaultValueXML: "AutoUse",
      implicitValueYAML: "AutoUse",
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    sessionMaxAge: numberRule({
      yaml: "ВремяЖизниСеанса",
      xml: "SessionMaxAge",
      xmlParents: properties,
      defaultValueXML: 20,
      implicitValueYAML: 20,
    }),
    descriptorFileName: stringRule({
      yaml: "ИмяФайлаДескриптора",
      xml: "DescriptorFileName",
      xmlParents: properties,
    }),
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
    operations: metadataWebServiceOperationsRule({
      yaml: "Операции",
      xml: "Operation",
      xmlParents: childObjects,
      defaultValue: [],
      defaultValueXMLRaw: {},
    }),
    module: moduleRule({
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
