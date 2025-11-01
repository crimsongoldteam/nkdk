import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TButtonGroupXML, TButtonGroup } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER: string[] = []

export const exportButtonGroupToXML = (data: TButtonGroup | undefined): TButtonGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TButtonGroupXML>( {
    ...base,
    Representation: data.representation,
  }, ORDER)
}

registerExport(ZElementType.enum.ButtonGroup, exportButtonGroupToXML)