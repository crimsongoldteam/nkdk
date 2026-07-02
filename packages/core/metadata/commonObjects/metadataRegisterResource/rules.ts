import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
const resourceExternalMetadata = { segment: "Resource", placement: "ownerChild" } as const
export const MetadataRegisterResourceRules = {
  itemType: "MetadataRegisterResource",
  externalMetadata: resourceExternalMetadata,
  properties: {
    ...commonRegisterFieldProperties,
    balance: booleanRule({
      yaml: "Балансовый",
      xml: "Balance",
      xmlParents: ["Properties"],
      defaultValueXML: true,
      implicitValueYAML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isAccountingRegisterField(context),
      order: 25.1,
    }),
    accountingFlag: stringRule({
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isAccountingRegisterField(context),
      order: 25.2,
    }),
    extDimensionAccountingFlag: stringRule({
      yaml: "ПризнакУчетаСубконто",
      xml: "ExtDimensionAccountingFlag",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isAccountingRegisterField(context),
      order: 25.3,
    }),
  },
} as const satisfies MetadataItemRule
const isAccountingRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType === "MetadataAccountingRegister"
    : false
