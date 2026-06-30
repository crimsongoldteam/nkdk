import { webSocketClientHeadersRule } from "~/metadata/commonObjects/webSocketClientHeaders/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
