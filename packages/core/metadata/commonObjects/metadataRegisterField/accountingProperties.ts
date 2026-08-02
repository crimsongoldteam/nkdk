import { getParentFromContext } from "../../context/helpers"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { booleanRule } from "../boolean/types"
import { stringRule } from "../string/types"

export const registerFieldBalanceProperty = booleanRule({
  yaml: "Балансовый",
  xml: "Balance",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  implicitValueYAML: true,
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isAccountingRegisterField(context),
})

export const registerFieldAccountingFlagProperty = stringRule({
  yaml: "ПризнакУчета",
  xml: "AccountingFlag",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (_source: unknown, context?: ConfigurationContextWithExportToXML) =>
    isAccountingRegisterField(context),
})

export const isAccountingRegisterField = (
  context?: ConfigurationContextWithExportToXML
): boolean =>
  context
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType ===
      "MetadataAccountingRegister"
    : false
