import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataScheduledJobRules = {
  itemType: "MetadataScheduledJob",
  metadataTargetOwner: { kind: "self", root: "ScheduledJob" },
  itemTypePrefix: "РегламентноеЗадание",
  xmlDir: "ScheduledJobs",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "ScheduledJob",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    methodName: {
      yaml: "ИмяМетода",
      xml: "MethodName",
      type: "string",
      xmlParents: properties,
    },
    description: {
      yaml: "Описание",
      xml: "Description",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    key: {
      yaml: "Ключ",
      xml: "Key",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    },
    predefined: {
      yaml: "Предопределенное",
      xml: "Predefined",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
      implicitValueYAML: false,
    },
    restartCountOnFailure: {
      yaml: "КоличествоПовторовПриАварийномЗавершении",
      xml: "RestartCountOnFailure",
      type: "number",
      xmlParents: properties,
      defaultValueXML: 3,
      implicitValueYAML: 3,
    },
    restartIntervalOnFailure: {
      yaml: "ИнтервалПовтораПриАварийномЗавершении",
      xml: "RestartIntervalOnFailure",
      type: "number",
      xmlParents: properties,
      defaultValueXML: 10,
      implicitValueYAML: 10,
    },
    schedule: {
      type: "Template",
      nkdkPath: "Schedule.xml",
      xmlPath: "Ext/Schedule.xml",
      toXML: false,
      fromXML: false,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
