import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/forms/format/types"
import { exportFormElementTypeToYAML } from "~/metadata/metadataFactory/metadataType/toYAML"
import { OtherElement } from "../../commonObjects/childItems/types"

export const exportOtherElementToStructure = (context: ConfigurationContext, element: OtherElement): ToNKDKResult => {
  const itemType = exportFormElementTypeToYAML(context, element.itemType)

  const result: ToNKDKResult = {
    strings: ["?" + itemType + " " + formatElementName(element)],
    toOneLineGroup: false,
  }

  return result
}
