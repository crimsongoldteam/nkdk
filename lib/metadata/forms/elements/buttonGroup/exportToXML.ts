import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ButtonGroup, ButtonGroupXML } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportButtonGroupToXML = (
  data: ButtonGroup | undefined,
  configurationSettings: ConfigurationSettings
): ButtonGroupXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data, configurationSettings)!,

    Representation: data.representation,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  }
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
