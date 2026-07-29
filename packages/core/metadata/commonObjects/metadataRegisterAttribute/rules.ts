import { stringRule } from "../string/types"
import { commonRegisterFieldProperties } from "../metadataRegisterField/rules"
import { getParentFromContext } from "../../context/helpers"
import { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
export const MetadataRegisterAttributeRules = {
  itemType: "MetadataRegisterAttribute",
  externalMetadata: { segment: "Attribute", placement: "ownerChild" },
  xmlOrder: [
    "objectBelonging",
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
    "scheduleLink",
    "indexing",
    "fullTextSearch",
    "dataHistory",
    "binaryDataStorageLocationUse",
    "binaryDataStorageLocationUseField",
    "uuid",
  ],
  properties: {
    ...commonRegisterFieldProperties,
    scheduleLink: stringRule({
      yaml: "СвязьСГрафиком",
      xml: "ScheduleLink",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        context
          ? getParentFromContext(context, ["MetadataCalculationRegister" as never]).itemType ===
            "MetadataCalculationRegister"
          : true,
    }),
  },
} as const satisfies MetadataItemRule
