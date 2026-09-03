import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { templateRule } from "../../commonObjects/module/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataScheduledJobRules = {
  itemType: "MetadataScheduledJob",
  metadataTargetOwner: { kind: "self", root: "ScheduledJob" },
  itemTypePrefix: "РегламентноеЗадание",
  xmlDir: "ScheduledJobs",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "methodName",
    "description",
    "key",
    "use",
    "predefined",
    "restartCountOnFailure",
    "restartIntervalOnFailure",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "ScheduledJob",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
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
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
