import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
export const MetadataCommonModuleRules = {
  itemType: "MetadataCommonModule",
  metadataTargetOwner: { kind: "self", root: "CommonModule" },
  itemTypePrefix: "ОбщийМодуль",
  xmlDir: "CommonModules",
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonModule",
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
    global: booleanRule({
      yaml: "Глобальный",
      xml: "Global",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    clientManagedApplication: booleanRule({
      yaml: "Клиент",
      xml: "ClientManagedApplication",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    server: booleanRule({
      yaml: "Сервер",
      xml: "Server",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    externalConnection: booleanRule({
      yaml: "ВнешнееСоединение",
      xml: "ExternalConnection",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    clientOrdinaryApplication: booleanRule({
      yaml: "КлиентОбычноеПриложение",
      xml: "ClientOrdinaryApplication",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    serverCall: booleanRule({
      yaml: "ВызовСервера",
      xml: "ServerCall",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    privileged: booleanRule({
      yaml: "Привилегированный",
      xml: "Privileged",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    returnValuesReuse: systemEnumerationRule({
      yaml: "ПовторноеИспользованиеВозвращаемыхЗначений",
      xml: "ReturnValuesReuse",
      typeSE: "ReturnValuesReuse",
      xmlParents: properties,
      defaultValueXML: "DontUse",
      implicitValueYAML: "DontUse",
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
