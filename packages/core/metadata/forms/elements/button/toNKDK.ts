import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { formatElementTitleAndName, wrapButtonContent } from "../../format/helpers"
import { Button } from "./types"

export function exportButtonToNKDK(params: { context: ConfigurationContext; element: Button }): ToNKDKResult {
  const { context, element } = params
  const resultString = wrapButtonContent(formatContent(context, element))
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

export function exportButtonContentToNKDK(params: { context: ConfigurationContext; element: Button }): ToNKDKResult {
  const { context, element } = params
  const resultString = formatContent(context, element)
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

const formatContent = (context: ConfigurationContext, element: Button): string => {
  return formatElementTitleAndName(context, element)
}
