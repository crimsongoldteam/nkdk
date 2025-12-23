import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { ButtonGroup, ButtonGroupXML } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportButtonGroupToXML = (context: Context, data: ButtonGroup | undefined): ButtonGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    Representation: data.representation,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
  })
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
