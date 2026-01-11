import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportExportReturn } from "../types"
import { sortObject } from "~/metadata/helpers/compactObject"

export const exportButtonGroupToXML = <T extends ButtonGroup | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, ButtonGroupXML> => {
  if (!data) return undefined as ImportExportReturn<T, ButtonGroupXML>

  const baseFields = exportFormGroupToXML(context, data)

  const result: ButtonGroupXML = {
    ...baseFields,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  if (data.representation !== undefined) result.Representation = data.representation

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return sortObject(result) as ImportExportReturn<T, ButtonGroupXML>
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
