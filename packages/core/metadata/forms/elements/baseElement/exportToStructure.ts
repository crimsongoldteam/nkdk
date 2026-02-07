import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { IFormatElementResult } from "~/metadata/forms/format/types"
import { exportFormElementTypeToEnterprise } from "../../../metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"
import { NamedElement } from "./types"

export const exportOtherElementToStructure = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  element: NamedElement
): IFormatElementResult => {
  const elementType = exportFormElementTypeToEnterprise(context, undefined, element.elementType)

  const result: IFormatElementResult = {
    strings: ["?" + elementType + " " + formatElementName(element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}
