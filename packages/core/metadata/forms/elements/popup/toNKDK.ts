import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { PopupPrefix } from "~/nkdk/terminal"
import { formatElementTitleAndName } from "../../format/helpers"
import { Popup } from "./types"

export function exportPopupContentToNKDK(params: { context: ConfigurationContext; element: Popup }): ToNKDKResult {
  const { context, element } = params
  const resultString = PopupPrefix + formatContent(context, element)
  return {
    strings: [resultString],
    toOneLineGroup: false,
  }
}

const formatContent = (context: ConfigurationContext, element: Popup): string => {
  return formatElementTitleAndName(context, element)
}
