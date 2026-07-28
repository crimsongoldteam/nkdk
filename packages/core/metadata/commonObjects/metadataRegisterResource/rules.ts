import { booleanRule } from "../boolean/types"
import { stringRule } from "../string/types"
import { commonRegisterFieldProperties } from "../metadataRegisterField/rules"
import { getParentFromContext } from "../../context/helpers"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
const resourceExternalMetadata = { segment: "Resource", placement: "ownerChild" } as const
export const MetadataRegisterResourceRules = {
  itemType: "MetadataRegisterResource",
  externalMetadata: resourceExternalMetadata,
  xmlOrder: [
    "name",
    "synonym",
    "comment",
    "type",
    "passwordMode",
    "format",
    "editFormat",
    "toolTip",
    "markNegatives",
    "mask",
    "multiLine",
    "extendedEdit",
    "minValue",
    "maxValue",
    "fillFromFillingValue",
    "fillValue",
    "fillChecking",
    "choiceFoldersAndItems",
    "choiceParameterLinks",
    "choiceParameters",
    "quickChoice",
    "createOnInput",
    "choiceForm",
    "linkByType",
    "choiceHistoryOnInput",
    "balance",
    "accountingFlag",
    "extDimensionAccountingFlag",
    "indexing",
    "fullTextSearch",
    "dataHistory",
    "binaryDataStorageLocationUse",
    "binaryDataStorageLocationUseField",
  ],
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
    }),
    accountingFlag: stringRule({
      yaml: "ПризнакУчета",
      xml: "AccountingFlag",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isAccountingRegisterField(context),
    }),
    extDimensionAccountingFlag: stringRule({
      yaml: "ПризнакУчетаСубконто",
      xml: "ExtDimensionAccountingFlag",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isAccountingRegisterField(context),
    }),
  },
} as const satisfies MetadataItemRule
const isAccountingRegisterField = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataAccountingRegister" as never]).itemType === "MetadataAccountingRegister"
    : false
