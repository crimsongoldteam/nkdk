import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { exportFormElementTypeToEnterprise } from "~/metadata/metadataFactory/metadataType/toYAML"
import { OtherElement } from "../../collections/childItems/types"

export const exportOtherElementToStructure = (
  context: ConfigurationContext,
  element: OtherElement
): IFormatElementResult => {
  const itemType = exportFormElementTypeToEnterprise(context, element.itemType)

  const result: IFormatElementResult = {
    strings: ["?" + itemType + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
