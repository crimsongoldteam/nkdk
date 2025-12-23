import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ButtonGroup, ButtonGroupXML } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportButtonGroupToXML = (
  configurationSettings: ConfigurationSettings,
  data: ButtonGroup | undefined
): ButtonGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(configurationSettings, data)!,

    Representation: data.representation,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
  })
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
