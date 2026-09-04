import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { metadataHTTPServiceURLTemplatesRule } from "./builders"
import { moduleRule } from "../../commonObjects/module/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
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
      rootAttributes: V8_MDCLASSES_ROOT,
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: metadataIdentityProperties.uuid,
    name: stringRule({
      xmlParents: properties,
      required: true,
      defaultValue: ({ name }: { name?: string }) => name,
    }),
    synonym: metadataIdentityProperties.synonym,
    comment: metadataIdentityProperties.comment,
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
