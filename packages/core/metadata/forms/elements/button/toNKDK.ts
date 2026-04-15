import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { formatElementTitleAndName, wrapButtonContent } from "../../format/helpers"
import { Button, CommandBarButton } from "./types"

export const exportButtonToNKDK = (params: { context: ConfigurationContext; element: Button }): ToNKDKResult => {
  const { context, element } = params
  const resultString = wrapButtonContent(formatContent(context, element))
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

export const exportButtonContentToNKDK = (params: { context: ConfigurationContext; element: Button }): ToNKDKResult => {
  const { context, element } = params
  const resultString = formatContent(context, element)
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
  const resultString = wrapButtonContent(formatElementTitleAndName(context, element))
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

export const exportCommandBarButtonContentToNKDK = (params: {
  context: ConfigurationContext
  element: CommandBarButton
}): ToNKDKResult => {
  const { context, element } = params
  const resultString = formatElementTitleAndName(context, element)
  return {
    strings: [resultString],
    toOneLineGroup: true,
  }
}

const formatContent = (context: ConfigurationContext, element: Button): string => {
  return formatElementTitleAndName(context, element)
}
