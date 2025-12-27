import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { ButtonGroup, ButtonGroupXML } from "~/packages/core/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToXML } from "~/packages/core/metadata/forms/elements/formGroup/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportButtonGroupToXML = (context: Context, data: ButtonGroup | undefined): ButtonGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    Representation: data.representation,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
  })
}

registerMetadata("ExportToXML", "ButtonGroup", exportButtonGroupToXML)
