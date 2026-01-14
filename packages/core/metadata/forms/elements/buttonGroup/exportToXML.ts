import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { ImportExportReturn } from "../types"
import { exportFormGroupPropsToXML } from "../formGroup/exportToXML"

export function exportButtonGroupToXML<From extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToXMLType<From>> {
  if (data === undefined) return undefined as ImportExportReturn<From, ToXMLType<From>>

  const baseFields = exportFormGroupPropsToXML(context, data)

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  const extendedTooltip = exportExtendedTooltipToXML(context, data.extendedTooltip, data)

  const result: ButtonGroupXML = {
    ...baseFields,
    ExtendedTooltip: extendedTooltip,
  }

  if (childItems !== undefined) result.ChildItems = childItems

  result.ExtendedTooltip = extendedTooltip

  if (data.representation !== undefined) result.Representation = data.representation

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return sortObject(result) as ImportExportReturn<From, ToXMLType<From>>
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
