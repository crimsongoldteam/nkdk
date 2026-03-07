import { ConfigurationContext } from "~/metadata/context/types"
import {
  formatDefaultLanguageText,
  formatElementName,
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
  const header = formatTitle(element, title) + InputFieldSeparator
  const namePart = formatNamePart(element, title)

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

  const title = formatElementTitleAndName(context, element)

  const result: ToNKDKResult = {
    strings: [title],
    toOneLineGroup: true,
  }

  return result
}

const formatTitle = (element: InputField, title: string | undefined): string => {
  if (title === undefined) return formatElementName(element)

  return title
}

const formatNamePart = (element: InputField, title: string | undefined): string => {
  if (title === undefined) return ""

  return formatElementName(element)
}
