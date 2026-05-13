import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataRegisterDimensionRules = {
  itemType: "MetadataRegisterDimension",
  properties: {
    ...commonRegisterFieldProperties,
    master: {
      yaml: "Ведущее",
      xml: "Master",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      defaultValueYAML: false,
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("master", metadataItem, context),
      order: 26,
    },
    mainFilter: {
      yaml: "ОсновнойОтбор",
      xml: "MainFilter",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("mainFilter", metadataItem, context),
      order: 26,
    },
    denyIncompleteValues: {
      yaml: "ЗапретНезавершенныхЗначений",
      xml: "DenyIncompleteValues",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      defaultValueYAML: false,
      order: 26,
    },
    useInTotals: {
      yaml: "ИспользоватьВИтогах",
      xml: "UseInTotals",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      defaultValueYAML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        context ? getParentFromContext(context, ["MetadataInformationRegister" as never]).itemType !== "MetadataInformationRegister" : true,
      order: 30,
    },
    typeReductionMode: {
      yaml: "РежимСокращенияТипа",
      xml: "TypeReductionMode",
      type: "SystemEnumeration",
      typeSE: "TypeReductionMode",
      xmlParents: ["Properties"],
      defaultValueXML: "TransformValues",
      defaultValueYAML: "TransformValues",
      toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        exportDimensionDefaultForXML("typeReductionMode", metadataItem, context),
      order: 31,
    },
  },
} as const satisfies MetadataItemRule

const exportDimensionDefaultForXML = (
  propertyKey: string,
  metadataItem: unknown,
  context?: ConfigurationContextWithExportToXML
): boolean => {
  if (!context) return true
  const parent = getParentFromContext(context, ["MetadataAccumulationRegister" as never])
  if (parent.itemType !== "MetadataAccumulationRegister") return true

  return (
    metadataItem !== null &&
    metadataItem !== undefined &&
    typeof metadataItem === "object" &&
    Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)
  )
}
