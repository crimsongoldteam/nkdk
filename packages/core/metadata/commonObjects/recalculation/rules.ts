import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const RecalculationRules = {
  itemType: "Recalculation",
  properties: {
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "RecalculationRecord", category: "Record" },
        { name: "RecalculationManager", category: "Manager" },
        { name: "RecalculationRecordSet", category: "RecordSet" },
      ],
      getName: ({ metadata }) => `Recalculation${metadata.name}`,
    },
    uuid: uuidPropertyRule,
    name: { xml: "Name", type: "string", required: true, xmlParents: properties },
    synonym: { yaml: "Синоним", xml: "Synonym", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", xml: "Comment", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    },
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      xml: "DataLockControlMode",
      type: "SystemEnumeration",
      typeSE: "DefaultDataLockControlMode",
      xmlParents: properties,
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
    },
    dimensions: {
      yaml: "Измерения",
      xml: "Dimension",
      type: "MetadataRegisterDimensions",
      xmlParents: childObjects,
      defaultValue: [],
      defaultValueXMLRaw: {},
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
    recordSetModule: {
      type: "Module",
      nkdkPath: ({ name }: { name: string }) => `Перерасчеты/${name}/МодульНабораЗаписей.bsl`,
      xmlPath: ({ name }: { name: string }) => `Recalculations/${name}/Ext/RecordSetModule.bsl`,
      toXML: false,
      fromXML: false,
    },
  },
} as const satisfies MetadataItemRule
