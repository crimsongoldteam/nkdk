import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { metadataRuleFragment } from "../metadataRuleFragment"
import {
  isAccountingRegisterField,
  registerFieldAccountingFlagProperty,
  registerFieldBalanceProperty,
} from "../metadataRegisterField/accountingProperties"
import { stringRule } from "../string/types"

export const metadataRegisterResourceRuleBase = {
  itemType: "MetadataRegisterResource",
  externalMetadata: { segment: "Resource", placement: "ownerChild" },
} as const

const extDimensionAccountingFlag = stringRule({
  yaml: "ПризнакУчетаСубконто",
  xml: "ExtDimensionAccountingFlag",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isAccountingRegisterField(context),
})

export const registerResourceAccountingFragment = metadataRuleFragment(
  ["balance", "accountingFlag", "extDimensionAccountingFlag"],
  {
    balance: registerFieldBalanceProperty,
    accountingFlag: registerFieldAccountingFlagProperty,
    extDimensionAccountingFlag,
  }
)
