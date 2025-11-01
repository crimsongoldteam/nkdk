import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TButtonGroupXML, TButtonGroup } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportButtonGroupToXML = (data: TButtonGroup | undefined): TButtonGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    Representation: data.representation,
  }
}

registerExport(ZElementType.enum.ButtonGroup, exportButtonGroupToXML)