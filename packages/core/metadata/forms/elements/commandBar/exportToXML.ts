import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { CommandBar, CommandBarXML } from "~/metadata/forms/elements/commandBar/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportCommandBarToXML = (context: Context, data: CommandBar | undefined): CommandBarXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    Autofill: data.autofill,
    _DisplayImportance: data.displayImportance,
    HorizontalAlign: data.horizontalAlign,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
  })
}

registerMetadata<CommandBar>("ExportToXML", "CommandBar", exportCommandBarToXML)
