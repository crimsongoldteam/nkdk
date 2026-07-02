import { templateRule } from "../../commonObjects/module/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataScheduledJobRules = {
  itemType: "MetadataScheduledJob",
  metadataTargetOwner: { kind: "self", root: "ScheduledJob" },
  itemTypePrefix: "РегламентноеЗадание",
  xmlDir: "ScheduledJobs",
  properties: {
    xmlRoot: xmlRootRule({
      container: "ScheduledJob",
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
    methodName: stringRule({
      yaml: "ИмяМетода",
      xml: "MethodName",
      xmlParents: properties,
    }),
    description: stringRule({
      yaml: "Описание",
      xml: "Description",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    key: stringRule({
      yaml: "Ключ",
      xml: "Key",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    use: booleanRule({
      yaml: "Использование",
      xml: "Use",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    predefined: booleanRule({
      yaml: "Предопределенное",
      xml: "Predefined",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    restartCountOnFailure: numberRule({
      yaml: "КоличествоПовторовПриАварийномЗавершении",
      xml: "RestartCountOnFailure",
      xmlParents: properties,
      defaultValueXML: 3,
      implicitValueYAML: 3,
    }),
    restartIntervalOnFailure: numberRule({
      yaml: "ИнтервалПовтораПриАварийномЗавершении",
      xml: "RestartIntervalOnFailure",
      xmlParents: properties,
      defaultValueXML: 10,
      implicitValueYAML: 10,
    }),
    schedule: templateRule({
      nkdkPath: "Schedule.xml",
      xmlPath: "Ext/Schedule.xml",
      toXML: false,
      fromXML: false,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
