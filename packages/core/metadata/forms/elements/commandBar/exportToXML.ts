import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportExportReturn } from "../types"

export const exportCommandBarToXML = <T extends CommandBar | undefined>(
  context: ConfigurationContext,
  data: T
): ImportExportReturn<T, CommandBarXML> => {
  if (!data) return undefined as ImportExportReturn<T, CommandBarXML>

  const baseFields = exportFormGroupToXML(context, data)

  const result: ImportExportReturn<T, CommandBarXML> = {
    ...baseFields,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  if (data.autofill !== undefined) result.Autofill = data.autofill

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.horizontalAlign !== undefined) result.HorizontalAlign = data.horizontalAlign

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return sortObject(result) as ImportExportReturn<T, CommandBarXML>
}

registerMetadata<CommandBar>("ExportToXML", "CommandBar", exportCommandBarToXML)
