import {
  booleanProperty,
  stringProperty,
} from "../metadataRuleFragment"

export interface RegisterFieldExportContext {
  exportToXML: {
    itemsTree: readonly { itemType: string }[]
  }
}

export const registerFieldBalanceProperty = booleanProperty({
  yaml: "Балансовый",
  xml: "Balance",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  defaultValueAdoptedXML: true,
  implicitValueYAML: true,
  toXML: (_source: unknown, context?: RegisterFieldExportContext) =>
    isAccountingRegisterField(context),
})

export const registerFieldAccountingFlagProperty = stringProperty({
  yaml: "ПризнакУчета",
  xml: "AccountingFlag",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
  toXML: (_source: unknown, context?: RegisterFieldExportContext) =>
    isAccountingRegisterField(context),
})

export const isAccountingRegisterField = (
  context?: RegisterFieldExportContext
): boolean => {
  if (context === undefined) return false
  for (let index = context.exportToXML.itemsTree.length - 1; index >= 0; index--) {
    if (
      context.exportToXML.itemsTree[index].itemType ===
      "MetadataAccountingRegister"
    ) {
      return true
    }
  }
  return false
}
