import { getParentFromContext } from "../../context/helpers"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { booleanRule } from "../boolean/types"
import { metadataRuleFragment } from "../metadataRuleFragment"
import { stringRule } from "../string/types"

export const metadataRegisterResourceRuleBase = {
  itemType: "MetadataRegisterResource",
  externalMetadata: { segment: "Resource", placement: "ownerChild" },
} as const

const balance = booleanRule({
  yaml: "Балансовый",
  xml: "Balance",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  implicitValueYAML: true,
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isAccountingRegisterField(context),
})

const accountingFlag = stringRule({
  yaml: "ПризнакУчета",
  xml: "AccountingFlag",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isAccountingRegisterField(context),
})

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
  { balance, accountingFlag, extDimensionAccountingFlag }
)

const isAccountingRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType ===
      "MetadataAccountingRegister"
    : false
