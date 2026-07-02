import { metadataRegisterDimensionsRule } from "~/metadata/appliedObjects/metadataAccountingRegister/builders"
import { internalInfoRule } from "~/metadata/commonObjects/internalInfo/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { moduleRule } from "~/metadata/commonObjects/module/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const RecalculationRules = {
  itemType: "Recalculation",
  properties: {
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "RecalculationRecord", category: "Record" },
        { name: "RecalculationManager", category: "Manager" },
        { name: "RecalculationRecordSet", category: "RecordSet" },
      ],
      getName: ({
        metadata,
      }: {
        metadata: {
          name: string
        }
      }) => `Recalculation${metadata.name}`,
    }),
    uuid: uuidPropertyRule,
    name: stringRule({ xml: "Name", required: true, xmlParents: properties }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({ yaml: "Комментарий", xml: "Comment", xmlParents: properties, defaultValueXMLRaw: "" }),
    use: booleanRule({
      yaml: "Использование",
      xml: "Use",
      xmlParents: properties,
      defaultValueXML: true,
      implicitValueYAML: true,
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      xml: "DataLockControlMode",
      typeSE: "DefaultDataLockControlMode",
      xmlParents: properties,
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
    }),
    dimensions: metadataRegisterDimensionsRule({
      yaml: "Измерения",
      xml: "Dimension",
      xmlParents: childObjects,
      defaultValue: [],
      defaultValueXMLRaw: {},
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
    recordSetModule: moduleRule({
      nkdkPath: ({ name }: { name: string }) => `Перерасчеты/${name}/МодульНабораЗаписей.bsl`,
      xmlPath: ({ name }: { name: string }) => `Recalculations/${name}/Ext/RecordSetModule.bsl`,
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
