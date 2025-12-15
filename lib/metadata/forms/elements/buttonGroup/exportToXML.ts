import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportButtonGroupToXML = (data: ButtonGroup | undefined): ButtonGroupXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

    Representation: data.representation,
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.ButtonGroup, exportButtonGroupToXML)
