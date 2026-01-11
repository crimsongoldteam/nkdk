import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/metadata/forms/elements/formItemAddition/exportToXML"
import { SearchStringAddition, SearchStringAdditionXML } from "~/metadata/forms/elements/searchStringAddition/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSearchStringAdditionToXML = (
  context: ConfigurationContext,
  data: SearchStringAddition | undefined
): SearchStringAdditionXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormItemAdditionToXML(context, data)
  if (!baseFields) return undefined

  const result: SearchStringAdditionXML = {
    ...baseFields,
  }

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  const textColor = exportColorToXML(context, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.width !== undefined) result.Width = data.width

  return sortObject(result)
}

registerMetadata("ExportToXML", "SearchStringAddition", exportSearchStringAdditionToXML)
