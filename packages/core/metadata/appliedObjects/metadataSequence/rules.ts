import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataSequenceRules = {
  itemType: "MetadataSequence",
  metadataTargetOwner: { kind: "self", root: "Sequence" },
  itemTypePrefix: "Последовательность",
  xmlDir: "Sequences",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Sequence",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "SequenceRecord", category: "Record" },
        { name: "SequenceManager", category: "Manager" },
        { name: "SequenceRecordSet", category: "RecordSet" },
      ],
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: ["Properties"],
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    moveBoundaryOnPosting: {
      yaml: "ПеремещениеГраницыПриПроведении",
      type: "SystemEnumeration",
      typeSE: "MoveBoundaryOnPosting",
      defaultValueXML: "Move",
      implicitValueYAML: "Move",
      xmlParents: ["Properties"],
    },
    documents: {
      yaml: "Документы",
      type: "MetadataItemLinks",
      xmlParents: ["Properties"],
      defaultValue: [],
      defaultValueXMLEmpty: [],
    },
    registerRecords: {
      yaml: "Движения",
      type: "MetadataItemLinks",
      xmlParents: ["Properties"],
      defaultValue: [],
      defaultValueXMLEmpty: [],
    },
    dataLockControlMode: {
      yaml: "РежимУправленияБлокировкойДанных",
      type: "SystemEnumeration",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: ["Properties"],
    },
    additionalIndexes: {
      yaml: "ДополнительныеИндексы",
      type: "AdditionalIndex",
      filePath: "Ext/AdditionalIndexes.xml",
    },
    recordSetModule: {
      type: "Module",
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: ["Properties"],
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    dimensions: {
      yaml: "Измерения",
      type: "MetadataSequenceDimensions",
      xml: "Dimension",
      xmlParents: ["ChildObjects"],
    },
  },
} as const satisfies MetadataItemRule
