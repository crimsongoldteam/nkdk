import { additionalIndexRule } from "~/metadata/appliedObjects/metadataAccountingRegister/builders"
import { metadataSequenceDimensionsRule } from "~/metadata/appliedObjects/metadataSequence/builders"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { metadataItemLinksRule } from "~/metadata/commonObjects/metadataPath/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const MetadataSequenceRules = {
  itemType: "MetadataSequence",
  metadataTargetOwner: { kind: "self", root: "Sequence" },
  itemTypePrefix: "Последовательность",
  xmlDir: "Sequences",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Sequence",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "SequenceRecord", category: "Record" },
        { name: "SequenceManager", category: "Manager" },
        { name: "SequenceRecordSet", category: "RecordSet" },
      ],
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: ["Properties"],
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    moveBoundaryOnPosting: systemEnumerationRule({
      yaml: "ПеремещениеГраницыПриПроведении",
      typeSE: "MoveBoundaryOnPosting",
      defaultValueXML: "Move",
      implicitValueYAML: "Move",
      xmlParents: ["Properties"],
    }),
    documents: metadataItemLinksRule({
      yaml: "Документы",
      xmlParents: ["Properties"],
      defaultValue: [],
      defaultValueXMLEmpty: [],
    }),
    registerRecords: metadataItemLinksRule({
      yaml: "Движения",
      xmlParents: ["Properties"],
      defaultValue: [],
      defaultValueXMLEmpty: [],
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      typeSE: "DefaultDataLockControlMode",
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
      xmlParents: ["Properties"],
    }),
    additionalIndexes: additionalIndexRule({
      yaml: "ДополнительныеИндексы",
      filePath: "Ext/AdditionalIndexes.xml",
    }),
    recordSetModule: moduleRule({
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: ["Properties"],
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
    dimensions: metadataSequenceDimensionsRule({
      yaml: "Измерения",
      xml: "Dimension",
      xmlParents: ["ChildObjects"],
    }),
  },
} as const satisfies MetadataItemRule
