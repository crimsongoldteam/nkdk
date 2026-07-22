import { additionalIndexRule } from "../metadataAccountingRegister/builders"
import { metadataSequenceDimensionsRule } from "./builders"
import { internalInfoRule } from "../../commonObjects/internalInfo/types"
import { metadataItemLinksRule } from "../../commonObjects/metadataPath/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
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
      ownerFactRole: "registerRecords",
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
      ownerFactRole: "dimensions",
      yaml: "Измерения",
      xml: "Dimension",
      xmlParents: ["ChildObjects"],
    }),
  },
} as const satisfies MetadataItemRule
