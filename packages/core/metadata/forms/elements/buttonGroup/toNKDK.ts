import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { ButtonGroupPrefix } from "~/nkdk/terminal"
import { formatElementTitleAndName } from "../../format/helpers"
import { ButtonGroup } from "./types"

export function exportButtonGroupContentToNKDK(params: {
  context: ConfigurationContext
  element: ButtonGroup
}): ToNKDKResult {
  const { context, element } = params
  const resultString = ButtonGroupPrefix + formatElementTitleAndName(context, element)
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}
