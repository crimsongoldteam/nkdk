import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/metadata/forms/elements/formItemAddition/exportToXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/metadata/forms/elements/viewStatusAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportViewStatusAdditionToXML = (
  context: ConfigurationContext,
  data: ViewStatusAddition | undefined
): ViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormItemAdditionToXML(context, data)
  if (!baseFields) return undefined

  const result: ViewStatusAdditionXML = {
    ...baseFields,
  }

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const border = exportBorderToXML(context, data.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const buttonsBackColor = exportColorToXML(context, data.buttonsBackColor)
  if (buttonsBackColor !== undefined) result.ButtonsBackColor = buttonsBackColor

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  if (data.horizontalAlign !== undefined) result.HorizontalAlign = data.horizontalAlign

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  const textColor = exportColorToXML(context, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const titleFont = exportFontToXML(context, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.width !== undefined) result.Width = data.width

  return result
}

registerMetadata("ExportToXML", "ViewStatusAddition", exportViewStatusAdditionToXML)
