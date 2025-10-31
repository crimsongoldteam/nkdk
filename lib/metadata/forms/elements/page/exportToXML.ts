import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TPageXML, TPage } from "./types"

export const exportPageToXML = (data: TPage | undefined): TPageXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    DisplayImportance: data.displayImportance,
    VerticalScrollOnReduceSize: data.verticalScrollOnReduceSize,
    VerticalAlign: data.verticalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    VerticalSpacing: data.verticalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    HorizontalSpacing: data.horizontalSpacing,
    Group: data.group,
    Picture: exportPictureToXML(data.picture),
    ShowTitle: data.showTitle,
    TitleDataPath: data.titleDataPath,
    Format: data.format,
    BackColor: exportColorToXML(data.backColor),
    SlaveItemsWidth: data.slaveItemsWidth,
  }
}