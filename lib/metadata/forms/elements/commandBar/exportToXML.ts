import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CommandBar, CommandBarXML } from "~/lib/metadata/forms/elements/commandBar/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportCommandBarToXML = (
  configurationSettings: ConfigurationSettings,
  data: CommandBar | undefined
): CommandBarXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(configurationSettings, data)!,

    Autofill: data.autofill,
    _DisplayImportance: data.displayImportance,
    HorizontalAlign: data.horizontalAlign,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
  })
}

registerMetadata<CommandBar>("ExportToXML", "CommandBar", exportCommandBarToXML)
