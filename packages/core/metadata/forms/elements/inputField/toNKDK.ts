import { ConfigurationContext } from "~/metadata/context/types"
import { formatDefaultLanguageText, formatElementName } from "~/metadata/forms/format/helpers"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { InputFieldSeparator } from "~/nkdk/lexer"
import { InputField } from "./types"

export const exportInputFieldToNKDK = (params: {
  context: ConfigurationContext
  element: InputField
}): ToNKDKResult => {
  const { context, element } = params

  const title = formatDefaultLanguageText(context, element.title)

  let header = formatTitle(element, title)

  header += InputFieldSeparator

  let namePart = formatNamePart(element, title)

  let result: ToNKDKResult = {
    strings: [header + namePart],
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
