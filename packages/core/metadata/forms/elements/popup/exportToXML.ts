import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML, exportI8nTextToXMLWithDefaultLanguage } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { Popup, PopupXML } from "~/metadata/forms/elements/popup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { PropertyRule } from "../calendarField/rules"
import { exportExtendedTooltipToDeprecatedXML } from "../extendedTooltip/exportToXML"

export function exportPopupToXML<From extends Popup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, undefined, data)

  const result: PopupXML = {
    ...baseFields,
  } as PopupXML

  const backColor = exportColorToXML(context, undefined, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, undefined, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const childItems = exportChildItemsToXML(context, undefined, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  if (data.enableContentChange !== undefined) result.EnableContentChange = data.enableContentChange

  if (data.enabled !== undefined) result.Enabled = data.enabled

  result.ExtendedTooltip = exportExtendedTooltipToDeprecatedXML(context, undefined, data.extendedTooltip, data)

  if (data.horizontalAlignInGroup !== undefined) result.GroupHorizontalAlign = data.horizontalAlignInGroup

  if (data.verticalAlignInGroup !== undefined) result.GroupVerticalAlign = data.verticalAlignInGroup

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  const picture = exportPictureToXML(context, undefined, data.picture)
  if (picture !== undefined) result.Picture = picture

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.representation !== undefined) result.Representation = data.representation

  if (data.shape !== undefined) result.Shape = data.shape

  if (data.shapeRepresentation !== undefined) result.ShapeRepresentation = data.shapeRepresentation

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  const title = exportI8nTextToXMLWithDefaultLanguage(context, undefined, data.title)
  if (title !== undefined) result.Title = title

  const titleFont = exportFontToXML(context, undefined, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  const titleTextColor = exportColorToXML(context, undefined, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, undefined, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  const userVisible = exportUserVisibleToXML(context, undefined, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  return result as ToXMLType<From>
}

registerMetadata("ExportToXML", "Popup", exportPopupToXML as ExportToXMLFn)
