import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TCommandBarXML, TCommandBar } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportCommandBarToXML = (data: TCommandBar | undefined): TCommandBarXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    DisplayImportance: data.displayImportance,
    HorizontalAlign: data.horizontalAlign,
  }
}

registerExport(ZElementType.enum.CommandBar, exportCommandBarToXML)