import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportPageToXML = (data: Page | undefined): PageXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

    BackColor: exportColorToXML(data.backColor),
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(data.format),
    Group: data.group,
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Picture: exportPictureToXML(data.picture),
    ScrollOnCompress: data.scrollOnCompress,
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    TitleDataPath: data.titleDataPath,
    VerticalAlign: data.verticalAlign,
    VerticalScrollOnReduceSize: data.verticalScrollOnReduceSize,
    VerticalSpacing: data.verticalSpacing,
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.Page, exportPageToXML)
