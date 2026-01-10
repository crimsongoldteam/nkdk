import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"
import { LabelDecoration, LabelDecorationXML } from "~/metadata/forms/elements/labelDecoration/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportLabelDecorationToXML = (
  context: ConfigurationContext,
  data: LabelDecoration | undefined
): LabelDecorationXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormDecorationToXML(context, data)
  if (!baseFields) return undefined

  const result: LabelDecorationXML = {
    ...baseFields,
  }

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const border = exportBorderToXML(context, data.border)
  if (border !== undefined) result.Border = border

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.groupVerticalAlign !== undefined) result.GroupVerticalAlign = data.groupVerticalAlign

  if (data.horizontalAlign !== undefined) result.HorizontalAlign = data.horizontalAlign

  if (data.hyperlink !== undefined) result.Hyperlink = data.hyperlink

  if (data.titleHeight !== undefined) result.TitleHeight = data.titleHeight

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlign !== undefined) result.VerticalAlign = data.verticalAlign

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result)
}

registerMetadata("ExportToXML", "LabelDecoration", exportLabelDecorationToXML)
