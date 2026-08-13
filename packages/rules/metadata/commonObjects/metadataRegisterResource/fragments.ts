import {
  metadataRuleFragment,
  stringProperty,
} from "../metadataRuleFragment"
import {
  exportAccountingFieldDefault,
  registerFieldAccountingFlagProperty,
  registerFieldBalanceProperty,
  type RegisterFieldExportContext,
} from "../metadataRegisterField/accountingProperties"

export const metadataRegisterResourceRuleBase = {
  itemType: "MetadataRegisterResource",
  externalMetadata: { segment: "Resource", placement: "ownerChild" },
} as const

const extDimensionAccountingFlag = stringProperty({
  yaml: "ПризнакУчетаСубконто",
  xml: "ExtDimensionAccountingFlag",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (source: unknown, context?: RegisterFieldExportContext) =>
    exportAccountingFieldDefault("extDimensionAccountingFlag", source, context),
})

export const registerResourceAccountingFragment = metadataRuleFragment(
  ["balance", "accountingFlag", "extDimensionAccountingFlag"],
  {
    balance: registerFieldBalanceProperty,
    accountingFlag: registerFieldAccountingFlagProperty,
    extDimensionAccountingFlag,
  }
)
