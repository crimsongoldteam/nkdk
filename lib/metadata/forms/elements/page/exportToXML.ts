import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TPageXML, TPage } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPageToXML = (data: TPage | undefined): TPageXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    BackColor: exportColorToXML(data.backColor),
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(data.format),
    Group: data.group,
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Picture: exportPictureToXML(data.picture),
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    TitleDataPath: data.titleDataPath,
    VerticalAlign: data.verticalAlign,
    VerticalScrollOnReduceSize: data.verticalScrollOnReduceSize,
    VerticalSpacing: data.verticalSpacing,
  }
}

registerExport(ZElementType.enum.Page, exportPageToXML)