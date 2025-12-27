import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { CommandBar, CommandBarXML } from "~/packages/core/metadata/forms/elements/commandBar/types"
import { exportFormGroupToXML } from "~/packages/core/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

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
