import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportCommandBarToXML = (data: CommandBar | undefined): CommandBarXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

    Autofill: data.autofill,
    _DisplayImportance: data.displayImportance,
    HorizontalAlign: data.horizontalAlign,
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.CommandBar, exportCommandBarToXML)
