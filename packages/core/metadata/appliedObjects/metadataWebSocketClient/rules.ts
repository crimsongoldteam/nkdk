import { webSocketClientHeadersRule } from "../../commonObjects/webSocketClientHeaders/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataWebSocketClientRules = {
  itemType: "MetadataWebSocketClient",
  metadataTargetOwner: { kind: "self", root: "WebSocketClient" },
  itemTypePrefix: "WebSocketКлиент",
  xmlDir: "WebSocketClients",
  properties: {
    xmlRoot: xmlRootRule({
      container: "WebSocketClient",
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
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
