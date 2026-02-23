import { ConfigurationContext } from "~/metadata/context/types"
import { formatElementTitleAndName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { LabelDecoration } from "./types"

export const exportLabelDecorationToNKDK = (params: {
  context: ConfigurationContext
  element: LabelDecoration
}): ToNKDKResult => {
  const { context, element } = params
  const titleText = formatElementTitleAndName(context, element)

  const result: ToNKDKResult = {
    strings: [titleText],
    toOneLineGroup: true,
  }

  return result
}
