import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportButtonGroupChildItemsToXML } from "~/metadata/forms/collections/buttonGroupChildItems/exportToXML"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { exportFormGroupPropsToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"

export function exportCommandBarToXML<From extends CommandBar | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportFormGroupPropsToXML(context, data)

  const result: CommandBarXML = {
    ...baseFields,
  }

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  if (data.autofill !== undefined) result.Autofill = data.autofill

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.horizontalAlign !== undefined) result.HorizontalAlign = data.horizontalAlign

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "CommandBar", exportCommandBarToXML)
