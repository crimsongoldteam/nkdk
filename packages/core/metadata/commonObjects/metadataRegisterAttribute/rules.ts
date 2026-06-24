import { commonRegisterFieldProperties } from "~/metadata/commonObjects/metadataRegisterField/rules"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataRegisterAttributeRules = {
  itemType: "MetadataRegisterAttribute",
  externalMetadata: { segment: "Attribute", placement: "ownerChild" },
  properties: {
    ...commonRegisterFieldProperties,
    scheduleLink: {
      yaml: "СвязьСГрафиком",
      xml: "ScheduleLink",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
      toXML: (_metadataItem: unknown, context?: ConfigurationContextWithExportToXML) =>
        context
          ? getParentFromContext(context, ["MetadataCalculationRegister" as never]).itemType ===
            "MetadataCalculationRegister"
          : true,
    },
  },
} as const satisfies MetadataItemRule
