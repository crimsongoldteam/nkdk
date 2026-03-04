import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { exportFormElementTypeToYAML } from "~/metadata/orchestration/metadataItem/toYAML"
import { OtherElement } from "../../commonObjects/childItems/types"
import { SearchControlAddition } from "../searchControlAddition/types"
import { SearchStringAddition } from "../searchStringAddition/types"

export const exportOtherElementToNKDK = (params: {
  context: ConfigurationContext
  element: OtherElement | SearchStringAddition | SearchControlAddition
}): ToNKDKResult => {
  const { context, element } = params
  const itemType = exportFormElementTypeToYAML(context, element.itemType)

  const result: ToNKDKResult = {
    strings: ["?" + itemType + " " + formatElementName(element)],
    toOneLineGroup: true,
  }

  return result
}
