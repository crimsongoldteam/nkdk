import { internalInfoRule } from "../../../commonObjects/internalInfo/types"
import { i8nTextRule } from "../../../commonObjects/i8nText/types"
import { moduleRule } from "../../../commonObjects/module/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { uuidRule } from "../../../commonObjects/uuid/types"
import { xmlRootRule } from "../../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { MetadataCalculationRegisterRecalculationDimensionRules } from "./dimension/rules"
import { getParentFromContext } from "../../../context/helpers"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
const properties = ["Properties"]
const childObjects = ["ChildObjects"]
export const RecalculationRules = {
  itemType: "MetadataCalculationRegisterRecalculation",
  metadataTargetOwner: { kind: "inherit" },
  externalMetadata: { segment: "Recalculation", placement: "ownedEntry" },
  xmlOrder: [
    "internalInfo",
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "dataLockControlMode",
    "extendedConfigurationObject",
    "dimensions",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "Recalculation",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    internalInfo: internalInfoRule({
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "RecalculationRecord", category: "Record" },
        { name: "RecalculationManager", category: "Manager" },
        { name: "RecalculationRecordSet", category: "RecordSet" },
      ],
      getName: ({ context, metadata }: {
        context: ConfigurationContextWithExportToXML
        metadata: { name: string }
      }) => {
        const parent = getParentFromContext(context, ["MetadataCalculationRegister"])
        return [parent.name, metadata.name].filter(Boolean).join(".")
      },
    }),
    uuid: uuidRule({ xml: "_uuid", forReferenceOnly: true, xmlParents: [] }),
    name: stringRule({ xml: "Name", required: true, xmlParents: properties }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "Synonym",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "Comment",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    }),
    dataLockControlMode: systemEnumerationRule({
      yaml: "РежимУправленияБлокировкойДанных",
      xml: "DataLockControlMode",
      typeSE: "DefaultDataLockControlMode",
      xmlParents: properties,
      defaultValueXML: "Managed",
      implicitValueYAML: "Managed",
    }),
    dimensions: {
      type: "MetadataCalculationRegisterRecalculationDimensions",
      yaml: "Измерения",
      xml: "Dimension",
      xmlParents: childObjects,
      itemRule: MetadataCalculationRegisterRecalculationDimensionRules,
      defaultValue: [],
      defaultValueXMLRaw: {},
    },
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
      nkdkPath: "МодульНабораЗаписей.bsl",
      xmlPath: "Ext/RecordSetModule.bsl",
      toXML: false,
      fromXML: false,
    }),
  },
} as const satisfies MetadataItemRule
