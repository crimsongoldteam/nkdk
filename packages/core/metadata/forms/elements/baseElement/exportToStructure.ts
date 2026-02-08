import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { exportFormElementTypeToEnterprise } from "../../../metadataFactory/types"
import { NamedElement } from "./types"

export const exportOtherElementToStructure = (
  context: ConfigurationContext,
  element: NamedElement
): IFormatElementResult => {
  const elementType = exportFormElementTypeToEnterprise(context, element.elementType)

  const result: IFormatElementResult = {
    strings: ["?" + elementType + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
