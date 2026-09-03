import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { booleanRule } from "../../commonObjects/boolean/types"
import { moduleRule } from "../../commonObjects/module/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataCommonModuleRules = {
  itemType: "MetadataCommonModule",
  metadataTargetOwner: { kind: "self", root: "CommonModule" },
  itemTypePrefix: "ОбщийМодуль",
  xmlDir: "CommonModules",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "global",
    "clientManagedApplication",
    "server",
    "externalConnection",
    "clientOrdinaryApplication",
    "serverCall",
    "privileged",
    "returnValuesReuse",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonModule",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    global: booleanRule({
      yaml: "Глобальный",
      xml: "Global",
      xmlParents: properties,
      defaultValueXML: false,
      defaultValueAdoptedXML: false,
      implicitValueYAML: false,
    }),
    clientManagedApplication: booleanRule({
      yaml: "Клиент",
      xml: "ClientManagedApplication",
      xmlParents: properties,
      defaultValueXML: false,
      defaultValueAdoptedXML: false,
      implicitValueYAML: false,
    }),
    server: booleanRule({
      yaml: "Сервер",
      xml: "Server",
      xmlParents: properties,
      defaultValueXML: true,
      defaultValueAdoptedXML: true,
      implicitValueYAML: true,
    }),
    externalConnection: booleanRule({
      yaml: "ВнешнееСоединение",
      xml: "ExternalConnection",
      xmlParents: properties,
      defaultValueXML: false,
      defaultValueAdoptedXML: false,
      implicitValueYAML: false,
    }),
    clientOrdinaryApplication: booleanRule({
      yaml: "КлиентОбычноеПриложение",
      xml: "ClientOrdinaryApplication",
      xmlParents: properties,
      defaultValueXML: false,
      defaultValueAdoptedXML: false,
      implicitValueYAML: false,
    }),
    serverCall: booleanRule({
      yaml: "ВызовСервера",
      xml: "ServerCall",
      xmlParents: properties,
      defaultValueXML: false,
      defaultValueAdoptedXML: false,
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
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
