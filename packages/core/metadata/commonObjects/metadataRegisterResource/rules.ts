import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataRegisterResourceRules = {
  itemType: "MetadataRegisterResource",
  properties: {
    ...commonRegisterFieldProperties,
    balance: {
      yaml: "Балансовый",
      xml: "Balance",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 25.1,
    },
    accountingFlag: {
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 25.2,
    },
    extDimensionAccountingFlag: {
      yaml: "ПризнакУчетаСубконто",
      xml: "ExtDimensionAccountingFlag",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) => isAccountingRegisterField(context),
      order: 25.3,
    },
  },
} as const satisfies MetadataItemRule

const isAccountingRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType === "MetadataAccountingRegister"
    : false
