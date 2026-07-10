import { predefinedCodeRule } from "../predefinedCode/types"
import { predefinedItemCollectionRule } from "./builders"
import { typeDescriptionRule } from "../typeDescription/types"
import { booleanRule } from "../boolean/types"
import { stringRule } from "../string/types"
import { uuidPropertyRule } from "../uuid/rule"
import { getParentFromContext } from "../../context/helpers"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
const isChartOfCharacteristicTypesPredefined = (context?: ConfigurationContextWithExportToXML): boolean =>
  context
    ? getParentFromContext(context, ["MetadataChartOfCharacteristicTypes" as never]).itemType ===
      "MetadataChartOfCharacteristicTypes"
    : false
export const PredefinedItemRules = {
  itemType: "PredefinedItem",
  properties: {
    id: {
      ...uuidPropertyRule,
      xml: "_id",
    },
    name: stringRule({
      xml: "Name",
      required: true,
    }),
    code: predefinedCodeRule({
      xml: "Code",
      yaml: "Код",
      required: true,
    }),
    description: stringRule({
      xml: "Description",
      yaml: "Наименование",
      required: true,
    }),
    isFolder: booleanRule({
      xml: "IsFolder",
      yaml: "ЭтоГруппа",
      defaultValue: false,
      defaultValueXML: false,
      implicitValueYAML: "Ложь",
    }),
    type: typeDescriptionRule({
      yaml: "ТипЗначения",
      xml: "Type",
      declareTypeNamespaceXML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isChartOfCharacteristicTypesPredefined(context),
      defaultValueXMLRaw: {},
    }),
    childItems: predefinedItemCollectionRule({
      xml: "ChildItems",
      yaml: "Элементы",
    }),
  },
} as const satisfies MetadataItemRule
