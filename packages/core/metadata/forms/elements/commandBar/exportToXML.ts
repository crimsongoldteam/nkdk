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

  return {
    const baseFields = exportFormGroupToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    Autofill: data.autofill,
    _DisplayImportance: data.displayImportance,
    HorizontalAlign: data.horizontalAlign,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),  }
}

registerMetadata<CommandBar>("ExportToXML", "CommandBar", exportCommandBarToXML)
