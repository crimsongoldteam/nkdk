import { templateRule } from "~/metadata/commonObjects/module/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
