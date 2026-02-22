import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { exportFormElementTypeToYAML } from "~/metadata/metadataFactory/metadataType/toYAML"
import { OtherElement } from "../../commonObjects/childItems/types"

export const exportOtherElementToStructure = (
  context: ConfigurationContext,
  element: OtherElement
): IFormatElementResult => {
  const itemType = exportFormElementTypeToYAML(context, element.itemType)

  const result: IFormatElementResult = {
    strings: ["?" + itemType + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
