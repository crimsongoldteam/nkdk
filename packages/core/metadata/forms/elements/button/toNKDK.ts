import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { formatElementTitleAndName, wrapButtonContent } from "../../format/helpers"
import { Button, CommandBarButton } from "./types"

export const exportButtonToNKDK = (params: { context: ConfigurationContext; element: Button }): ToNKDKResult => {
  const { context, element } = params
  const content = formatButtonContent(context, element)
  const resultString = wrapButtonContent(content)
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

export const exportButtonContentToNKDK = (params: { context: ConfigurationContext; element: Button }): ToNKDKResult => {
  const { context, element } = params
  const resultString = formatButtonContent(context, element)
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

export const exportCommandBarButtonToNKDK = (params: {
  context: ConfigurationContext
  element: CommandBarButton
}): ToNKDKResult => {
  const { context, element } = params
  const content = formatElementTitleAndName(context, element)
  const resultString = element.type === "CommandBarHyperlink" ? `~${content}` : content
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

const formatButtonContent = (context: ConfigurationContext, element: Button): string => {
  const content = formatElementTitleAndName(context, element)
  return element.type === "Hyperlink" ? `~${content}` : content
}
