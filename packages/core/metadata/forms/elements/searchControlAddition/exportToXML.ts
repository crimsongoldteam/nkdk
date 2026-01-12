import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { SearchControlAddition, SearchControlAdditionXML } from "~/metadata/forms/elements/searchControlAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { BaseElement } from "../baseElement/types"
import { getSearchControlAdditionName } from "./helper"

export const exportSearchControlAdditionToXML = (
  context: ConfigurationContext,
  data: SearchControlAddition | undefined,
  parentElement: BaseElement
): SearchControlAdditionXML => {
  const element = data ?? {
    childItems: [],
  }

  const name = getSearchControlAdditionName(parentElement)

  const baseFields = exportElementPropsToXML(context, { name })

  const result: SearchControlAdditionXML = {
    AdditionSource: {
      Item: parentElement.name,
      Type: "SearchControlAddition",
    },
    ...baseFields,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, element.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  if (element.autoMaxWidth !== undefined) result.AutoMaxWidth = element.autoMaxWidth

  const backColor = exportColorToXML(context, element.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, element.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const font = exportFontToXML(context, element.font)
  if (font !== undefined) result.Font = font

  if (element.horizontalStretch !== undefined) result.HorizontalStretch = element.horizontalStretch

  if (element.maxWidth !== undefined) result.MaxWidth = element.maxWidth

  const textColor = exportColorToXML(context, element.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const userVisible = exportUserVisibleToXML(context, element.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (element.width !== undefined) result.Width = element.width

  return sortObject(result)
}

registerMetadata("ExportToXML", "SearchControlAddition", exportSearchControlAdditionToXML)
