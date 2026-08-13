import {
  booleanProperty,
  stringProperty,
} from "../metadataRuleFragment"
import { hasYAMLProperty, xmlDefaultVariant } from "../../ruleRuntime/property/xmlDefaultVariant"

export interface RegisterFieldExportContext {
  exportToXML: {
    itemsTree: readonly { itemType: string }[]
    configurationIndex?: { readonly logicalAddress: string }
    xmlDefaultVariantByLogicalAddress?: Readonly<Record<string, "full" | "adopted" | "indexed">>
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
  toXML: (source: unknown, context?: RegisterFieldExportContext) =>
    exportAccountingFieldDefault("accountingFlag", source, context),
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

export const exportAccountingFieldDefault = (
  propertyKey: string,
  source: unknown,
  context?: RegisterFieldExportContext,
): boolean =>
  isAccountingRegisterField(context) &&
  (xmlDefaultVariant(context) !== "adopted" || hasYAMLProperty(source, propertyKey))
