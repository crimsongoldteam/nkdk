import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { exportFormElementTypeToYAML } from "~/metadata/orchestration/formElement/toYAML"
import { OtherElement } from "../../commonObjects/childItems/types"
import { SearchControlAddition } from "../searchControlAddition/types"
import { SearchStringAddition } from "../searchStringAddition/types"
import { ViewStatusAddition } from "../viewStatusAddition/types"

export const exportOtherElementToNKDK = (params: {
  context: ConfigurationContext
  element: OtherElement | SearchStringAddition | SearchControlAddition | ViewStatusAddition
}): ToNKDKResult => {
  const { context, element } = params
  const itemType = exportFormElementTypeToYAML(context, element.itemType)

  const result: ToNKDKResult = {
    strings: ["?" + itemType + " " + formatElementName(element)],
    toOneLineGroup: true,
  }

  return result
}
