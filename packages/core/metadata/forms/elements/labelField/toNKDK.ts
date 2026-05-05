import { ConfigurationContext } from "~/metadata/context/types"
import {
  formatDefaultLanguageText,
  formatElementName,
  formatElementTitleAndName,
} from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/orchestration/formElement/toNKDK/types"
import { InputFieldSeparator, LabelFieldPrefix } from "~/nkdk/terminal"
import { LabelField, TableLabelField } from "./types"

export const exportLabelFieldToNKDK = (params: {
  context: ConfigurationContext
  element: LabelField
}): ToNKDKResult => {
  const { context, element } = params

  const title = formatDefaultLanguageText(context, element.title)
  const header = formatTitle(element, title) + InputFieldSeparator
  const namePart = formatNamePart(element, title)

  const result: ToNKDKResult = {
    strings: [LabelFieldPrefix + header + namePart],
    toOneLineGroup: true,
  }

  return result
}

export const exportLabelFieldContentToNKDK = (params: {
  context: ConfigurationContext
  element: LabelField
}): ToNKDKResult => {
  const { context, element } = params

  const title = formatElementTitleAndName(context, element)

  const result: ToNKDKResult = {
    strings: [LabelFieldPrefix + title],
    toOneLineGroup: true,
  }

  return result
}

export const exportTableLabelFieldContentToNKDK = (params: {
  context: ConfigurationContext
  element: TableLabelField
}): ToNKDKResult => {
  return exportLabelFieldContentToNKDK({
    context: params.context,
    element: params.element as unknown as Parameters<typeof exportLabelFieldContentToNKDK>[0]["element"],
  })
}

const formatTitle = (element: LabelField, title: string | undefined): string => {
  if (title === undefined) return formatElementName(element)

  return title
}

const formatNamePart = (element: LabelField, title: string | undefined): string => {
  if (title === undefined) return ""

  return formatElementName(element)
}
