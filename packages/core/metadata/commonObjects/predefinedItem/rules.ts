import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
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
    code: {
      type: "PredefinedCode",
      xml: "Code",
      yaml: "Код",
      required: true,
    },
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
    type: {
      yaml: "ТипЗначения",
      xml: "Type",
      type: "TypeDescription",
      declareTypeNamespaceXML: true,
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        isChartOfCharacteristicTypesPredefined(context),
      defaultValueXMLRaw: {},
    },
    childItems: {
      type: "PredefinedItemCollection",
      xml: "ChildItems",
      yaml: "Элементы",
    },
  },
} as const satisfies MetadataItemRule
