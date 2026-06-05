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
    name: {
      type: "string",
      xml: "Name",
      required: true,
    },
    code: {
      type: "PredefinedCode",
      xml: "Code",
      yaml: "Код",
      required: true,
    },
    description: {
      type: "string",
      xml: "Description",
      yaml: "Наименование",
      required: true,
    },
    isFolder: {
      type: "boolean",
      xml: "IsFolder",
      yaml: "ЭтоГруппа",
      defaultValue: false,
      defaultValueXML: false,
      defaultValueYAML: "Ложь",
    },
    type: {
      yaml: "ТипЗначения",
      xml: "Type",
      type: "TypeDescription",
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
