import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { webSocketClientHeadersRule } from "../../commonObjects/webSocketClientHeaders/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { moduleRule } from "../../commonObjects/module/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataWebSocketClientRules = {
  itemType: "MetadataWebSocketClient",
  metadataTargetOwner: { kind: "self", root: "WebSocketClient" },
  itemTypePrefix: "WebSocketКлиент",
  xmlDir: "WebSocketClients",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "predefined",
    "autoConnect",
    "serverURL",
    "user",
    "password",
    "headers",
    "useOSProxy",
    "useOSAuthentication",
    "timeout",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "WebSocketClient",
      rootAttributes: V8_MDCLASSES_ROOT,
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    predefined: booleanRule({
      yaml: "Предопределенный",
      xml: "Predefined",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    autoConnect: booleanRule({
      yaml: "АвтоПодключение",
      xml: "AutoConnect",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    serverURL: stringRule({
      yaml: "АдресСервера",
      xml: "ServerURL",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    user: stringRule({
      yaml: "Пользователь",
      xml: "User",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    password: stringRule({
      yaml: "Пароль",
      xml: "Password",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    headers: webSocketClientHeadersRule({
      yaml: "Заголовки",
      xml: "Headers",
      xmlParents: properties,
      defaultValueXML: [],
      implicitValueYAML: [],
    }),
    useOSProxy: booleanRule({
      yaml: "ИспользоватьПроксиОС",
      xml: "UseOSProxy",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    useOSAuthentication: booleanRule({
      yaml: "ИспользоватьАутентификациюОС",
      xml: "UseOSAuthentication",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    timeout: numberRule({
      yaml: "Таймаут",
      xml: "Timeout",
      xmlParents: properties,
      defaultValueXML: 30,
      implicitValueYAML: 30,
    }),
    module: moduleRule({
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
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
