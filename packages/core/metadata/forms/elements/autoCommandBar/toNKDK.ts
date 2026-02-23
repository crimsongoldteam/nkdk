import { ConfigurationContext } from "~/metadata/context/types"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import {
  AutoCommandBarAutofillPrefix,
  AutoCommandBarPrefix,
  AutoCommandBarSeparator,
  AutoCommandBarSuffix,
} from "~/nkdk/terminal"
import { exportChildItemsContentToNKDK } from "../../commonObjects/childItems/toNKDK"
import { AutoCommandBar } from "./types"

export const exportAutoCommandBarToNKDK = (params: {
  context: ConfigurationContext
  element: AutoCommandBar | undefined
}): ToNKDKResult => {
  const { context, element } = params
  if (!element) return { strings: [], toOneLineGroup: false }

  const buttonStrings = exportChildItemsContentToNKDK(context, element.childItems)
  const autofill = element.autofill !== false

  const content = formatContent(buttonStrings.strings, autofill)

  return {
    strings: [content],
    toOneLineGroup: false,
  }
}

export const formatContent = (buttonStrings: string[], autofill: boolean = false): string => {
  const buttons = autofill ? [AutoCommandBarAutofillPrefix, ...buttonStrings] : buttonStrings

  const content = buttons.length > 0 ? buttons.join(AutoCommandBarSeparator) : ""

  return `${AutoCommandBarPrefix}${content}${AutoCommandBarSuffix}`
}
