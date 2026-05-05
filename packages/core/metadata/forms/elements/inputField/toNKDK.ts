import { ConfigurationContext } from "~/metadata/context/types"
import {
  formatDefaultLanguageText,
  formatElementNameWithDataPath,
  formatElementTitleAndName,
} from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { InputFieldSeparator } from "~/nkdk/terminal"
import { InputField } from "./types"

export const exportInputFieldToNKDK = (params: {
  context: ConfigurationContext
  element: InputField
}): ToNKDKResult => {
  const { context, element } = params

  const title = formatDefaultLanguageText(context, element.title)
  const header = formatTitle(context, element, title) + InputFieldSeparator
  const namePart = formatNamePart(context, element, title)

  const result: ToNKDKResult = {
    strings: [header + namePart],
    toOneLineGroup: true,
  }

  return result
}

export const exportInputFieldContentToNKDK = (params: {
  context: ConfigurationContext
  element: InputField
}): ToNKDKResult => {
  const { context, element } = params

  const title = formatElementTitleAndName(context, element, false, true)

  const result: ToNKDKResult = {
    strings: [title],
    toOneLineGroup: true,
  }

  return result
}

const formatTitle = (context: ConfigurationContext, element: InputField, title: string | undefined): string => {
  if (title === undefined) return formatElementNameWithDataPath({ context, element })

  return title
}

const formatNamePart = (context: ConfigurationContext, element: InputField, title: string | undefined): string => {
  if (title === undefined) return ""

  return formatElementNameWithDataPath({ context, element })
}
