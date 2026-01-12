import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { ImportExportReturn } from "../types"
import { exportFormGroupPropsToXML } from "../formGroup/exportToXML"

export const exportButtonGroupToXML = <T extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, ButtonGroupXML> => {
  if (!data) return undefined as ImportExportReturn<T, ButtonGroupXML>

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

  return sortObject(result) as ImportExportReturn<T, ButtonGroupXML>
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
