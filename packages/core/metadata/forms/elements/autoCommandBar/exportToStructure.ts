import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToStructure } from "../../collections/buttonGroupChildItems/exportToStructure"
import { wrapButtonContent } from "../../format/helpers"
import { IFormatElementResult } from "../../format/types"
import { AutoCommandBar } from "./types"

export const exportAutoCommandBarToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar | undefined
): IFormatElementResult => {
  if (!element) return { strings: [], haveSimpleHorizontalGroup: false }

  const hasAutofill = element.autofill != false
  const hasButtons = element.childItems && element.childItems.length > 0

  // Если есть и autofill, и кнопки, разделяем на две строки
  if (hasAutofill && hasButtons) {
    const autofillContent = wrapButtonContent("...")
    const buttons = exportButtonGroupChildItemsToStructure(context, element.childItems)
    const buttonsContent = wrapButtonContent("... | " + buttons.join(" | "))

    return {
      strings: [autofillContent, buttonsContent],
      haveSimpleHorizontalGroup: false,
    }
  }

  const content = exportAutoCommandBarContentToStructure(context, element)

  return {
    strings: [content],
    haveSimpleHorizontalGroup: false,
  }
}

export const exportAutoCommandBarContentToStructure = (
  context: ConfigurationContext,
  element: AutoCommandBar
): string => {
  const buttons = []

  if (element.autofill != false) {
    buttons.push("...")
  }

  buttons.push(...exportButtonGroupChildItemsToStructure(context, element.childItems))

  const content = buttons.length > 0 ? buttons.join(" | ") : ""
  const finalContent = buttons.length === 1 && buttons[0] === "..." ? "...|" : content || "|"

  return wrapButtonContent(finalContent)
}
