import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { FormGroup, FormGroupXML } from "~/metadata/forms/elements/formGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export const importFormGroupFromXML = <From extends FormGroupXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FormGroup> => {
  if (!xml) return undefined as ImportExportReturn<From, FormGroup>
  const baseFields = importBaseElementFromXML(context, xml)

  const result: ImportExportReturn<From, FormGroup> = {
    ...baseFields,
    elementType: FormElementType.FormGroup,
  }

  if (xml.EnableContentChange !== undefined) result.enableContentChange = xml.EnableContentChange

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  // const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip, result)
  // result.extendedTooltip = extendedTooltip

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const titleFont = importFontFromXML(context, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  const titleTextColor = importColorFromXML(context, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  return result
}

registerMetadata("ImportFromXML", "FormGroup", importFormGroupFromXML)
