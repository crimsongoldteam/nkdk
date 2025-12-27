import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { ButtonGroup, ButtonGroupXML } from "~/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportButtonGroupToXML = (context: Context, data: ButtonGroup | undefined): ButtonGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    Representation: data.representation,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
  })
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
