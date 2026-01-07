import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportCommandBarToXML = (
  context: ConfigurationContext,
  data: CommandBar | undefined
): CommandBarXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToXML(context, data)
  if (!baseFields) return undefined

  const result: CommandBarXML = {
    ...baseFields,
  }

  if (data.autofill !== undefined) result.Autofill = data.autofill

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.horizontalAlign !== undefined) result.HorizontalAlign = data.horizontalAlign

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return result
}

registerMetadata<CommandBar>("ExportToXML", "CommandBar", exportCommandBarToXML)
