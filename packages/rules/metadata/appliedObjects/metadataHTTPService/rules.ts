import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { metadataHTTPServiceURLTemplatesRule } from "./builders"
import { moduleRule } from "../../commonObjects/module/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_XML_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const MetadataHTTPServiceRules = {
  itemType: "MetadataHTTPService",
  metadataTargetOwner: { kind: "self", root: "HTTPService" },
  itemTypePrefix: "HTTPСервис",
  xmlDir: "HTTPServices",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "rootURL",
    "reuseSessions",
    "sessionMaxAge",
    "urlTemplates",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "HTTPService",
      ...V8_MDCLASSES_XML_ROOT,
    }),
    ...metadataIdentityProperties,
    name: {
      ...metadataIdentityProperties.name,
      defaultValue: ({ name }: { name?: string }) => name,
    },
    rootURL: stringRule({
      yaml: "КорневойURL",
      xml: "RootURL",
      xmlParents: properties,
    }),
    reuseSessions: systemEnumerationRule({
      yaml: "ПовторноеИспользованиеСеансов",
      xml: "ReuseSessions",
      typeSE: "SessionReuseMode",
      xmlParents: properties,
      defaultValueXML: "AutoUse",
      implicitValueYAML: "AutoUse",
    }),
    sessionMaxAge: numberRule({
      yaml: "ВремяЖизниСеанса",
      xml: "SessionMaxAge",
      xmlParents: properties,
      defaultValueXML: 20,
      implicitValueYAML: 20,
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
    urlTemplates: metadataHTTPServiceURLTemplatesRule({
      yaml: "ШаблоныURL",
      xml: "URLTemplate",
      xmlParents: childObjects,
    }),
    module: moduleRule({
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
